import { JsonRpcProvider } from '@ethersproject/providers'
import {
  ADDRESSES,
  IPosition,
  IStrategy,
  ONE,
  OPERATION_NAMES,
  Position,
  strategies,
} from '@oasisdex/oasis-actions'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { Contract, ContractReceipt, Signer } from 'ethers'

import AAVEDataProviderABI from '../../abi/aaveDataProvider.json'
import AAVELendigPoolABI from '../../abi/aaveLendingPool.json'
import ERC20ABI from '../../abi/IERC20.json'
import { executeThroughProxy } from '../../helpers/deploy'
import init, { resetNode } from '../../helpers/init'
import { swapOneInchTokens } from '../../helpers/swap/1inch'
import { RuntimeConfig } from '../../helpers/types/common'
import { amountToWei, balanceOf } from '../../helpers/utils'
import { testBlockNumber } from '../config'
import { DeployedSystemInfo, deploySystem } from '../deploySystem'
import { expectToBe, expectToBeEqual } from '../utils'

const oneInchCallMock = async (
  from: string,
  to: string,
  amount: BigNumber,
  slippage: BigNumber,
) => {
  const marketPrice = new BigNumber(0.979)
  return {
    fromTokenAddress: from,
    toTokenAddress: to,
    fromTokenAmount: amount,
    toTokenAmount: amount.div(marketPrice),
    minToTokenAmount: amount.div(marketPrice.times(ONE.plus(slippage))),
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

describe(`Strategy | AAVE | Adjust Position`, async () => {
  let WETH: Contract
  let stETH: Contract
  let aaveLendingPool: Contract
  let aaveDataProvider: Contract
  let provider: JsonRpcProvider
  let config: RuntimeConfig
  let signer: Signer
  let address: string

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

    await resetNode(provider, testBlockNumber)
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
    const depositAmount = amountToWei(new BigNumber(60 / 1e12))
    const multiple = new BigNumber(2)
    const slippage = new BigNumber(0.1)
    const aaveStEthPriceInEth = new BigNumber(0.9790986995818977)

    let system: DeployedSystemInfo

    let openStrategy: IStrategy

    let txStatus: boolean
    let tx: ContractReceipt

    let userAccountData: AAVEAccountData
    let userStEthReserveData: AAVEReserveData
    let actualPosition: IPosition

    let feeRecipientWethBalanceBefore: BigNumber

    before(async () => {
      resetNode(provider, testBlockNumber)

      const { system: _system } = await deploySystem(config)
      system = _system

      const addresses = {
        ...mainnetAddresses,
        operationExecutor: system.common.operationExecutor.address,
      }

      openStrategy = await strategies.aave.openStEth(
        {
          depositAmount,
          slippage,
          multiple,
        },
        {
          addresses,
          provider,
          getSwapData: oneInchCallMock,
          dsProxy: system.common.dsProxy.address,
        },
      )

      feeRecipientWethBalanceBefore = await balanceOf(
        ADDRESSES.main.WETH,
        ADDRESSES.main.feeRecipient,
        { config, isFormatted: true },
      )

      const [_txStatus, _tx] = await executeThroughProxy(
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
      txStatus = _txStatus
      tx = _tx

      userAccountData = await aaveLendingPool.getUserAccountData(system.common.dsProxy.address)
      userStEthReserveData = await aaveDataProvider.getUserReserveData(
        ADDRESSES.main.stETH,
        system.common.dsProxy.address,
      )

      actualPosition = new Position(
        { amount: new BigNumber(userAccountData.totalDebtETH.toString()) },
        { amount: new BigNumber(userStEthReserveData.currentATokenBalance.toString()) },
        aaveStEthPriceInEth,
        openStrategy.simulation.position.category,
      )

      console.log('=====')
      console.log('Actual Position on AAVE')
      console.log('Debt: ', actualPosition.debt.amount.toString())
      console.log('Collateral: ', actualPosition.collateral.amount.toString())
    })

    it('Open Position Tx should pass', () => {
      expect(txStatus).to.be.true
    })

    it('Should draw debt according to multiple', () => {
      expectToBeEqual(
        openStrategy.simulation.position.debt.amount.toFixed(0),
        new BigNumber(userAccountData.totalDebtETH.toString()),
      )
    })

    describe('Increase Loan-to-Value (Increase risk)', () => {
      let adjustStrategyIncreaseRisk: IStrategy
      const adjustMultipleUp = new BigNumber(3.5)
      let increaseRiskTxStatus: boolean
      let increaseRiskTx: ContractReceipt
      let afterUserAccountData: AAVEAccountData
      let afterUserStEthReserveData: AAVEReserveData
      let actualPositionAfterIncreaseAdjust: IPosition

      before(async () => {
        const addresses = {
          ...mainnetAddresses,
          operationExecutor: system.common.operationExecutor.address,
        }

        const beforeUserAccountData = await aaveLendingPool.getUserAccountData(
          system.common.dsProxy.address,
        )
        const beforeUserStEthReserveData = await aaveDataProvider.getUserReserveData(
          ADDRESSES.main.stETH,
          system.common.dsProxy.address,
        )

        adjustStrategyIncreaseRisk = await strategies.aave.adjustStEth(
          {
            slippage,
            multiple: adjustMultipleUp,
          },
          {
            addresses,
            provider,
            position: {
              debt: {
                amount: new BigNumber(beforeUserAccountData.totalDebtETH.toString()),
              },
              collateral: {
                amount: new BigNumber(beforeUserStEthReserveData.currentATokenBalance.toString()),
              },
              category: {
                liquidationThreshold: new BigNumber(0.75),
                maxLoanToValue: new BigNumber(0.73),
                dustLimit: new BigNumber(0),
              },
            },
            getSwapData: oneInchCallMock,
            dsProxy: system.common.dsProxy.address,
          },
        )

        feeRecipientWethBalanceBefore = await balanceOf(
          ADDRESSES.main.WETH,
          ADDRESSES.main.feeRecipient,
          { config, isFormatted: true },
        )

        const [_txStatus, _tx] = await executeThroughProxy(
          system.common.dsProxy.address,
          {
            address: system.common.operationExecutor.address,
            calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
              adjustStrategyIncreaseRisk.calls,
              OPERATION_NAMES.common.CUSTOM_OPERATION,
            ]),
          },
          signer,
        )
        increaseRiskTxStatus = _txStatus
        increaseRiskTx = _tx

        afterUserAccountData = await aaveLendingPool.getUserAccountData(
          system.common.dsProxy.address,
        )
        afterUserStEthReserveData = await aaveDataProvider.getUserReserveData(
          ADDRESSES.main.stETH,
          system.common.dsProxy.address,
        )

        actualPositionAfterIncreaseAdjust = new Position(
          { amount: new BigNumber(afterUserAccountData.totalDebtETH.toString()) },
          { amount: new BigNumber(afterUserStEthReserveData.currentATokenBalance.toString()) },
          aaveStEthPriceInEth,
          openStrategy.simulation.position.category,
        )

        console.log('=====')
        console.log('Actual Position after increase adjustment on AAVE')
        console.log('Debt: ', actualPositionAfterIncreaseAdjust.debt.amount.toString())
        console.log('Collateral: ', actualPositionAfterIncreaseAdjust.collateral.amount.toString())
      })

      it('Increase Position Risk T/x should pass', () => {
        expect(increaseRiskTxStatus).to.be.true
      })

      it('Should draw debt according to multiply', async () => {
        expectToBe(
          adjustStrategyIncreaseRisk.simulation.position.debt.amount.toFixed(0),
          'lte',
          new BigNumber(afterUserAccountData.totalDebtETH.toString()),
        )
      })

      it('Should collect fee', async () => {
        const feeRecipientWethBalanceAfter = await balanceOf(
          ADDRESSES.main.WETH,
          ADDRESSES.main.feeRecipient,
          { config, isFormatted: true },
        )

        expectToBeEqual(
          new BigNumber(adjustStrategyIncreaseRisk.simulation.swap.fee.toFixed(6)),
          feeRecipientWethBalanceAfter.minus(feeRecipientWethBalanceBefore).toFixed(6),
        )
      })
    })

    describe.skip('Decrease Loan-to-Value (Reduce risk)', () => {
      let adjustStrategyReduceRisk: IStrategy
      const adjustMultipleDown = new BigNumber(1.5)
      let reduceRiskTxStatus: boolean
      let reduceRiskTx: ContractReceipt

      let afterUserAccountData: AAVEAccountData
      let afterUserStEthReserveData: AAVEReserveData

      before(async () => {
        const addresses = {
          ...mainnetAddresses,
          operationExecutor: system.common.operationExecutor.address,
        }

        const beforeUserAccountData = await aaveLendingPool.getUserAccountData(
          system.common.dsProxy.address,
        )
        const beforeUserStEthReserveData = await aaveDataProvider.getUserReserveData(
          ADDRESSES.main.stETH,
          system.common.dsProxy.address,
        )

        console.log(
          '[BEFORE DEC] Debt',
          new BigNumber(beforeUserAccountData.totalDebtETH.toString()).toString(),
        )

        adjustStrategyReduceRisk = await strategies.aave.adjustStEth(
          {
            slippage,
            multiple: adjustMultipleDown,
          },
          {
            addresses,
            provider,
            position: {
              debt: {
                amount: new BigNumber(beforeUserAccountData.totalDebtETH.toString()),
              },
              collateral: {
                amount: new BigNumber(beforeUserStEthReserveData.currentATokenBalance.toString()),
              },
              category: {
                liquidationThreshold: new BigNumber(0.75),
                maxLoanToValue: new BigNumber(0.73),
                dustLimit: new BigNumber(0),
              },
            },
            getSwapData: oneInchCallMock,
            dsProxy: system.common.dsProxy.address,
          },
        )

        feeRecipientWethBalanceBefore = await balanceOf(
          ADDRESSES.main.WETH,
          ADDRESSES.main.feeRecipient,
          { config, isFormatted: true },
        )

        const [_txStatus, _tx] = await executeThroughProxy(
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
        reduceRiskTxStatus = _txStatus
        reduceRiskTx = _tx

        afterUserAccountData = await aaveLendingPool.getUserAccountData(
          system.common.dsProxy.address,
        )
        afterUserStEthReserveData = await aaveDataProvider.getUserReserveData(
          ADDRESSES.main.stETH,
          system.common.dsProxy.address,
        )
      })

      it('Reduce Position Risk T/x should pass', () => {
        expect(reduceRiskTxStatus).to.be.true
      })

      it('Should draw debt according to multiply', () => {
        console.log(
          '[DEC] simulate Debt',
          adjustStrategyReduceRisk.simulation.position.debt.amount.toString(),
        )
        console.log('[DEC] totalDebtETH', afterUserAccountData.totalDebtETH.toString())
        expectToBeEqual(
          adjustStrategyReduceRisk.simulation.position.debt.amount.toFixed(0),
          new BigNumber(afterUserAccountData.totalDebtETH.toString()),
        )
      })

      it('Should deposit all stEth tokens to aave', () => {
        expectToBe(
          adjustStrategyReduceRisk.simulation.swap.minToTokenAmount,
          'lte',
          new BigNumber(afterUserStEthReserveData.currentATokenBalance.toString()),
        )
      })

      it('Should collect fee', async () => {
        const feeRecipientWethBalanceAfter = await balanceOf(
          ADDRESSES.main.WETH,
          ADDRESSES.main.feeRecipient,
          { config, isFormatted: true },
        )

        expectToBeEqual(
          new BigNumber(adjustStrategyReduceRisk.simulation.swap.fee.toFixed(6)),
          feeRecipientWethBalanceAfter.minus(feeRecipientWethBalanceBefore).toFixed(6),
        )
      })
    })
  })

  // describe.skip('On latest block using one inch exchange and api', () => {
  //   const depositAmount = amountToWei(new BigNumber(60))
  //   const multiple = new BigNumber(2)
  //   const slippage = new BigNumber(0.1)
  //
  //   let system: DeployedSystemInfo
  //
  //   let strategy: IStrategy
  //   let txStatus: boolean
  //   let tx: ContractReceipt
  //
  //   let userAccountData: AAVEAccountData
  //   let userStEthReserveData: AAVEReserveData
  //
  //   let feeRecipientWethBalanceBefore: BigNumber
  //
  //   before(async () => {
  //     //Reset to the latest block
  //     await provider.send('hardhat_reset', [
  //       {
  //         forking: {
  //           jsonRpcUrl: process.env.MAINNET_URL,
  //         },
  //       },
  //     ])
  //
  //     const { system: _system } = await deploySystem(config, false, false)
  //     system = _system
  //
  //     const addresses = {
  //       ...mainnetAddresses,
  //       operationExecutor: system.common.operationExecutor.address,
  //     }
  //
  //     feeRecipientWethBalanceBefore = await balanceOf(
  //       ADDRESSES.main.WETH,
  //       ADDRESSES.main.feeRecipient,
  //       { config, isFormatted: true },
  //     )
  //
  //     strategy = await strategies.aave.adjustStEth(
  //       {
  //         depositAmount,
  //         slippage,
  //         multiple,
  //       },
  //       {
  //         addresses,
  //         provider,
  //         getSwapData: getOneInchRealCall(system.common.swap.address),
  //         dsProxy: system.common.dsProxy.address,
  //       },
  //     )
  //
  //     const [_txStatus, _tx] = await executeThroughProxy(
  //       system.common.dsProxy.address,
  //       {
  //         address: system.common.operationExecutor.address,
  //         calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
  //           strategy.calls,
  //           OPERATION_NAMES.common.CUSTOM_OPERATION,
  //         ]),
  //       },
  //       signer,
  //       depositAmount.toFixed(0),
  //     )
  //     txStatus = _txStatus
  //     tx = _tx
  //
  //     userAccountData = await aaveLendingPool.getUserAccountData(system.common.dsProxy.address)
  //     userStEthReserveData = await aaveDataProvider.getUserReserveData(
  //       ADDRESSES.main.stETH,
  //       system.common.dsProxy.address,
  //     )
  //   })
  //
  //   it('Tx should pass', () => {
  //     expect(txStatus).to.be.true
  //   })
  //
  //   it('Should draw debt according to multiply', () => {
  //     expectToBeEqual(
  //       strategy.simulation.position.debt.amount.toFixed(0),
  //       new BigNumber(userAccountData.totalDebtETH.toString()),
  //     )
  //   })
  //
  //   it('Should deposit all stEth tokens to aave', () => {
  //     expectToBe(
  //       strategy.simulation.swap.minToTokenAmount,
  //       'lte',
  //       new BigNumber(userStEthReserveData.currentATokenBalance.toString()),
  //     )
  //   })
  //
  //   it('Should collect fee', async () => {
  //     const feeRecipientWethBalanceAfter = await balanceOf(
  //       ADDRESSES.main.WETH,
  //       ADDRESSES.main.feeRecipient,
  //       { config, isFormatted: true },
  //     )
  //
  //     expectToBeEqual(
  //       new BigNumber(strategy.simulation.swap.fee.toFixed(6)),
  //       feeRecipientWethBalanceAfter.minus(feeRecipientWethBalanceBefore).toFixed(6),
  //     )
  //   })
  // })
})
