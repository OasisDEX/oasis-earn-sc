import { JsonRpcProvider } from '@ethersproject/providers'
import { ADDRESSES, OPERATION_NAMES, strategy, ZERO } from '@oasisdex/oasis-actions'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { Contract, ContractReceipt, Signer } from 'ethers'

import AAVEDataProviderABI from '../../abi/aaveDataProvider.json'
import AAVELendigPoolABI from '../../abi/aaveLendingPool.json'
import ERC20ABI from '../../abi/IERC20.json'
import { executeThroughProxy } from '../../helpers/deploy'
import init, { resetNode, resetNodeToLatestBlock } from '../../helpers/init'
import { swapOneInchTokens } from '../../helpers/swap/1inch'
import { RuntimeConfig } from '../../helpers/types/common'
import { amountToWei, balanceOf } from '../../helpers/utils'
import { testBlockNumber } from '../config'
import { DeployedSystemInfo, deploySystem } from '../deploySystem'
import { expectToBe, expectToBeEqual } from '../utils'

const oneInchCallMock =
  (marketPrice: BigNumber) =>
  async (from: string, to: string, amount: BigNumber, slippage: BigNumber) => {
    return {
      fromTokenAddress: from,
      toTokenAddress: to,
      fromTokenAmount: amount,
      toTokenAmount: amount.div(marketPrice),
      minToTokenAmount: amount
        .div(marketPrice)
        .times(new BigNumber(1).minus(slippage))
        .integerValue(BigNumber.ROUND_DOWN), // TODO: figure out slippage
      exchangeCalldata: 0,
    }
  }

const getOneInchRealCall =
  (swapAddress: string) =>
  async (from: string, to: string, amount: BigNumber, slippage: BigNumber) => {
    const response = await swapOneInchTokens(
      from,
      to,
      amount.toString(),
      swapAddress,
      slippage.toString(),
    )
    console.log(JSON.stringify(response, null, 4))
    return {
      toTokenAddress: to,
      fromTokenAddress: from,
      minToTokenAmount: new BigNumber(0),
      toTokenAmount: new BigNumber(response.toTokenAmount),
      fromTokenAmount: new BigNumber(response.fromTokenAmount),
      exchangeCalldata: response.tx.data,
    }
  }

interface AAVEReserveData {
  currentATokenBalance: BigNumber
  currentStableDebt: BigNumber
  currentVariableDebt: BigNumber
  principalStableDebt: BigNumber
  scaledVariableDebt: BigNumber
  stableBorrowRate: BigNumber
  liquidityRate: BigNumber
}

interface AAVEAccountData {
  totalCollateralETH: BigNumber
  totalDebtETH: BigNumber
  availableBorrowsETH: BigNumber
  currentLiquidationThreshold: BigNumber
  ltv: BigNumber
  healthFactor: BigNumber
}

describe(`Operations | AAVE | ${OPERATION_NAMES.aave.CLOSE_POSITION}`, async () => {
  // Apparently there is not enough liquidity (at tested block) to deposit > 100ETH`
  const depositAmount = amountToWei(new BigNumber(10))
  const multiply = new BigNumber(2)
  const slippage = new BigNumber(0.1)

  let WETH: Contract
  let stETH: Contract
  let aaveLendingPool: Contract
  let aaveDataProvider: Contract
  let provider: JsonRpcProvider
  let config: RuntimeConfig
  let signer: Signer
  let address: string

  let system: DeployedSystemInfo

  let closeStrategyReturn: Awaited<ReturnType<typeof strategy.aave.closeStEth>>
  let closeTxStatus: boolean
  let closeTx: ContractReceipt

  let userAccountData: AAVEAccountData
  let userStEthReserveData: AAVEReserveData

  let feeRecipientWethBalanceBefore: BigNumber

  const mainnetAddresses = {
    DAI: ADDRESSES.main.DAI,
    ETH: ADDRESSES.main.ETH,
    WETH: ADDRESSES.main.WETH,
    stETH: ADDRESSES.main.stETH,
    chainlinkEthUsdPriceFeed: ADDRESSES.main.chainlinkEthUsdPriceFeed,
    aavePriceOracle: ADDRESSES.main.aavePriceOracle,
    aaveLendingPool: ADDRESSES.main.aave.MainnetLendingPool,
  }

  before(async () => {
    config = await init()
    provider = config.provider
    signer = config.signer
    address = config.address

    aaveLendingPool = new Contract(
      ADDRESSES.main.aave.MainnetLendingPool,
      AAVELendigPoolABI,
      provider,
    )
    aaveDataProvider = new Contract(ADDRESSES.main.aave.DataProvider, AAVEDataProviderABI, provider)
    WETH = new Contract(ADDRESSES.main.WETH, ERC20ABI, provider)
    stETH = new Contract(ADDRESSES.main.stETH, ERC20ABI, provider)
  })

  describe('On forked chain', () => {
    before(async () => {
      await resetNode(provider, 15433614)

      const { system: _system } = await deploySystem(config)
      system = _system

      const addresses = {
        ...mainnetAddresses,
        operationExecutor: system.common.operationExecutor.address,
      }

      const openStrategyReturn = await strategy.aave.openStEth(
        {
          depositAmount,
          slippage,
          multiply,
        },
        {
          addresses,
          provider,
          getSwapData: oneInchCallMock(new BigNumber(0.9759)),
          dsProxy: system.common.dsProxy.address,
        },
      )

      await executeThroughProxy(
        system.common.dsProxy.address,
        {
          address: system.common.operationExecutor.address,
          calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
            openStrategyReturn.calls,
            OPERATION_NAMES.common.CUSTOM_OPERATION,
          ]),
        },
        signer,
        depositAmount.toFixed(0),
      )

      feeRecipientWethBalanceBefore = await balanceOf(
        ADDRESSES.main.WETH,
        ADDRESSES.main.feeRecipient,
        { config, isFormatted: true },
      )

      userAccountData = await aaveLendingPool.getUserAccountData(system.common.dsProxy.address)
      userStEthReserveData = await aaveDataProvider.getUserReserveData(
        ADDRESSES.main.stETH,
        system.common.dsProxy.address,
      )
      const stEthAmount = new BigNumber(userStEthReserveData.currentATokenBalance.toString())

      closeStrategyReturn = await strategy.aave.closeStEth(
        {
          stEthAmountLockedInAave: stEthAmount,
          slippage,
        },
        {
          addresses,
          provider,
          getSwapData: oneInchCallMock(new BigNumber(1.1)),
          dsProxy: system.common.dsProxy.address,
        },
      )

      const [_closeTxStatus, _closeTx] = await executeThroughProxy(
        system.common.dsProxy.address,
        {
          address: system.common.operationExecutor.address,
          calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
            closeStrategyReturn.calls,
            OPERATION_NAMES.common.CUSTOM_OPERATION,
          ]),
        },
        signer,
        '0',
      )
      closeTxStatus = _closeTxStatus
      closeTx = _closeTx

      userAccountData = await aaveLendingPool.getUserAccountData(system.common.dsProxy.address)
      userStEthReserveData = await aaveDataProvider.getUserReserveData(
        ADDRESSES.main.stETH,
        system.common.dsProxy.address,
      )
    })

    it('Tx should pass', () => {
      expect(closeTxStatus).to.be.true
    })

    it('Should payback all debt', () => {
      expectToBeEqual(new BigNumber(userAccountData.totalDebtETH.toString()), ZERO)
    })

    it('Should withdraw all stEth tokens from aave', () => {
      expectToBeEqual(new BigNumber(userStEthReserveData.currentATokenBalance.toString()), ZERO)
    })

    it('Should collect fee', async () => {
      const feeRecipientWethBalanceAfter = await balanceOf(
        ADDRESSES.main.WETH,
        ADDRESSES.main.feeRecipient,
        { config, isFormatted: true },
      )

      expectToBeEqual(
        new BigNumber(closeStrategyReturn.feeAmount.toString()),
        feeRecipientWethBalanceAfter.minus(feeRecipientWethBalanceBefore),
      )
    })
  })

  describe.only('On latest block', () => {
    before(async () => {
      await resetNodeToLatestBlock(provider)
      const { system: _system } = await deploySystem(config, false, false)
      system = _system

      const addresses = {
        ...mainnetAddresses,
        operationExecutor: system.common.operationExecutor.address,
      }

      const openStrategyReturn = await strategy.aave.openStEth(
        {
          depositAmount,
          slippage,
          multiply,
        },
        {
          addresses,
          provider,
          getSwapData: getOneInchRealCall(system.common.swap.address),
          dsProxy: system.common.dsProxy.address,
        },
      )

      await executeThroughProxy(
        system.common.dsProxy.address,
        {
          address: system.common.operationExecutor.address,
          calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
            openStrategyReturn.calls,
            OPERATION_NAMES.common.CUSTOM_OPERATION,
          ]),
        },
        signer,
        depositAmount.toFixed(0),
      )
      console.log('CLOSE!!')
      feeRecipientWethBalanceBefore = await balanceOf(
        ADDRESSES.main.WETH,
        ADDRESSES.main.feeRecipient,
        { config, isFormatted: true },
      )

      userAccountData = await aaveLendingPool.getUserAccountData(system.common.dsProxy.address)
      userStEthReserveData = await aaveDataProvider.getUserReserveData(
        ADDRESSES.main.stETH,
        system.common.dsProxy.address,
      )
      const stEthAmount = new BigNumber(userStEthReserveData.currentATokenBalance.toString())

      closeStrategyReturn = await strategy.aave.closeStEth(
        {
          stEthAmountLockedInAave: stEthAmount,
          slippage,
        },
        {
          addresses,
          provider,
          getSwapData: getOneInchRealCall(system.common.swap.address),
          dsProxy: system.common.dsProxy.address,
        },
      )

      const [_closeTxStatus, _closeTx] = await executeThroughProxy(
        system.common.dsProxy.address,
        {
          address: system.common.operationExecutor.address,
          calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
            closeStrategyReturn.calls,
            OPERATION_NAMES.common.CUSTOM_OPERATION,
          ]),
        },
        signer,
        '0',
      )
      closeTxStatus = _closeTxStatus
      closeTx = _closeTx

      console.log(closeTx)

      userAccountData = await aaveLendingPool.getUserAccountData(system.common.dsProxy.address)
      userStEthReserveData = await aaveDataProvider.getUserReserveData(
        ADDRESSES.main.stETH,
        system.common.dsProxy.address,
      )
    })

    it.only('Tx should pass', () => {
      expect(closeTxStatus).to.be.true
    })

    it('Should payback all debt', () => {
      expectToBeEqual(new BigNumber(userAccountData.totalDebtETH.toString()), ZERO)
    })

    it('Should withdraw all stEth tokens from aave', () => {
      expectToBeEqual(new BigNumber(userStEthReserveData.currentATokenBalance.toString()), ZERO)
    })

    it('Should collect fee', async () => {
      const feeRecipientWethBalanceAfter = await balanceOf(
        ADDRESSES.main.WETH,
        ADDRESSES.main.feeRecipient,
        { config, isFormatted: true },
      )

      expectToBeEqual(
        new BigNumber(closeStrategyReturn.feeAmount.toString()),
        feeRecipientWethBalanceAfter.minus(feeRecipientWethBalanceBefore),
      )
    })
  })
})
