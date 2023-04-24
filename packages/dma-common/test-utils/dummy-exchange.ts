import { ONE } from '@dma-common/constants'
import { swapUniswapTokens } from '@dma-common/test-utils/uniswap'
import { OneInchBaseResponse } from '@dma-common/types/common'
import { balanceOf } from '@dma-common/utils/balances'
import { amountFromWei, amountToWei } from '@dma-common/utils/common'
import { send } from '@dma-common/utils/tx'
import { JsonRpcProvider } from '@ethersproject/providers'
import WETHABI from '@oasisdex/abis/external/tokens/IWETH.json'
import { ADDRESSES } from '@oasisdex/addresses'
import { Network } from '@oasisdex/dma-deployments/types/network'
import BigNumber from 'bignumber.js'
import { Contract, ethers, Signer } from 'ethers'
import fetch from 'node-fetch'
import { curry } from 'ramda'

export const FEE = 20
export const FEE_BASE = 10000

export interface ERC20TokenData {
  name: string
  address: string
  precision: number
  pip?: string
}

export async function getMarketPrice(
  from: string,
  to: string,
  fromPrecision = 18,
  toPrecision = 18,
) {
  const amount = ethers.utils.parseUnits('0.1', fromPrecision)
  const url = `https://api.1inch.exchange/v4.0/1/quote?fromTokenAddress=${from}&toTokenAddress=${to}&amount=${amount}&protocols=UNISWAP_V3`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Error performing 1inch quote request ${url}: ${await response.text()}`)
  }

  const result = (await response.json()) as OneInchBaseResponse

  const fromTokenAmount = new BigNumber(
    ethers.utils.formatUnits(result.fromTokenAmount, fromPrecision),
  )
  const toTokenAmount = new BigNumber(ethers.utils.formatUnits(result.toTokenAmount, toPrecision))

  return toTokenAmount.div(fromTokenAmount)
}

async function exchangeToToken(provider: JsonRpcProvider, signer: Signer, token: ERC20TokenData) {
  const address = await signer.getAddress()
  await swapUniswapTokens(
    ADDRESSES[Network.MAINNET].common.WETH,
    token.address,
    amountToWei(200).toFixed(0),
    amountToWei(ONE, token.precision).toFixed(0),
    address,
    { provider, signer },
  )
}

const addFundsDummyExchange = async function (
  provider: JsonRpcProvider,
  signer: Signer,
  weth: string, // TODO: remove
  erc20Tokens: ERC20TokenData[], // TODO:
  exchange: Contract,
  debug: boolean,
) {
  const WETH = new ethers.Contract(weth, WETHABI, provider).connect(signer)
  const address = await signer.getAddress()

  const exchangeToTokenCurried = curry(exchangeToToken)(provider, signer)

  const transferToExchangeCurried = curry(send)(exchange.address)

  const wethDeposit = await WETH.deposit({
    value: amountToWei(2000).toFixed(0),
  })
  await wethDeposit.wait()

  const wethTransferToExchangeTx = await WETH.transfer(
    exchange.address,
    amountToWei(1000).toFixed(0),
  )
  await wethTransferToExchangeTx.wait()

  // Exchange ETH for the `token`
  await Promise.all(erc20Tokens.map(token => exchangeToTokenCurried(token)))

  const options = {
    config: { provider, signer, address },
  }

  // Transfer half of the accounts balance of each token to the dummy exchange.
  await Promise.all(
    erc20Tokens.map(async token => {
      const balance = new BigNumber(await balanceOf(token.address, address, options))
      return transferToExchangeCurried(token.address, balance.div(2).toFixed(0))
    }),
  )

  if (debug) {
    // Diplays balances of the exchange and account for each token
    await Promise.all(
      erc20Tokens.map(async function (token) {
        const [exchangeTokenBalance, addressTokenBalance] = await Promise.all([
          balanceOf(token.address, exchange.address, options),
          balanceOf(token.address, address, options),
        ])
        console.log(
          `Exchange ${token.name} balance: ${amountFromWei(
            exchangeTokenBalance,
            token.precision,
          ).toString()}`,
        )
        console.log(
          `${address} ${token.name} balance: ${amountFromWei(
            addressTokenBalance,
            token.precision,
          ).toString()}`,
        )
      }),
    )
  }
}

export async function loadDummyExchangeFixtures(
  provider: JsonRpcProvider,
  signer: Signer,
  dummyExchangeInstance: Contract,
  debug: boolean,
) {
  const tokens = [
    {
      name: 'WETH',
      address: ADDRESSES[Network.MAINNET].common.WETH,
      pip: ADDRESSES[Network.MAINNET].maker.PipWETH,
      precision: 18,
    },
    {
      name: 'stETH',
      address: ADDRESSES[Network.MAINNET].common.STETH,
      pip: ADDRESSES[Network.MAINNET].maker.PipWETH,
      precision: 18,
    },
    {
      name: 'DAI',
      address: ADDRESSES[Network.MAINNET].common.DAI,
      pip: undefined,
      precision: 18,
    },
    {
      name: 'LINK',
      address: ADDRESSES[Network.MAINNET].common.LINK,
      pip: ADDRESSES[Network.MAINNET].maker.PipLINK,
      precision: 18,
    },
  ]

  // Exchanging ETH for other @tokens
  await addFundsDummyExchange(
    provider,
    signer,
    ADDRESSES[Network.MAINNET].common.WETH,
    tokens.filter(
      token =>
        token.address !== ADDRESSES[Network.MAINNET].common.WETH &&
        token.address !== ADDRESSES[Network.MAINNET].common.STETH,
    ),
    dummyExchangeInstance,
    debug,
  )

  // Setting precision for each @token that is going to be used.
  await Promise.all(
    tokens.map(token => {
      if (debug) {
        console.log(`${token.name} precision: ${token.precision}`)
      }

      if (dummyExchangeInstance.setPrecision) {
        return dummyExchangeInstance.setPrecision(token.address, token.precision)
      }

      return true
    }),
  )

  // Setting price for each @token that has PIP
  await Promise.all(
    tokens
      .filter(token => !!token.pip)
      .map(async token => {
        const price = await getMarketPrice(
          token.address,
          ADDRESSES[Network.MAINNET].common.DAI,
          token.precision,
        )
        const priceInWei = amountToWei(price).toFixed(0)

        if (debug) {
          console.log(
            `${token.name} ${
              token.address
            } Price: ${price.toString()} and Price(wei): ${priceInWei}`,
          )
        }

        if (dummyExchangeInstance.setPrice) {
          if (token.address === ADDRESSES[Network.MAINNET].common.STETH) {
            const priceInWeiStEth = amountToWei(ONE).toFixed(0)
            return dummyExchangeInstance.setPrice(token.address, priceInWeiStEth)
          } else {
            return dummyExchangeInstance.setPrice(token.address, priceInWei)
          }
        }

        return true
      }),
  )

  if (debug) {
    tokens.forEach(token => {
      console.log(`${token.name}: ${token.address}`)
    })
  }
}
