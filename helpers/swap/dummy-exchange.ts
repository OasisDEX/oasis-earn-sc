import BigNumber from 'bignumber.js'
import _ from 'lodash'
import { curry } from 'ramda'
import { ethers } from 'hardhat'
import { Contract, Signer } from 'ethers'

import WETHABI from '../../abi/IWETH.json'
import ERC20ABI from '../../abi/IERC20.json'
import { ADDRESSES } from '../../helpers/addresses'

import { JsonRpcProvider } from '@ethersproject/providers'
import { ZERO } from '../constants'

import { OneInchBaseResponse, OneInchSwapResponse } from '../types'
import { exchangeTokens, formatOneInchSwapUrl } from './1inch'
import { swapUniswapTokens } from './uniswap'
import { amountToWei, balanceOf } from '../utils'

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
    ADDRESSES.main.ETH,
    token.address,
    amountToWei(200).toFixed(0),
    amountToWei(ZERO, token.precision).toFixed(0),
    address,
    { provider, signer },
  )
}

async function transferToExchange(
  provider: JsonRpcProvider,
  signer: Signer,
  exchangeAddress: string,
  token: ERC20TokenData,
  amount: BigNumber.Value,
) {
  const contract = new ethers.Contract(token.address, ERC20ABI, provider).connect(signer)

  const tokenTransferToExchangeTx = await contract.transfer(exchangeAddress, amount)

  await tokenTransferToExchangeTx.wait()
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
  const transferToExchangeCurried = curry(transferToExchange)(provider, signer, exchange.address)

  const wethDeposit = await WETH.deposit({
    value: amountToWei(1000).toFixed(0),
  })
  await wethDeposit.wait()

  const wethTransferToExchangeTx = await WETH.transfer(
    exchange.address,
    amountToWei(500).toFixed(0),
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
      return transferToExchangeCurried(token, balance.div(2).toFixed(0))
    }),
  )

  if (debug) {
    // Diplays balances of the exchange and account for each token
    await Promise.all(
      erc20Tokens.map(async function (token) {
        const [exchangeTokenBalance, addressTokenBalance] = await Promise.all([
          balanceOf(token.address, exchange.address),
          balanceOf(token.address, address),
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
      name: 'ETH',
      address: ADDRESSES.main.common.WETH,
      pip: ADDRESSES.main.maker.pipWETH,
      precision: 18,
    },
    {
      name: 'DAI',
      address: ADDRESSES.main.common.DAI,
      pip: undefined,
      precision: 18,
    },
    {
      name: 'LINK',
      address: ADDRESSES.main.common.LINK,
      pip: ADDRESSES.main.maker.pipLINK,
      precision: 18,
    },
    {
      name: 'WBTC',
      address: ADDRESSES.main.common.WBTC,
      pip: ADDRESSES.main.maker.pipWBTC,
      precision: 8,
    },
    {
      name: 'USDC',
      address: ADDRESSES.main.USDC,
      pip: ADDRESSES.main.PIP_USDC,
      precision: 6,
    },
  ]

  // Exchanging ETH for other @tokens
  await addFundsDummyExchange(
    provider,
    signer,
    WETH_ADDRESS,
    tokens.filter(token => token.address !== ADDRESSES.main.ETH),
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
        const price = await getMarketPrice(token.address, ADDRESSES.main.DAI, token.precision)
        const priceInWei = amountToWei(price).toFixed(0)

        if (debug) {
          console.log(`${token.name} Price: ${price.toString()} and Price(wei): ${priceInWei}`)
        }

        if (dummyExchangeInstance.setPrice) {
          return dummyExchangeInstance.setPrice(token.address, priceInWei)
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

export async function exchangeFromDAI(
  toTokenAddress: string,
  amount: string,
  slippage: string,
  recepient: string,
  protocols: string[] = [],
): Promise<OneInchSwapResponse> {
  const url = formatOneInchSwapUrl(
    ADDRESSES.main.DAI,
    toTokenAddress,
    amount,
    slippage,
    recepient,
    protocols,
  )

  return exchangeTokens(url)
}

export async function exchangeToDAI(
  fromTokenAddress: string,
  amount: string,
  recepient: string,
  slippage: string,
  protocols: string[] = [],
): Promise<OneInchSwapResponse> {
  const url = formatOneInchSwapUrl(
    fromTokenAddress,
    ADDRESSES.main.DAI,
    amount,
    slippage,
    recepient,
    protocols,
  )

  return exchangeTokens(url)
}
