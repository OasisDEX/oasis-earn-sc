import { JsonRpcProvider } from '@ethersproject/providers'
import { ADDRESSES, ONE, OPERATION_NAMES, strategy, ZERO } from '@oasisdex/oasis-actions'
import { amountFromWei } from '@oasisdex/oasis-actions/src/helpers'
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
  const depositAmount = amountToWei(new BigNumber(10))
  const multiply = new BigNumber(2)
  const slippage = new BigNumber(0.1)

  // In this case we can safely assume this constant value for a given block,
  // this value should be changed when changing block number
  const ethAmountReturnedFromSwap = amountFromWei(new BigNumber('19524933454028254471'))

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
  let userEthBalanceBeforeTx: BigNumber

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

      userEthBalanceBeforeTx = await balanceOf(ADDRESSES.main.ETH, address, {
        config,
        isFormatted: true,
      })

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
      //due to quirks of how stEth works there might be 1 wei left in aave
      expectToBe(new BigNumber(userStEthReserveData.currentATokenBalance.toString()), 'lte', ONE)
    })

    it('Should collect fee', async () => {
      const feeRecipientWethBalanceAfter = await balanceOf(
        ADDRESSES.main.WETH,
        ADDRESSES.main.feeRecipient,
        { config, isFormatted: true },
      )
      //TODO improve precision
      expectToBeEqual(
        ethAmountReturnedFromSwap.times(0.002),
        feeRecipientWethBalanceAfter.minus(feeRecipientWethBalanceBefore),
        5,
      )
    })

    it('should not be any token left on proxy', async () => {
      const proxyWethBalance = await balanceOf(ADDRESSES.main.WETH, system.common.dsProxy.address, {
        config,
        isFormatted: true,
      })
      const proxyStEthBalance = await balanceOf(
        ADDRESSES.main.stETH,
        system.common.dsProxy.address,
        {
          config,
          isFormatted: true,
        },
      )
      const proxyEthBalance = await balanceOf(ADDRESSES.main.ETH, system.common.dsProxy.address, {
        config,
        isFormatted: true,
      })

      expectToBeEqual(proxyWethBalance, ZERO)
      expectToBeEqual(proxyStEthBalance, ZERO)
      expectToBeEqual(proxyEthBalance, ZERO)
    })

    it('should return eth to the user', async () => {
      const userEthBalanceAfterTx = await balanceOf(ADDRESSES.main.ETH, address, {
        config,
        isFormatted: true,
      })

      const txCost = amountFromWei(
        new BigNumber(closeTx.gasUsed.mul(closeTx.effectiveGasPrice).toString()),
      )

      const delta = userEthBalanceAfterTx.minus(userEthBalanceBeforeTx).plus(txCost)

      expectToBeEqual(delta, ethAmountReturnedFromSwap.minus(10), 4)
    })
  })

  describe.skip('On latest block', () => {
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

      const [openTxStatus] = await executeThroughProxy(
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
          stEthAmountLockedInAave: stEthAmount.minus(1000),
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
})
