<<<<<<<< HEAD:packages/dupa-library/test/aave/Adjust.test.ts
import { executeThroughProxy } from '@oasisdex/dupa-common/utils/deploy'
import { oneInchCallMock } from '@oasisdex/dupa-common/utils/swap/OneInchCallMock'
import { RuntimeConfig, Unbox } from '@oasisdex/dupa-common/utils/types/common'
import { balanceOf } from 'packages/dupa-common/utils/common'
import AAVELendingPoolABI from '@oasisdex/dupa-contracts/abi/external/aave/v2/lendingPool.json'
import aavePriceOracleABI from '@oasisdex/dupa-contracts/abi/external/aave/v2/priceOracle.json'
import AAVEDataProviderABI from '@oasisdex/dupa-contracts/abi/external/aave/v2/protocolDataProvider.json'
========
import AAVELendingPoolABI from '@abi/external/aave/v2/lendingPool.json'
import aavePriceOracleABI from '@abi/external/aave/v2/priceOracle.json'
import AAVEDataProviderABI from '@abi/external/aave/v2/protocolDataProvider.json'
import { executeThroughProxy } from '@helpers/deploy'
import { oneInchCallMock } from '@helpers/swap/OneInchCallMock'
import { RuntimeConfig, Unbox } from '@helpers/types/common'
import { balanceOf } from '@helpers/utils'
import {
  AAVETokens,
  ADDRESSES,
  IPosition,
  IRiskRatio,
  ONE,
  RiskRatio,
  strategies,
} from '@oasisdex/oasis-actions'
import { amountFromWei } from '@oasisdex/oasis-actions/lib/packages/oasis-actions/src/helpers'
import { acceptedFeeToken } from '@oasisdex/oasis-actions/lib/packages/oasis-actions/src/helpers/swap/acceptedFeeToken'
import { PositionType } from '@oasisdex/oasis-actions/lib/packages/oasis-actions/src/types'
>>>>>>>> dev:test/e2e/strategies/aave/Adjust.test.ts
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { loadFixture } from 'ethereum-waffle'
import { Contract, ethers } from 'ethers'

<<<<<<<< HEAD:packages/dupa-library/test/aave/Adjust.test.ts
import { AAVETokens, ADDRESSES, IPosition, IRiskRatio, ONE, RiskRatio, strategies } from '../../src'
import { amountFromWei } from '../../src/helpers'
import { acceptedFeeToken } from '../../src/helpers/swap/acceptedFeeToken'
import { PositionType } from '../../src/types'
import { mainnetAddresses } from '../addresses'
import { DeployedSystemInfo } from '../deploy-system'
========
import { mainnetAddresses } from '../../../addresses'
import { DeployedSystemInfo } from '../../../deploySystem'
>>>>>>>> dev:test/e2e/strategies/aave/Adjust.test.ts
import {
  getSupportedStrategies,
  getSystemWithAavePositions,
  SystemWithAAVEPositions,
} from '../../../fixtures'
import { SLIPPAGE, UNISWAP_TEST_SLIPPAGE } from '../../../fixtures/factories/common'
import {
  getSupportedAaveV3Strategies,
  getSystemWithAaveV3Positions,
<<<<<<<< HEAD:packages/dupa-library/test/aave/Adjust.test.ts
} from '../fixtures/system/getSystemWithAaveV3Positions'
import { TokenDetails } from '../fixtures/types/positionDetails'
import { SystemWithAAVEV3Positions } from '../fixtures/types/systemWithAAVEPositions'
import { expectToBe } from '../../../dupa-common/test-utils/expect'
========
} from '../../../fixtures/system/getSystemWithAaveV3Positions'
import { TokenDetails } from '../../../fixtures/types/positionDetails'
import { SystemWithAAVEV3Positions } from '../../../fixtures/types/systemWithAAVEPositions'
import { expectToBe } from '../../../utils'
>>>>>>>> dev:test/e2e/strategies/aave/Adjust.test.ts

const ciOnlyTests = process.env.RUN_ONLY_CI_TESTS === '1'
const EXPECT_LARGER_SIMULATED_FEE = 'Expect simulated fee to be more than the user actual pays'

describe('Strategy | AAVE | Adjust Position', async function () {
  describe('Using AAVE V2', async function () {
    let fixture: SystemWithAAVEPositions

    const supportedStrategies = getSupportedStrategies(ciOnlyTests)

    async function adjustPositionV2({
      isDPMProxy,
      targetMultiple,
      position,
      collateralToken,
      debtToken,
      proxy,
      userAddress,
      getSwapData,
      slippage,
      positionType,
      config,
      system,
    }: {
      isDPMProxy: boolean
      targetMultiple: IRiskRatio
      position: IPosition
      collateralToken: TokenDetails
      debtToken: TokenDetails
      proxy: string
      userAddress: string
      getSwapData: any
      slippage: BigNumber
      positionType: PositionType
      config: RuntimeConfig
      system: DeployedSystemInfo
    }) {
      const addresses = {
        ...mainnetAddresses,
        priceOracle: mainnetAddresses.aave.v2.priceOracle,
        lendingPool: mainnetAddresses.aave.v2.lendingPool,
        protocolDataProvider: mainnetAddresses.aave.v2.protocolDataProvider,
        operationExecutor: system.common.operationExecutor.address,
      }
      const tokenAddresses: Record<AAVETokens, string> = {
        WETH: mainnetAddresses.WETH,
        ETH: mainnetAddresses.WETH,
        STETH: mainnetAddresses.STETH,
        WSTETH: mainnetAddresses.WSTETH,
        USDC: mainnetAddresses.USDC,
        WBTC: mainnetAddresses.WBTC,
      }

      const collateralTokenAddress = tokenAddresses[collateralToken.symbol]
      const debtTokenAddress = tokenAddresses[debtToken.symbol]
      const isIncreasingRisk = isRiskIncreasing(position.riskRatio, targetMultiple)
      const fromToken = isIncreasingRisk ? debtToken : collateralToken
      const toToken = isIncreasingRisk ? collateralToken : debtToken

      const isFeeFromSourceToken =
        acceptedFeeToken({
          fromToken: fromToken.symbol,
          toToken: toToken.symbol,
        }) === 'sourceToken'
      const isFeeFromDebtToken = isIncreasingRisk ? isFeeFromSourceToken : !isFeeFromSourceToken

      const feeWalletBalanceBeforeAdjust = await balanceOf(
        isFeeFromDebtToken ? debtToken.address : collateralToken.address,
        ADDRESSES.main.feeRecipient,
        { config },
      )

      const provider = config.provider
      const signer = config.signer

      const lendingPool = new Contract(
        ADDRESSES.main.aave.v2.LendingPool,
        AAVELendingPoolABI,
        provider,
      )

      const protocolDataProvider = new Contract(
        ADDRESSES.main.aave.v2.ProtocolDataProvider,
        AAVEDataProviderABI,
        provider,
      )

      const priceOracle = new ethers.Contract(
        ADDRESSES.main.aave.v2.PriceOracle,
        aavePriceOracleABI,
        provider,
      )

      const strategy = await strategies.aave.v2.adjust(
        {
          slippage,
          multiple: targetMultiple,
          positionType,
          debtToken: { symbol: debtToken.symbol, precision: debtToken.precision },
          collateralToken: {
            symbol: collateralToken.symbol,
            precision: collateralToken.precision,
          },
        },
        {
          isDPMProxy,
          addresses,
          provider,
          currentPosition: position,
          getSwapData,
          proxy,
          user: userAddress,
        },
      )

      const [txStatus, tx] = await executeThroughProxy(
        proxy,
        {
          address: system.common.operationExecutor.address,
          calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
            strategy.transaction.calls,
            strategy.transaction.operationName,
          ]),
        },
        signer,
        '0',
      )

      // Get data from AAVE
      const protocolDataPromises = [
        protocolDataProvider.getUserReserveData(collateralTokenAddress, proxy),
        protocolDataProvider.getUserReserveData(debtTokenAddress, proxy),
        priceOracle
          .getAssetPrice(collateralTokenAddress)
          .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString()))),
        priceOracle
          .getAssetPrice(debtTokenAddress)
          .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString()))),
        lendingPool.getUserAccountData(proxy),
      ]
      const protocolData = await Promise.all(protocolDataPromises)

      const feeWalletBalanceAfterAdjust = await balanceOf(
        isFeeFromDebtToken ? debtToken.address : collateralToken.address,
        ADDRESSES.main.feeRecipient,
        { config },
      )

      const adjustedPosition = await strategies.aave.v2.view(
        {
          proxy,
          collateralToken,
          debtToken,
        },
        {
          addresses,
          provider,
        },
      )

      return {
        adjustedPosition,
        simulation: strategy.simulation,
        txStatus,
        tx,
        protocolData: {
          collateral: protocolData[0],
          debt: protocolData[1],
          collateralPrice: protocolData[2],
          debtPrice: protocolData[3],
          userAccountData: protocolData[4],
        },
        debtTokenAddress,
        collateralTokenAddress,
        feeWalletBalanceBeforeAdjust,
        feeWalletBalanceAfterAdjust,
      }
    }
    describe('Adjust Risk Up', async function () {
      before(async () => {
        fixture = await loadFixture(getSystemWithAavePositions({ use1inch: false }))
      })
      describe('Using DSProxy', () => {
        let act: Unbox<ReturnType<typeof adjustPositionV2>>

        before(async () => {
          const { config, system, dsProxyPosition: dsProxyStEthEthEarnPositionDetails } = fixture
          const { debtToken, collateralToken, proxy } = dsProxyStEthEthEarnPositionDetails

          const position = await dsProxyStEthEthEarnPositionDetails.getPosition()
          act = await adjustPositionV2({
            isDPMProxy: false,
            targetMultiple: new RiskRatio(new BigNumber(3.5), RiskRatio.TYPE.MULITPLE),
            positionType: 'Earn',
            position,
            collateralToken,
            debtToken,
            proxy,
            slippage: UNISWAP_TEST_SLIPPAGE,
            getSwapData: oneInchCallMock(dsProxyStEthEthEarnPositionDetails.__mockPrice, {
              from: debtToken.precision,
              to: collateralToken.precision,
            }),
            userAddress: config.address,
            config,
            system,
          })
        })
        it('Adjust TX should pass', () => {
          expect(act.txStatus).to.be.true
        })
        it('should draw debt according to multiple', async () => {
          expectToBe(
            act.adjustedPosition.debt.amount.toString(),
            'gte',
            act.simulation.position.debt.amount.toString(),
          )
        })
        it('should collect fee', async () => {
          const actualFeesDelta = act.feeWalletBalanceAfterAdjust.minus(
            act.feeWalletBalanceBeforeAdjust,
          )

          expectToBe(
            act.simulation.swap.tokenFee,
            'gte',
            actualFeesDelta,
            EXPECT_LARGER_SIMULATED_FEE,
          )
        })
      })
      describe('Using DPM Proxy', () => {
        supportedStrategies.forEach(({ name: strategy }) => {
          let act: Unbox<ReturnType<typeof adjustPositionV2>>

          before(async function () {
            const { system, config, dpmPositions } = fixture

            const positionDetails = dpmPositions[strategy]
            if (!positionDetails) {
              this.skip()
            }

            const { debtToken, collateralToken, proxy } = positionDetails

            const position = await positionDetails.getPosition()
            const slippage =
              positionDetails?.strategy === 'STETH/USDC Multiply' ? UNISWAP_TEST_SLIPPAGE : SLIPPAGE
            act = await adjustPositionV2({
              isDPMProxy: true,
              targetMultiple: new RiskRatio(new BigNumber(3.5), RiskRatio.TYPE.MULITPLE),
              positionType: positionDetails?.__positionType,
              position,
              collateralToken,
              debtToken,
              proxy,
              slippage,
              getSwapData: oneInchCallMock(positionDetails.__mockPrice, {
                from: debtToken.precision,
                to: collateralToken.precision,
              }),
              userAddress: config.address,
              config,
              system,
            })
          })
          it('Adjust TX should pass', () => {
            expect(act.txStatus).to.be.true
          })
          it('should draw debt according to multiple', async () => {
            expectToBe(
              act.adjustedPosition.debt.amount.toString(),
              'gte',
              act.simulation.position.debt.amount.toString(),
            )
          })
          it('should collect fee', async () => {
            const actualFeesDelta = act.feeWalletBalanceAfterAdjust.minus(
              act.feeWalletBalanceBeforeAdjust,
            )

            expectToBe(
              act.simulation.swap.tokenFee,
              'gte',
              actualFeesDelta,
              EXPECT_LARGER_SIMULATED_FEE,
            )
          })
        })
      })
    })
    describe('Adjust Risk Down', async function () {
      before(async () => {
        fixture = await loadFixture(getSystemWithAavePositions({ use1inch: false }))
      })
      describe('Using DSProxy', () => {
        let act: Unbox<ReturnType<typeof adjustPositionV2>>

        before(async () => {
          const { config, system, dsProxyPosition: dsProxyStEthEthEarnPositionDetails } = fixture
          const { debtToken, collateralToken, proxy } = dsProxyStEthEthEarnPositionDetails

          const position = await dsProxyStEthEthEarnPositionDetails.getPosition()
          act = await adjustPositionV2({
            isDPMProxy: false,
            targetMultiple: new RiskRatio(new BigNumber(1.3), RiskRatio.TYPE.MULITPLE),
            positionType: 'Earn',
            position,
            collateralToken,
            debtToken,
            proxy,
            slippage: UNISWAP_TEST_SLIPPAGE,
            getSwapData: oneInchCallMock(ONE.div(dsProxyStEthEthEarnPositionDetails.__mockPrice), {
              from: collateralToken.precision,
              to: debtToken.precision,
            }),
            userAddress: config.address,
            config,
            system,
          })
        })
        it('Adjust TX should pass', () => {
          expect(act.txStatus).to.be.true
        })
        it('should payback debt according to multiple', async () => {
          // The simulation will include a higher debt figure than actual because the resulting swapped debt
          // Should be lower due to the conservative application of slippage
          expectToBe(
            act.simulation.position.debt.amount.toString(),
            'gte',
            act.adjustedPosition.debt.amount.toString(),
          )
        })
        it('should collect fee', async () => {
          const actualFeesDelta = act.feeWalletBalanceAfterAdjust.minus(
            act.feeWalletBalanceBeforeAdjust,
          )

          expectToBe(act.simulation.swap.tokenFee, 'gte', actualFeesDelta)
        })
      })
      describe('Using DPM Proxy', () => {
        supportedStrategies
          .filter(s => s.name !== 'STETH/USDC Multiply')
          .forEach(({ name: strategy }) => {
            let act: Unbox<ReturnType<typeof adjustPositionV2>>

            before(async function () {
              const { system, config, dpmPositions } = fixture

              const positionDetails = dpmPositions[strategy]
              if (!positionDetails) {
                this.skip()
              }

              const { debtToken, collateralToken, proxy } = positionDetails

              const position = await positionDetails.getPosition()
              const slippage = UNISWAP_TEST_SLIPPAGE

              act = await adjustPositionV2({
                isDPMProxy: true,
                targetMultiple: new RiskRatio(new BigNumber(1.3), RiskRatio.TYPE.MULITPLE),
                positionType: positionDetails?.__positionType,
                position,
                collateralToken,
                debtToken,
                proxy,
                slippage,
                getSwapData: oneInchCallMock(ONE.div(positionDetails.__mockPrice), {
                  from: collateralToken.precision,
                  to: debtToken.precision,
                }),
                userAddress: config.address,
                config,
                system,
              })
            })
            it('Adjust TX should pass', () => {
              expect(act.txStatus).to.be.true
            })
            it('should payback debt according to multiple', async () => {
              // The simulation will include a higher debt figure than actual because the resulting swapped debt
              // Should be lower due to the conservative application of slippage
              expectToBe(
                act.simulation.position.debt.amount.toString(),
                'gte',
                act.adjustedPosition.debt.amount.toString(),
              )
            })
            it('should collect fee', async () => {
              const actualFeesDelta = act.feeWalletBalanceAfterAdjust.minus(
                act.feeWalletBalanceBeforeAdjust,
              )

              expectToBe(
                act.simulation.swap.tokenFee,
                'gte',
                actualFeesDelta,
                EXPECT_LARGER_SIMULATED_FEE,
              )
            })
          })
      })
    })
  })
  describe('Using AAVE V3', async function () {
    let fixture: SystemWithAAVEV3Positions
    const supportedStrategies = getSupportedAaveV3Strategies(ciOnlyTests)

    async function adjustPositionV3({
      isDPMProxy,
      targetMultiple,
      position,
      collateralToken,
      debtToken,
      proxy,
      userAddress,
      getSwapData,
      slippage,
      positionType,
      config,
      system,
    }: {
      isDPMProxy: boolean
      targetMultiple: IRiskRatio
      position: IPosition
      collateralToken: TokenDetails
      debtToken: TokenDetails
      proxy: string
      userAddress: string
      getSwapData: any
      slippage: BigNumber
      positionType: PositionType
      config: RuntimeConfig
      system: DeployedSystemInfo
    }) {
      const addresses = {
        ...mainnetAddresses,
        aaveOracle: mainnetAddresses.aave.v3.aaveOracle,
        pool: mainnetAddresses.aave.v3.pool,
        aaveProtocolDataProvider: mainnetAddresses.aave.v3.aaveProtocolDataProvider,
        operationExecutor: system.common.operationExecutor.address,
      }
      const tokenAddresses: Record<AAVETokens, string> = {
        WETH: mainnetAddresses.WETH,
        ETH: mainnetAddresses.WETH,
        STETH: mainnetAddresses.STETH,
        WSTETH: mainnetAddresses.WSTETH,
        USDC: mainnetAddresses.USDC,
        WBTC: mainnetAddresses.WBTC,
      }

      const collateralTokenAddress = tokenAddresses[collateralToken.symbol]
      const debtTokenAddress = tokenAddresses[debtToken.symbol]
      const isIncreasingRisk = isRiskIncreasing(position.riskRatio, targetMultiple)
      const fromToken = isIncreasingRisk ? debtToken : collateralToken
      const toToken = isIncreasingRisk ? collateralToken : debtToken
      const isFeeFromSourceToken =
        acceptedFeeToken({
          fromToken: fromToken.symbol,
          toToken: toToken.symbol,
        }) === 'sourceToken'
      const isFeeFromDebtToken = isIncreasingRisk ? isFeeFromSourceToken : !isFeeFromSourceToken

      const feeWalletBalanceBeforeAdjust = await balanceOf(
        isFeeFromDebtToken ? debtToken.address : collateralToken.address,
        ADDRESSES.main.feeRecipient,
        { config },
      )

      const provider = config.provider
      const signer = config.signer

      const pool = new Contract(ADDRESSES.main.aave.v3.Pool, AAVELendingPoolABI, provider)

      const aaveProtocolDataProvider = new Contract(
        ADDRESSES.main.aave.v3.AaveProtocolDataProvider,
        AAVEDataProviderABI,
        provider,
      )

      const aaveOracle = new ethers.Contract(
        ADDRESSES.main.aave.v3.AaveOracle,
        aavePriceOracleABI,
        provider,
      )

      const strategy = await strategies.aave.v3.adjust(
        {
          slippage,
          multiple: targetMultiple,
          positionType,
          debtToken: { symbol: debtToken.symbol, precision: debtToken.precision },
          collateralToken: {
            symbol: collateralToken.symbol,
            precision: collateralToken.precision,
          },
        },
        {
          isDPMProxy,
          addresses,
          provider,
          currentPosition: position,
          getSwapData,
          proxy,
          user: userAddress,
        },
      )

      const [txStatus, tx] = await executeThroughProxy(
        proxy,
        {
          address: system.common.operationExecutor.address,
          calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
            strategy.transaction.calls,
            strategy.transaction.operationName,
          ]),
        },
        signer,
        '0',
      )

      // Get data from AAVE
      const protocolDataPromises = [
        aaveProtocolDataProvider.getUserReserveData(collateralTokenAddress, proxy),
        aaveProtocolDataProvider.getUserReserveData(debtTokenAddress, proxy),
        aaveOracle
          .getAssetPrice(collateralTokenAddress)
          .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString()))),
        aaveOracle
          .getAssetPrice(debtTokenAddress)
          .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString()))),
        pool.getUserAccountData(proxy),
      ]
      const protocolData = await Promise.all(protocolDataPromises)

      const feeWalletBalanceAfterAdjust = await balanceOf(
        isFeeFromDebtToken ? debtToken.address : collateralToken.address,
        ADDRESSES.main.feeRecipient,
        { config },
      )

      const adjustedPosition = await strategies.aave.v3.view(
        {
          proxy,
          collateralToken,
          debtToken,
        },
        {
          addresses,
          provider,
        },
      )

      return {
        adjustedPosition,
        simulation: strategy.simulation,
        txStatus,
        tx,
        protocolData: {
          collateral: protocolData[0],
          debt: protocolData[1],
          collateralPrice: protocolData[2],
          debtPrice: protocolData[3],
          userAccountData: protocolData[4],
        },
        debtTokenAddress,
        collateralTokenAddress,
        feeWalletBalanceBeforeAdjust,
        feeWalletBalanceAfterAdjust,
      }
    }

    describe('Adjust Risk Up', async function () {
      before(async () => {
        fixture = await loadFixture(getSystemWithAaveV3Positions({ use1inch: false }))
      })
      describe('Using DSProxy', () => {
        let act: Unbox<ReturnType<typeof adjustPositionV3>>

        before(async () => {
          const { config, system, dsProxyPosition: dsProxyStEthEthEarnPositionDetails } = fixture
          const { debtToken, collateralToken, proxy } = dsProxyStEthEthEarnPositionDetails

          const position = await dsProxyStEthEthEarnPositionDetails.getPosition()
          act = await adjustPositionV3({
            isDPMProxy: false,
            targetMultiple: new RiskRatio(new BigNumber(3.5), RiskRatio.TYPE.MULITPLE),
            positionType: 'Earn',
            position,
            collateralToken,
            debtToken,
            proxy,
            slippage: UNISWAP_TEST_SLIPPAGE,
            getSwapData: oneInchCallMock(dsProxyStEthEthEarnPositionDetails.__mockPrice, {
              from: debtToken.precision,
              to: collateralToken.precision,
            }),
            userAddress: config.address,
            config,
            system,
          })
        })
        it('Adjust TX should pass', () => {
          expect(act.txStatus).to.be.true
        })
        it('should draw debt according to multiple', async () => {
          expectToBe(
            act.adjustedPosition.debt.amount.toString(),
            'gte',
            act.simulation.position.debt.amount.toString(),
          )
        })
        it('should collect fee', async () => {
          const actualFeesDelta = act.feeWalletBalanceAfterAdjust.minus(
            act.feeWalletBalanceBeforeAdjust,
          )

          expectToBe(
            act.simulation.swap.tokenFee,
            'gte',
            actualFeesDelta,
            EXPECT_LARGER_SIMULATED_FEE,
          )
        })
      })
      describe('Using DPM Proxy', () => {
        supportedStrategies
          .filter(s => s.name !== 'WSTETH/ETH Earn')
          .forEach(({ name: strategy }) => {
            let act: Unbox<ReturnType<typeof adjustPositionV3>>

            before(async function () {
              const { system, config, dpmPositions } = fixture

              const positionDetails = dpmPositions[strategy]
              if (!positionDetails) {
                this.skip()
              }

              const { debtToken, collateralToken, proxy } = positionDetails

              const position = await positionDetails.getPosition()
              const slippage = UNISWAP_TEST_SLIPPAGE
              act = await adjustPositionV3({
                isDPMProxy: true,
                targetMultiple: new RiskRatio(new BigNumber(3.5), RiskRatio.TYPE.MULITPLE),
                positionType: positionDetails?.__positionType,
                position,
                collateralToken,
                debtToken,
                proxy,
                slippage,
                getSwapData: oneInchCallMock(positionDetails.__mockPrice, {
                  from: debtToken.precision,
                  to: collateralToken.precision,
                }),
                userAddress: config.address,
                config,
                system,
              })
            })
            it('Adjust TX should pass', () => {
              expect(act.txStatus).to.be.true
            })
            it('should draw debt according to multiple', async () => {
              expectToBe(
                act.adjustedPosition.debt.amount.toString(),
                'gte',
                act.simulation.position.debt.amount.toString(),
              )
            })
            it('should collect fee', async () => {
              const actualFeesDelta = act.feeWalletBalanceAfterAdjust.minus(
                act.feeWalletBalanceBeforeAdjust,
              )

              expectToBe(
                act.simulation.swap.tokenFee,
                'gte',
                actualFeesDelta,
                EXPECT_LARGER_SIMULATED_FEE,
              )
            })
          })
      })
    })
    describe('Adjust Risk Down', async function () {
      before(async () => {
        fixture = await loadFixture(getSystemWithAaveV3Positions({ use1inch: false }))
      })
      describe('Using DSProxy', () => {
        let act: Unbox<ReturnType<typeof adjustPositionV3>>

        before(async () => {
          const { config, system, dsProxyPosition: dsProxyStEthEthEarnPositionDetails } = fixture
          const { debtToken, collateralToken, proxy } = dsProxyStEthEthEarnPositionDetails

          const position = await dsProxyStEthEthEarnPositionDetails.getPosition()
          act = await adjustPositionV3({
            isDPMProxy: false,
            targetMultiple: new RiskRatio(new BigNumber(1.3), RiskRatio.TYPE.MULITPLE),
            positionType: 'Earn',
            position,
            collateralToken,
            debtToken,
            proxy,
            slippage: SLIPPAGE,
            getSwapData: oneInchCallMock(ONE.div(dsProxyStEthEthEarnPositionDetails.__mockPrice), {
              from: collateralToken.precision,
              to: debtToken.precision,
            }),
            userAddress: config.address,
            config,
            system,
          })
        })

        it('Adjust TX should pass', () => {
          expect(act.txStatus).to.be.true
        })
        it('should payback debt according to multiple', async () => {
          expectToBe(
            act.simulation.position.debt.amount.toString(),
            'gte',
            act.adjustedPosition.debt.amount.toString(),
          )
        })
        it('should collect fee', async () => {
          const actualFeesDelta = act.feeWalletBalanceAfterAdjust.minus(
            act.feeWalletBalanceBeforeAdjust,
          )

          expectToBe(
            act.simulation.swap.tokenFee,
            'gte',
            actualFeesDelta,
            EXPECT_LARGER_SIMULATED_FEE,
          )
        })
      })
      describe('Using DPM Proxy', () => {
        supportedStrategies
          .filter(s => s.name !== 'WSTETH/ETH Earn')
          .forEach(({ name: strategy }) => {
            let act: Unbox<ReturnType<typeof adjustPositionV3>>

            before(async function () {
              const { system, config, dpmPositions } = fixture

              const positionDetails = dpmPositions[strategy]
              if (!positionDetails) {
                this.skip()
              }

              const { debtToken, collateralToken, proxy } = positionDetails

              const position = await positionDetails.getPosition()
              const slippage = SLIPPAGE

              act = await adjustPositionV3({
                isDPMProxy: true,
                targetMultiple: new RiskRatio(new BigNumber(1.3), RiskRatio.TYPE.MULITPLE),
                positionType: positionDetails?.__positionType,
                position,
                collateralToken,
                debtToken,
                proxy,
                slippage,
                getSwapData: oneInchCallMock(ONE.div(positionDetails.__mockPrice), {
                  from: collateralToken.precision,
                  to: debtToken.precision,
                }),
                userAddress: config.address,
                config,
                system,
              })
            })
            it('Adjust TX should pass', () => {
              expect(act.txStatus).to.be.true
            })
            it('should payback debt according to multiple', async () => {
              expectToBe(
                act.simulation.position.debt.amount.toString(),
                'gte',
                act.adjustedPosition.debt.amount.toString(),
              )
            })
            it('should collect fee', async () => {
              const actualFeesDelta = act.feeWalletBalanceAfterAdjust.minus(
                act.feeWalletBalanceBeforeAdjust,
              )

              expectToBe(
                act.simulation.swap.tokenFee,
                'gte',
                actualFeesDelta,
                EXPECT_LARGER_SIMULATED_FEE,
              )
            })
          })
      })
    })
  })
})

function isRiskIncreasing(currentMultiple: IRiskRatio, newMultiple: IRiskRatio): boolean {
  return newMultiple.multiple.gte(currentMultiple.multiple)
}
