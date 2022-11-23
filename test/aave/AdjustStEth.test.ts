import { JsonRpcProvider } from '@ethersproject/providers'
import {
  ADDRESSES,
  IPosition,
  IStrategy,
  ONE,
  OPERATION_NAMES,
  Position,
  strategies,
  ZERO,
} from '@oasisdex/oasis-actions'
import aavePriceOracleABI from '@oasisdex/oasis-actions/lib/src/abi/aavePriceOracle.json'
import { amountFromWei } from '@oasisdex/oasis-actions/lib/src/helpers'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { loadFixture } from 'ethereum-waffle'
import { Contract, ethers, Signer } from 'ethers'

import AAVEDataProviderABI from '../../abi/aaveDataProvider.json'
import AAVELendigPoolABI from '../../abi/aaveLendingPool.json'
import { AAVEAccountData, AAVEReserveData } from '../../helpers/aave'
import { executeThroughProxy } from '../../helpers/deploy'
import init, { resetNodeToLatestBlock } from '../../helpers/init'
import { restoreSnapshot } from '../../helpers/restoreSnapshot'
import { getOneInchCall } from '../../helpers/swap/OneIchCall'
import { oneInchCallMock } from '../../helpers/swap/OneInchCallMock'
import { RuntimeConfig } from '../../helpers/types/common'
import { amountToWei, balanceOf } from '../../helpers/utils'
import { DeployedSystemInfo, deploySystem } from '../deploySystem'
import { initialiseConfig } from '../fixtures/setup'
import { expectToBe, expectToBeEqual } from '../utils'

describe(`Strategy | AAVE | Adjust Position`, async () => {
  let aaveLendingPool: Contract
  let aaveDataProvider: Contract
  let provider: JsonRpcProvider
  let config: RuntimeConfig
  let signer: Signer

  const mainnetAddresses = {
    DAI: ADDRESSES.main.DAI,
    ETH: ADDRESSES.main.ETH,
    WETH: ADDRESSES.main.WETH,
    stETH: ADDRESSES.main.stETH,
    aaveProtocolDataProvider: ADDRESSES.main.aave.DataProvider,
    chainlinkEthUsdPriceFeed: ADDRESSES.main.chainlinkEthUsdPriceFeed,
    aavePriceOracle: ADDRESSES.main.aavePriceOracle,
    aaveLendingPool: ADDRESSES.main.aave.MainnetLendingPool,
    aaveDataProvider: ADDRESSES.main.aave.DataProvider,
  }

  before(async () => {
    config = await init()
    provider = config.provider
    signer = config.signer

    aaveLendingPool = new Contract(
      ADDRESSES.main.aave.MainnetLendingPool,
      AAVELendigPoolABI,
      provider,
    )

    aaveDataProvider = new Contract(ADDRESSES.main.aave.DataProvider, AAVEDataProviderABI, provider)
  })

  describe('On forked chain', () => {
    const depositAmount = amountToWei(new BigNumber(60 / 1e12))
    const multiple = new BigNumber(2)
    const slippage = new BigNumber(0.1)

    let system: DeployedSystemInfo

    let openStrategy: IStrategy

    let txStatus: boolean

    let actualPosition: IPosition

    let feeRecipientWethBalanceBefore: BigNumber

    before(async () => {
      ;({ config, provider, signer } = await loadFixture(initialiseConfig))
      const testBlockWithSufficientLiquidityInUswapPool = 15695000
      const snapshot = await restoreSnapshot(
        config,
        provider,
        testBlockWithSufficientLiquidityInUswapPool,
      )
      system = snapshot.deployed.system

      const addresses = {
        ...mainnetAddresses,
        operationExecutor: system.common.operationExecutor.address,
      }

      const dependencies = {
        addresses,
        provider,
        getSwapData: oneInchCallMock(new BigNumber(0.979)),
        dsProxy: system.common.dsProxy.address,
      }

      actualPosition = await strategies.aave.getCurrentStEthEthPosition(
        { proxyAddress: system.common.dsProxy.address },
        { ...dependencies },
      )

      openStrategy = await strategies.aave.openStEth(
        {
          depositAmount,
          slippage,
          multiple,
        },
        {
          ...dependencies,
          currentPosition: actualPosition,
        },
      )

      feeRecipientWethBalanceBefore = await balanceOf(
        ADDRESSES.main.WETH,
        ADDRESSES.main.feeRecipient,
        { config, isFormatted: true },
      )

      const [_txStatus] = await executeThroughProxy(
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

      actualPosition = await strategies.aave.getCurrentStEthEthPosition(
        { proxyAddress: system.common.dsProxy.address },
        { ...dependencies },
      )
    })

    it('Open Position Tx should pass', () => {
      expect(txStatus).to.be.true
    })

    it('Should draw debt according to multiple', () => {
      expect(actualPosition.debt.amount.toString()).to.be.oneOf([
        amountFromWei(openStrategy.simulation.position.debt.amount).toString(),
        amountFromWei(openStrategy.simulation.position.debt.amount.plus(ONE)).toString(),
      ])
    })

    describe('Increase Loan-to-Value (Increase risk)', () => {
      let adjustStrategyIncreaseRisk: IStrategy
      const adjustMultipleUp = new BigNumber(3.5)
      let increaseRiskTxStatus: boolean
      let actualPositionAfterIncreaseAdjust: IPosition

      before(async () => {
        const addresses = {
          ...mainnetAddresses,
          operationExecutor: system.common.operationExecutor.address,
        }

        const dependencies = {
          addresses,
          provider,
          getSwapData: oneInchCallMock(new BigNumber(0.979)),
          dsProxy: system.common.dsProxy.address,
        }

        actualPosition = await strategies.aave.getCurrentStEthEthPosition(
          { proxyAddress: system.common.dsProxy.address },
          { ...dependencies },
        )

        adjustStrategyIncreaseRisk = await strategies.aave.adjustStEth(
          {
            slippage,
            multiple: adjustMultipleUp,
          },
          {
            ...dependencies,
            position: actualPosition,
          },
        )

        feeRecipientWethBalanceBefore = await balanceOf(
          ADDRESSES.main.WETH,
          ADDRESSES.main.feeRecipient,
          { config, isFormatted: true },
        )

        const [_txStatus] = await executeThroughProxy(
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

        actualPositionAfterIncreaseAdjust = await strategies.aave.getCurrentStEthEthPosition(
          { proxyAddress: system.common.dsProxy.address },
          { ...dependencies },
        )

        it('Increase Position Risk T/x should pass', () => {
          expect(increaseRiskTxStatus).to.be.true
        })

        it('Should draw debt according to multiple', async () => {
          expect(actualPositionAfterIncreaseAdjust.debt.amount.toString()).to.be.oneOf([
            adjustStrategyIncreaseRisk.simulation.position.debt.amount.minus(ONE).toString(),
            adjustStrategyIncreaseRisk.simulation.position.debt.amount.toString(),
          ])
        })

        it('Should collect fee', async () => {
          const feeRecipientWethBalanceAfter = await balanceOf(
            ADDRESSES.main.WETH,
            ADDRESSES.main.feeRecipient,
            { config, isFormatted: true },
          )

          expectToBeEqual(
            new BigNumber(adjustStrategyIncreaseRisk.simulation.swap.sourceTokenFee.toFixed(6)),
            feeRecipientWethBalanceAfter.minus(feeRecipientWethBalanceBefore).toFixed(6),
          )
        })
      })
    })

    describe('On latest block using one inch exchange and api', () => {
      const slippage = new BigNumber(0.1)
      const depositAmount = amountToWei(new BigNumber(60 / 1e15))
      const multiple = new BigNumber(2)
      let aaveStEthPriceInEth: BigNumber

      let system: DeployedSystemInfo

      let openStrategy: IStrategy
      let txStatus: boolean

      let feeRecipientWethBalanceBefore: BigNumber

      let actualPosition: IPosition

      before(async function () {
        const shouldRun1InchTests = process.env.RUN_1INCH_TESTS === '1'
        if (shouldRun1InchTests) {
          await resetNodeToLatestBlock(provider)
          const { system: _system } = await deploySystem(config, false, false)
          system = _system

          const addresses = {
            ...mainnetAddresses,
            operationExecutor: system.common.operationExecutor.address,
          }

          const beforeOpenPosition = await strategies.aave.getCurrentStEthEthPosition(
            { proxyAddress: system.common.dsProxy.address },
            {
              addresses: {
                ...addresses,
              },
              provider: config.provider,
            },
          )

          openStrategy = await strategies.aave.openStEth(
            {
              depositAmount,
              slippage,
              multiple,
            },
            {
              currentPosition: beforeOpenPosition,
              addresses,
              provider,
              getSwapData: getOneInchCall(system.common.swap.address),
              dsProxy: system.common.dsProxy.address,
            },
          )

          feeRecipientWethBalanceBefore = await balanceOf(
            ADDRESSES.main.WETH,
            ADDRESSES.main.feeRecipient,
            { config, isFormatted: true },
          )

          const [_txStatus] = await executeThroughProxy(
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

          const aavePriceOracle = new ethers.Contract(
            addresses.aavePriceOracle,
            aavePriceOracleABI,
            provider,
          )

          aaveStEthPriceInEth = await aavePriceOracle
            .getAssetPrice(addresses.stETH)
            .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString())))

          actualPosition = await strategies.aave.getCurrentStEthEthPosition(
            { proxyAddress: system.common.dsProxy.address },
            {
              addresses: {
                ...mainnetAddresses,
              },
              provider: config.provider,
            },
          )
        } else {
          this.skip()
        }
      })

      it('Open Position Tx should pass', () => {
        expect(txStatus).to.be.true
      })

      it('Should draw debt according to multiple', () => {
        expect(new BigNumber(actualPosition.debt.amount.toString()).toString()).to.be.oneOf([
          openStrategy.simulation.position.debt.amount.toString(),
          openStrategy.simulation.position.debt.amount.minus(ONE).toString(),
        ])
      })

      describe('Increase Loan-to-Value (Increase risk)', () => {
        let adjustStrategyIncreaseRisk: IStrategy
        const adjustMultipleUp = new BigNumber(3.5)
        let increaseRiskTxStatus: boolean
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
              getSwapData: getOneInchCall(system.common.swap.address),
              dsProxy: system.common.dsProxy.address,
            },
          )

          feeRecipientWethBalanceBefore = await balanceOf(
            ADDRESSES.main.WETH,
            ADDRESSES.main.feeRecipient,
            { config, isFormatted: true },
          )

          const [_txStatus] = await executeThroughProxy(
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
        })

        it('Increase Position Risk T/x should pass', () => {
          expect(increaseRiskTxStatus).to.be.true
        })

        it('Should draw debt according to multiply', async () => {
          expect(
            new BigNumber(actualPositionAfterIncreaseAdjust.debt.amount.toString()).toString(),
          ).to.be.oneOf([
            adjustStrategyIncreaseRisk.simulation.position.debt.amount.toString(),
            adjustStrategyIncreaseRisk.simulation.position.debt.amount.minus(ONE).toString(),
          ])
        })

        it('Should collect fee', async () => {
          const feeRecipientWethBalanceAfter = await balanceOf(
            ADDRESSES.main.WETH,
            ADDRESSES.main.feeRecipient,
            { config, isFormatted: true },
          )

          expectToBeEqual(
            new BigNumber(adjustStrategyIncreaseRisk.simulation.swap.sourceTokenFee.toFixed(6)),
            feeRecipientWethBalanceAfter.minus(feeRecipientWethBalanceBefore).toFixed(6),
          )
        })
      })
    })

    describe('On forked chain', () => {
      const depositAmount = amountToWei(new BigNumber(60 / 1e15))
      const multiple = new BigNumber(2)
      const slippage = new BigNumber(0.1)

      let system: DeployedSystemInfo

      let openStrategy: IStrategy

      let txStatus: boolean

      let userAccountData: AAVEAccountData

      let feeRecipientWethBalanceBefore: BigNumber

      before(async () => {
        ;({ config, provider, signer } = await loadFixture(initialiseConfig))
        const testBlockThatWorksWithUSwap = 15695000
        const snapshot = await restoreSnapshot(config, provider, testBlockThatWorksWithUSwap)
        system = snapshot.deployed.system

        const addresses = {
          ...mainnetAddresses,
          operationExecutor: system.common.operationExecutor.address,
        }

        const beforeOpenPosition = await strategies.aave.getCurrentStEthEthPosition(
          { proxyAddress: system.common.dsProxy.address },
          {
            addresses: {
              ...mainnetAddresses,
            },
            provider: config.provider,
          },
        )

        openStrategy = await strategies.aave.openStEth(
          {
            depositAmount,
            slippage,
            multiple,
          },
          {
            currentPosition: beforeOpenPosition,
            addresses,
            provider,
            getSwapData: oneInchCallMock(new BigNumber(0.979)),
            dsProxy: system.common.dsProxy.address,
          },
        )

        feeRecipientWethBalanceBefore = await balanceOf(
          ADDRESSES.main.WETH,
          ADDRESSES.main.feeRecipient,
          { config, isFormatted: true },
        )

        const [_txStatus] = await executeThroughProxy(
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

        userAccountData = await aaveLendingPool.getUserAccountData(system.common.dsProxy.address)
      })

      it('Open Position Tx should pass', () => {
        expect(txStatus).to.be.true
      })

      it('Should draw debt according to multiple', () => {
        expectToBe(
          openStrategy.simulation.position.debt.amount.minus(ONE).toFixed(0),
          'lte',
          new BigNumber(userAccountData.totalDebtETH.toString()),
        )
      })

      describe('Decrease Loan-to-Value (Reduce risk)', () => {
        let adjustStrategyReduceRisk: IStrategy
        const adjustMultipleDown = new BigNumber(1.5)
        let reduceRiskTxStatus: boolean

        let actualPosition: IPosition

        before(async () => {
          const addresses = {
            ...mainnetAddresses,
            operationExecutor: system.common.operationExecutor.address,
          }

          actualPosition = await strategies.aave.getCurrentStEthEthPosition(
            { proxyAddress: system.common.dsProxy.address },
            {
              addresses: {
                ...mainnetAddresses,
              },
              provider: config.provider,
            },
          )

          adjustStrategyReduceRisk = await strategies.aave.adjustStEth(
            {
              slippage,
              multiple: adjustMultipleDown,
            },
            {
              addresses,
              provider,
              position: actualPosition,
              getSwapData: oneInchCallMock(new BigNumber(1 / 0.976)),
              dsProxy: system.common.dsProxy.address,
            },
          )

          feeRecipientWethBalanceBefore = await balanceOf(
            ADDRESSES.main.WETH,
            ADDRESSES.main.feeRecipient,
            { config, isFormatted: true },
          )

          const [_txStatus] = await executeThroughProxy(
            system.common.dsProxy.address,
            {
              address: system.common.operationExecutor.address,
              calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
                adjustStrategyReduceRisk.calls,
                OPERATION_NAMES.common.CUSTOM_OPERATION,
              ]),
            },
            signer,
          )
          reduceRiskTxStatus = _txStatus

          actualPosition = await strategies.aave.getCurrentStEthEthPosition(
            { proxyAddress: system.common.dsProxy.address },
            {
              addresses: {
                ...mainnetAddresses,
              },
              provider: config.provider,
            },
          )
        })

        it('Reduce Position Risk T/x should pass', () => {
          expect(reduceRiskTxStatus).to.be.true
        })

        it('Should reduce collateral according to multiple', () => {
          expect(actualPosition.collateral.amount.toString()).to.be.oneOf([
            adjustStrategyReduceRisk.simulation.position.collateral.amount.toFixed(0),
            adjustStrategyReduceRisk.simulation.position.collateral.amount.minus(ONE).toFixed(0),
          ])
        })

        it('should not be any token left on proxy', async () => {
          const proxyWethBalance = await balanceOf(
            ADDRESSES.main.WETH,
            system.common.dsProxy.address,
            {
              config,
              isFormatted: true,
            },
          )
          const proxyStEthBalance = await balanceOf(
            ADDRESSES.main.stETH,
            system.common.dsProxy.address,
            {
              config,
              isFormatted: true,
            },
          )
          const proxyEthBalance = await balanceOf(
            ADDRESSES.main.ETH,
            system.common.dsProxy.address,
            {
              config,
              isFormatted: true,
            },
          )

          expectToBeEqual(proxyWethBalance, ZERO)
          expectToBeEqual(proxyStEthBalance, ZERO)
          expectToBeEqual(proxyEthBalance, ZERO)
        })

        it('Should collect fee', async () => {
          const feeRecipientWethBalanceAfter = await balanceOf(
            ADDRESSES.main.WETH,
            ADDRESSES.main.feeRecipient,
            { config, isFormatted: true },
          )

          expectToBeEqual(
            new BigNumber(adjustStrategyReduceRisk.simulation.swap.targetTokenFee.toFixed(6)),
            feeRecipientWethBalanceAfter.minus(feeRecipientWethBalanceBefore).toFixed(6),
          )
        })
      })
    })

    describe('On latest block using one inch exchange and api', () => {
      const slippage = new BigNumber(0.1)
      const depositAmount = amountToWei(new BigNumber(60 / 1e15))
      const multiple = new BigNumber(2)

      let system: DeployedSystemInfo

      let openStrategy: IStrategy
      let txStatus: boolean

      let userAccountData: AAVEAccountData

      let feeRecipientWethBalanceBefore: BigNumber

      before(async function () {
        const shouldRun1InchTests = process.env.RUN_1INCH_TESTS === '1'
        if (shouldRun1InchTests) {
          await resetNodeToLatestBlock(provider)
          const { system: _system } = await deploySystem(config, false, false)
          system = _system

          const addresses = {
            ...mainnetAddresses,
            operationExecutor: system.common.operationExecutor.address,
          }

          const beforeOpenPosition = await strategies.aave.getCurrentStEthEthPosition(
            { proxyAddress: system.common.dsProxy.address },
            {
              addresses: {
                ...mainnetAddresses,
              },
              provider: config.provider,
            },
          )

          openStrategy = await strategies.aave.openStEth(
            {
              depositAmount,
              slippage,
              multiple,
            },
            {
              currentPosition: beforeOpenPosition,
              addresses,
              provider,
              getSwapData: getOneInchCall(system.common.swap.address),
              dsProxy: system.common.dsProxy.address,
            },
          )

          feeRecipientWethBalanceBefore = await balanceOf(
            ADDRESSES.main.WETH,
            ADDRESSES.main.feeRecipient,
            { config, isFormatted: true },
          )

          const [_txStatus] = await executeThroughProxy(
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

          userAccountData = await aaveLendingPool.getUserAccountData(system.common.dsProxy.address)
        } else {
          this.skip()
        }
      })

      it('Open Position Tx should pass', () => {
        expect(txStatus).to.be.true
      })

      it('Should draw debt according to multiple', () => {
        expectToBe(
          openStrategy.simulation.position.debt.amount.minus(ONE).toFixed(0),
          'lte',
          new BigNumber(userAccountData.totalDebtETH.toString()),
        )
      })

      describe('Decrease Loan-to-Value (Decrease risk)', () => {
        let adjustStrategyReduceRisk: IStrategy
        const adjustMultipleDown = new BigNumber(1.5)
        let reduceRiskTxStatus: boolean

        let actualPositionAfterDecreasingRisk: IPosition

        before(async () => {
          const addresses = {
            ...mainnetAddresses,
            operationExecutor: system.common.operationExecutor.address,
          }

          const currentPosition = await strategies.aave.getCurrentStEthEthPosition(
            { proxyAddress: system.common.dsProxy.address },
            {
              addresses: {
                ...mainnetAddresses,
              },
              provider: config.provider,
            },
          )

          adjustStrategyReduceRisk = await strategies.aave.adjustStEth(
            {
              slippage,
              multiple: adjustMultipleDown,
            },
            {
              addresses,
              provider,
              position: currentPosition,
              getSwapData: getOneInchCall(system.common.swap.address),
              dsProxy: system.common.dsProxy.address,
            },
          )

          feeRecipientWethBalanceBefore = await balanceOf(
            ADDRESSES.main.WETH,
            ADDRESSES.main.feeRecipient,
            { config, isFormatted: true },
          )

          const [_txStatus] = await executeThroughProxy(
            system.common.dsProxy.address,
            {
              address: system.common.operationExecutor.address,
              calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
                adjustStrategyReduceRisk.calls,
                OPERATION_NAMES.common.CUSTOM_OPERATION,
              ]),
            },
            signer,
          )
          reduceRiskTxStatus = _txStatus

          actualPositionAfterDecreasingRisk = await strategies.aave.getCurrentStEthEthPosition(
            { proxyAddress: system.common.dsProxy.address },
            {
              addresses: {
                ...mainnetAddresses,
              },
              provider: config.provider,
            },
          )

          it('Reduce Position Risk T/x should pass', () => {
            expect(reduceRiskTxStatus).to.be.true
          })

          it('Should reduce collateral according to multiple', () => {
            expect(actualPositionAfterDecreasingRisk.collateral.amount.toString()).to.be.oneOf([
              adjustStrategyReduceRisk.simulation.position.collateral.amount.toFixed(0),
              adjustStrategyReduceRisk.simulation.position.collateral.amount.minus(ONE).toFixed(0),
            ])
          })

          it('should not be any token left on proxy', async () => {
            const proxyWethBalance = await balanceOf(
              ADDRESSES.main.WETH,
              system.common.dsProxy.address,
              {
                config,
                isFormatted: true,
              },
            )
            const proxyStEthBalance = await balanceOf(
              ADDRESSES.main.stETH,
              system.common.dsProxy.address,
              {
                config,
                isFormatted: true,
              },
            )
            const proxyEthBalance = await balanceOf(
              ADDRESSES.main.ETH,
              system.common.dsProxy.address,
              {
                config,
                isFormatted: true,
              },
            )

            expectToBeEqual(proxyWethBalance, ZERO)
            expectToBeEqual(proxyStEthBalance, ZERO)
            expectToBeEqual(proxyEthBalance, ZERO)
          })

          it('Should collect fee', async () => {
            const feeRecipientWethBalanceAfter = await balanceOf(
              ADDRESSES.main.WETH,
              ADDRESSES.main.feeRecipient,
              { config, isFormatted: true },
            )

            expectToBeEqual(
              new BigNumber(adjustStrategyReduceRisk.simulation.swap.targetTokenFee.toFixed(6)),
              feeRecipientWethBalanceAfter.minus(feeRecipientWethBalanceBefore).toFixed(6),
            )
          })
        })
      })
    })
  })
})
