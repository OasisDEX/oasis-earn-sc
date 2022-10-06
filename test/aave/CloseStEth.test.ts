import { JsonRpcProvider } from '@ethersproject/providers'
import {
  ADDRESSES,
  IPosition,
  ONE,
  OPERATION_NAMES,
  Position,
  strategies,
  ZERO,
} from '@oasisdex/oasis-actions'
import { amountFromWei } from '@oasisdex/oasis-actions/src/helpers'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { loadFixture } from 'ethereum-waffle'
import { Contract, ContractReceipt, Signer } from 'ethers'

import AAVEDataProviderABI from '../../abi/aaveDataProvider.json'
import AAVELendigPoolABI from '../../abi/aaveLendingPool.json'
import ERC20ABI from '../../abi/IERC20.json'
import { executeThroughProxy } from '../../helpers/deploy'
import { resetNodeToLatestBlock } from '../../helpers/init'
import { restoreSnapshot } from '../../helpers/restoreSnapshot'
import { swapOneInchTokens } from '../../helpers/swap/1inch'
import { RuntimeConfig } from '../../helpers/types/common'
import { amountToWei, balanceOf } from '../../helpers/utils'
import { testBlockNumber } from '../config'
import { DeployedSystemInfo, deploySystem } from '../deploySystem'
import { initialiseConfig } from '../fixtures/setup'
import { expectToBe, expectToBeEqual } from '../utils'

const oneInchCallMock =
  (marketPrice: BigNumber) =>
  async (from: string, to: string, amount: BigNumber, slippage: BigNumber) => {
    console.log('1inch mock')
    console.log('fromTokenAmount:', amount.toString())
    console.log('toTokenAmount:', amount.div(marketPrice).toString())
    console.log(
      'minToTokenAmount:',
      amount
        .div(marketPrice)
        .times(new BigNumber(1).minus(slippage))
        .integerValue(BigNumber.ROUND_DOWN)
        .toString(),
    )
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

describe(`Strategy | AAVE | Close Position`, async () => {
  const depositAmount = amountToWei(new BigNumber(60 / 1e15))
  const multiple = new BigNumber(2)
  const slippage = new BigNumber(0.1)
  const aaveStEthPriceInEth = new BigNumber(0.98066643)

  // In this case we can safely assume this constant value for a given block,
  // this value should be changed when changing block number
  const ethAmountReturnedFromSwap = amountFromWei(new BigNumber('107850'))

  let WETH: Contract
  let stETH: Contract
  let aaveLendingPool: Contract
  let aaveDataProvider: Contract
  let provider: JsonRpcProvider
  let config: RuntimeConfig
  let signer: Signer
  let address: string

  let system: DeployedSystemInfo

  let openTxStatus: boolean

  let closeStrategy: Awaited<ReturnType<typeof strategies.aave.closeStEth>>
  let closeTxStatus: boolean
  let closeTx: ContractReceipt

  let afterCloseUserAccountData: AAVEAccountData
  let afterCloseUserStEthReserveData: AAVEReserveData
  let actualPosition: IPosition

  let feeRecipientWethBalanceBefore: BigNumber
  let userEthBalanceBeforeTx: BigNumber

  const mainnetAddresses = {
    DAI: ADDRESSES.main.DAI,
    ETH: ADDRESSES.main.ETH,
    WETH: ADDRESSES.main.WETH,
    stETH: ADDRESSES.main.stETH,
    aaveProtocolDataProvider: ADDRESSES.main.aave.DataProvider,
    chainlinkEthUsdPriceFeed: ADDRESSES.main.chainlinkEthUsdPriceFeed,
    aavePriceOracle: ADDRESSES.main.aavePriceOracle,
    aaveLendingPool: ADDRESSES.main.aave.MainnetLendingPool,
  }

  before(async () => {
    ;({ config, provider, signer, address } = await loadFixture(initialiseConfig))

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
      const snapshot = await restoreSnapshot(config, provider, testBlockNumber)

      system = snapshot.deployed.system

      const addresses = {
        ...mainnetAddresses,
        operationExecutor: system.common.operationExecutor.address,
      }

      const openStrategy = await strategies.aave.openStEth(
        {
          depositAmount,
          slippage,
          multiple,
        },
        {
          addresses,
          provider,
          getSwapData: oneInchCallMock(new BigNumber(0.9759)),
          dsProxy: system.common.dsProxy.address,
        },
      )

      const [_openTxStatus] = await executeThroughProxy(
        system.common.dsProxy.address,
        {
          address: system.common.operationExecutor.address,
          calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
            openStrategy.calls,
            OPERATION_NAMES.common.CUSTOM_OPERATION,
          ]),
        },
        signer,
        depositAmount.toFixed(0),
      )
      openTxStatus = _openTxStatus

      feeRecipientWethBalanceBefore = await balanceOf(
        ADDRESSES.main.WETH,
        ADDRESSES.main.feeRecipient,
        { config, isFormatted: true },
      )

      const beforeCloseUserAccountData = await aaveLendingPool.getUserAccountData(
        system.common.dsProxy.address,
      )

      const beforeCloseUserStEthReserveData = await aaveDataProvider.getUserReserveData(
        ADDRESSES.main.stETH,
        system.common.dsProxy.address,
      )

      const stEthAmount = new BigNumber(
        beforeCloseUserStEthReserveData.currentATokenBalance.toString(),
      )

      const positionAfterOpen = new Position(
        { amount: new BigNumber(beforeCloseUserAccountData.totalDebtETH.toString()) },
        { amount: new BigNumber(beforeCloseUserStEthReserveData.currentATokenBalance.toString()) },
        aaveStEthPriceInEth,
        openStrategy.simulation.position.category,
      )

      closeStrategy = await strategies.aave.closeStEth(
        {
          stEthAmountLockedInAave: stEthAmount,
          slippage,
        },
        {
          addresses,
          provider,
          position: positionAfterOpen,
          getSwapData: oneInchCallMock(new BigNumber(1.1)),
          dsProxy: system.common.dsProxy.address,
        },
      )

      userEthBalanceBeforeTx = await balanceOf(ADDRESSES.main.ETH, address, {
        config,
        isFormatted: true,
      })

      console.log('running close...')
      const [_closeTxStatus, _closeTx] = await executeThroughProxy(
        system.common.dsProxy.address,
        {
          address: system.common.operationExecutor.address,
          calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
            closeStrategy.calls,
            OPERATION_NAMES.common.CUSTOM_OPERATION,
          ]),
        },
        signer,
        '0',
      )

      closeTxStatus = _closeTxStatus
      closeTx = _closeTx

      afterCloseUserAccountData = await aaveLendingPool.getUserAccountData(
        system.common.dsProxy.address,
      )

      afterCloseUserStEthReserveData = await aaveDataProvider.getUserReserveData(
        ADDRESSES.main.stETH,
        system.common.dsProxy.address,
      )

      actualPosition = new Position(
        { amount: new BigNumber(afterCloseUserAccountData.totalDebtETH.toString()) },
        { amount: new BigNumber(afterCloseUserStEthReserveData.currentATokenBalance.toString()) },
        aaveStEthPriceInEth,
        openStrategy.simulation.position.category,
      )
    })

    it('Open Tx should pass', () => {
      expect(openTxStatus).to.be.true
    })

    it('Close Tx should pass', () => {
      expect(closeTxStatus).to.be.true
    })

    it('Should payback all debt', () => {
      expectToBeEqual(new BigNumber(afterCloseUserAccountData.totalDebtETH.toString()), ZERO)
    })

    it('Should withdraw all stEth tokens from aave', () => {
      //due to quirks of how stEth works there might be 1 wei left in aave
      expectToBe(
        new BigNumber(afterCloseUserStEthReserveData.currentATokenBalance.toString()),
        'lte',
        ONE,
      )
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

      expectToBeEqual(delta, ethAmountReturnedFromSwap.minus(10 / 1e15), 4)
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

      const openStrategy = await strategies.aave.openStEth(
        {
          depositAmount,
          slippage,
          multiple,
        },
        {
          addresses,
          provider,
          getSwapData: getOneInchRealCall(system.common.swap.address),
          dsProxy: system.common.dsProxy.address,
        },
      )

      const [_openTxStatus] = await executeThroughProxy(
        system.common.dsProxy.address,
        {
          address: system.common.operationExecutor.address,
          calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
            openStrategy.calls,
            OPERATION_NAMES.common.CUSTOM_OPERATION,
          ]),
        },
        signer,
        depositAmount.toFixed(0),
      )
      openTxStatus = _openTxStatus
      if (!openTxStatus) {
        throw new Error('Position should be open before closing')
      }

      feeRecipientWethBalanceBefore = await balanceOf(
        ADDRESSES.main.WETH,
        ADDRESSES.main.feeRecipient,
        { config, isFormatted: true },
      )

      const beforeCloseUserAccountData = await aaveLendingPool.getUserAccountData(
        system.common.dsProxy.address,
      )

      const beforeCloseUserStEthReserveData = await aaveDataProvider.getUserReserveData(
        ADDRESSES.main.stETH,
        system.common.dsProxy.address,
      )
      const stEthAmount = new BigNumber(
        beforeCloseUserStEthReserveData.currentATokenBalance.toString(),
      )

      const positionAfterOpen = new Position(
        { amount: new BigNumber(beforeCloseUserAccountData.totalDebtETH.toString()) },
        { amount: new BigNumber(beforeCloseUserStEthReserveData.currentATokenBalance.toString()) },
        aaveStEthPriceInEth,
        openStrategy.simulation.position.category,
      )

      closeStrategy = await strategies.aave.closeStEth(
        {
          stEthAmountLockedInAave: stEthAmount.minus(1000),
          slippage,
        },
        {
          addresses,
          provider,
          position: positionAfterOpen,
          getSwapData: getOneInchRealCall(system.common.swap.address),
          dsProxy: system.common.dsProxy.address,
        },
      )

      const [_closeTxStatus, _closeTx] = await executeThroughProxy(
        system.common.dsProxy.address,
        {
          address: system.common.operationExecutor.address,
          calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
            closeStrategy.calls,
            OPERATION_NAMES.common.CUSTOM_OPERATION,
          ]),
        },
        signer,
        '0',
      )
      closeTxStatus = _closeTxStatus
      closeTx = _closeTx

      afterCloseUserAccountData = await aaveLendingPool.getUserAccountData(
        system.common.dsProxy.address,
      )
      afterCloseUserStEthReserveData = await aaveDataProvider.getUserReserveData(
        ADDRESSES.main.stETH,
        system.common.dsProxy.address,
      )
    })

    it('Open Tx should pass', () => {
      expect(open).to.be.true
    })

    it('Tx should pass', () => {
      expect(closeTxStatus).to.be.true
    })

    it('Should payback all debt', () => {
      expectToBeEqual(new BigNumber(afterCloseUserAccountData.totalDebtETH.toString()), ZERO)
    })

    it('Should withdraw all stEth tokens from aave', () => {
      expectToBeEqual(
        new BigNumber(afterCloseUserStEthReserveData.currentATokenBalance.toString()),
        ZERO,
      )
    })

    it('Should collect fee', async () => {
      const feeRecipientWethBalanceAfter = await balanceOf(
        ADDRESSES.main.WETH,
        ADDRESSES.main.feeRecipient,
        { config, isFormatted: true },
      )

      expectToBe(new BigNumber(closeStrategy.simulation.swap.targetTokenFee), 'gt', ZERO)
      expectToBe(
        new BigNumber(closeStrategy.simulation.swap.targetTokenFee),
        'lte',
        feeRecipientWethBalanceAfter.minus(feeRecipientWethBalanceBefore),
      )
    })
  })
})
