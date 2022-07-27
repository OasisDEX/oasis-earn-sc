import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'

import WETH_ABI from '../abi/IWETH.json'
import { ADDRESSES } from '../helpers/addresses'
import { CONTRACT_NAMES, ONE } from '../helpers/constants'
import { createDeploy } from '../helpers/deploy'
import init from '../helpers/init'
import { swapOneInchTokens } from '../helpers/swap/1inch'
import { calculateFee } from '../helpers/swap/calculateFee'
import { FEE } from '../helpers/swap/DummyExchange'
import { RuntimeConfig } from '../helpers/types/common'
import { amountToWei, asPercentageValue, balanceOf } from '../helpers/utils'
import { ServiceRegistry } from '../helpers/wrappers/serviceRegistry'
import { swap, uniswapV3Swap, unoswap } from './fixtures/oneInchFixtures'
import { expectToBe, expectToBeEqual } from './utils'

describe('uSwapp', () => {
  let uSwap: Contract
  let config: RuntimeConfig
  let registry: ServiceRegistry
  let WETH: Contract
  let DAI: Contract

  before(async () => {
    config = await init()
    const deploy = await createDeploy({ config })

    await config.provider.send('hardhat_reset', [
      {
        forking: {
          jsonRpcUrl: process.env.MAINNET_URL,
        },
      },
    ])

    const [serviceRegistry] = await deploy('ServiceRegistry', [0])
    registry = new ServiceRegistry(serviceRegistry.address, config.signer)

    await registry.addEntry(CONTRACT_NAMES.common.UNISWAP_ROUTER, ADDRESSES.main.uniswapRouterV3)
    const [_uSwap] = await deploy('uSwap', [
      config.address,
      ADDRESSES.main.feeRecipient,
      FEE,
      serviceRegistry.address,
    ])
    uSwap = _uSwap

    WETH = new ethers.Contract(ADDRESSES.main.WETH, WETH_ABI, config.provider).connect(
      config.signer,
    )
    DAI = new ethers.Contract(ADDRESSES.main.DAI, WETH_ABI, config.provider).connect(config.signer)
    await uSwap.setPool(WETH.address, DAI.address, 3000)
    await uSwap.setPool(DAI.address, WETH.address, 3000)
  })

  describe('WETH to DAI, fee in WETH', () => {
    const amountInWei = amountToWei(new BigNumber(10))
    const fee = calculateFee(amountInWei, FEE)
    const depositAmountWithFeeWei = amountInWei.plus(fee)
    const slippage = asPercentageValue(10, 100)

    let receiveAtLeast: BigNumber

    before(async () => {
      const response = await swapOneInchTokens(
        ADDRESSES.main.WETH,
        ADDRESSES.main.DAI,
        amountInWei.toFixed(0),
        uSwap.address,
        slippage.value.toFixed(),
      )

      receiveAtLeast = new BigNumber(response.toTokenAmount).times(ONE.minus(slippage.asDecimal))

      await WETH.deposit({ value: depositAmountWithFeeWei.toFixed(0) })
      await WETH.approve(uSwap.address, depositAmountWithFeeWei.toFixed(0))
      await uSwap.swapTokens([
        ADDRESSES.main.WETH,
        ADDRESSES.main.DAI,
        depositAmountWithFeeWei.toFixed(0),
        receiveAtLeast.toFixed(0),
        FEE,
        response.tx.data,
        true,
      ])
    })

    it('Performs swap WETH to DAI', async () => {
      const daiBalance = await balanceOf(DAI.address, config.address, { config })

      expectToBe(daiBalance, 'gte', receiveAtLeast)
    })

    it('Pays fee in WETH', async () => {
      const feeWallet = await balanceOf(WETH.address, ADDRESSES.main.feeRecipient, { config })
      expectToBeEqual(feeWallet, fee)
    })
  })

  describe('Decodes 1inch calldata:', () => {
    it('swap', async () => {
      const minReturn = await uSwap.decodeOneInchCallData(swap)

      expect(minReturn).to.eq('253155553433896897812874325')
    })

    it('unoswap', async () => {
      const minReturn = await uSwap.decodeOneInchCallData(unoswap)

      expect(minReturn).to.eq('1545434805092')
    })

    it('uniswapV3Swap', async () => {
      const minReturn = await uSwap.decodeOneInchCallData(uniswapV3Swap)

      expect(minReturn).to.eq('6227917975974974414')
    })
  })
})
