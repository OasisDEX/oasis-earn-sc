import AAVELendingPoolABI from '@abis/external/protocols/aave/v2/lendingPool.json'
import aavePriceOracleABI from '@abis/external/protocols/aave/v2/priceOracle.json'
import AAVEDataProviderABI from '@abis/external/protocols/aave/v2/protocolDataProvider.json'
import { ONE } from '@dma-common/constants'
import { addressesByNetwork, expect } from '@dma-common/test-utils'
import { RuntimeConfig, Unbox } from '@dma-common/types/common'
import { balanceOf } from '@dma-common/utils/balances'
import { amountFromWei } from '@dma-common/utils/common'
import { executeThroughProxy } from '@dma-common/utils/execute'
import { oneInchCallMock } from '@dma-common/utils/swap'
import {
  getSupportedStrategies,
  SystemWithAavePositions,
  systemWithAavePositions,
} from '@dma-contracts/test/fixtures'
import { SLIPPAGE, UNISWAP_TEST_SLIPPAGE } from '@dma-contracts/test/fixtures/factories/common'
import {
  getSupportedAaveV3Strategies,
  systemWithAaveV3Positions,
} from '@dma-contracts/test/fixtures/system/system-with-aave-v3-positions'
import { TokenDetails } from '@dma-contracts/test/fixtures/types/position-details'
import { SystemWithAAVEV3Positions } from '@dma-contracts/test/fixtures/types/system-with-aave-positions'
import { ADDRESSES } from '@dma-deployments/addresses'
import { DeployedSystem } from '@dma-deployments/types/deployed-system'
import { Network } from '@dma-deployments/types/network'
import { AAVETokens, strategies } from '@dma-library'
import { PositionType } from '@dma-library/types'
import { acceptedFeeToken } from '@dma-library/utils/swap'
import { IPosition, IRiskRatio, RiskRatio } from '@domain'
import BigNumber from 'bignumber.js'
import { loadFixture } from 'ethereum-waffle'
import { Contract, ethers } from 'ethers'

const mainnetAddresses = addressesByNetwork(Network.MAINNET)
const networkFork = process.env.NETWORK_FORK as Network
const EXPECT_LARGER_SIMULATED_FEE = 'Expect simulated fee to be more than the user actual pays'

// TODO: update test
describe.skip('Strategy | AAVE | Adjust Position | E2E', async function () {
  describe('Using AAVE V2', async function () {
    let fixture: SystemWithAavePositions

    const supportedStrategies = getSupportedStrategies()

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
      system: DeployedSystem
    }) {
      const addresses = {
        ...mainnetAddresses,
        operationExecutor: system.OperationExecutor.contract.address,
      }
      const tokenAddresses: Record<AAVETokens, string> = {
        WETH: mainnetAddresses.WETH,
        ETH: mainnetAddresses.WETH,
        STETH: mainnetAddresses.STETH,
        WSTETH: mainnetAddresses.WSTETH,
        USDC: mainnetAddresses.USDC,
        WBTC: mainnetAddresses.WBTC,
      }

      const collateralTokenAddress = tokenAddresses[collateralToken.symbol as AAVETokens]
      const debtTokenAddress = tokenAddresses[debtToken.symbol as AAVETokens]
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
        ADDRESSES[Network.MAINNET].common.FeeRecipient,
        { config },
      )

      const provider = config.provider
      const signer = config.signer

      const lendingPool = new Contract(
        ADDRESSES[Network.MAINNET].aave.v2.LendingPool,
        AAVELendingPoolABI,
        provider,
      )

      const protocolDataProvider = new Contract(
        ADDRESSES[Network.MAINNET].aave.v2.ProtocolDataProvider,
        AAVEDataProviderABI,
        provider,
      )

      const priceOracle = new ethers.Contract(
        ADDRESSES[Network.MAINNET].aave.v2.PriceOracle,
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
          address: system.OperationExecutor.contract.address,
          calldata: system.OperationExecutor.contract.interface.encodeFunctionData('executeOp', [
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
        ADDRESSES[Network.MAINNET].common.FeeRecipient,
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
        fixture = await loadFixture(systemWithAavePositions({ use1inch: false }))
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
          expect.toBe(
            act.adjustedPosition.debt.amount.toString(),
            'gte',
            act.simulation.position.debt.amount.toString(),
          )
        })
        it('should collect fee', async () => {
          const actualFeesDelta = act.feeWalletBalanceAfterAdjust.minus(
            act.feeWalletBalanceBeforeAdjust,
          )

          expect.toBe(
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
            expect.toBe(
              act.adjustedPosition.debt.amount.toString(),
              'gte',
              act.simulation.position.debt.amount.toString(),
            )
          })
          it('should collect fee', async () => {
            const actualFeesDelta = act.feeWalletBalanceAfterAdjust.minus(
              act.feeWalletBalanceBeforeAdjust,
            )

            expect.toBe(
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
        fixture = await loadFixture(systemWithAavePositions({ use1inch: false }))
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
          expect.toBe(
            act.simulation.position.debt.amount.toString(),
            'gte',
            act.adjustedPosition.debt.amount.toString(),
          )
        })
        it('should collect fee', async () => {
          const actualFeesDelta = act.feeWalletBalanceAfterAdjust.minus(
            act.feeWalletBalanceBeforeAdjust,
          )

          expect.toBe(act.simulation.swap.tokenFee, 'gte', actualFeesDelta)
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
              expect.toBe(
                act.simulation.position.debt.amount.toString(),
                'gte',
                act.adjustedPosition.debt.amount.toString(),
              )
            })
            it('should collect fee', async () => {
              const actualFeesDelta = act.feeWalletBalanceAfterAdjust.minus(
                act.feeWalletBalanceBeforeAdjust,
              )

              expect.toBe(
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
    const supportedStrategies = getSupportedAaveV3Strategies()

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
      system: DeployedSystem
    }) {
      const addresses = {
        ...mainnetAddresses,
        operationExecutor: system.OperationExecutor.contract.address,
      }
      const tokenAddresses: Record<AAVETokens, string> = {
        WETH: mainnetAddresses.WETH,
        ETH: mainnetAddresses.WETH,
        STETH: mainnetAddresses.STETH,
        WSTETH: mainnetAddresses.WSTETH,
        USDC: mainnetAddresses.USDC,
        WBTC: mainnetAddresses.WBTC,
      }

      const collateralTokenAddress = tokenAddresses[collateralToken.symbol as AAVETokens]
      const debtTokenAddress = tokenAddresses[debtToken.symbol as AAVETokens]
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
        ADDRESSES[Network.MAINNET].common.FeeRecipient,
        { config },
      )

      const provider = config.provider
      const signer = config.signer

      const pool = new Contract(
        ADDRESSES[Network.MAINNET].aave.v3.Pool,
        AAVELendingPoolABI,
        provider,
      )

      const aaveProtocolDataProvider = new Contract(
        ADDRESSES[Network.MAINNET].aave.v3.AavePoolDataProvider,
        AAVEDataProviderABI,
        provider,
      )

      const aaveOracle = new ethers.Contract(
        ADDRESSES[Network.MAINNET].aave.v3.AaveOracle,
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
          address: system.OperationExecutor.contract.address,
          calldata: system.OperationExecutor.contract.interface.encodeFunctionData('executeOp', [
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
        ADDRESSES[Network.MAINNET].common.FeeRecipient,
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
        fixture = await loadFixture(
          systemWithAaveV3Positions({
            use1inch: false,
            network: networkFork,
            systemConfigPath: `${networkFork}.conf.ts`,
          }),
        )
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
          expect.toBe(
            act.adjustedPosition.debt.amount.toString(),
            'gte',
            act.simulation.position.debt.amount.toString(),
          )
        })
        it('should collect fee', async () => {
          const actualFeesDelta = act.feeWalletBalanceAfterAdjust.minus(
            act.feeWalletBalanceBeforeAdjust,
          )

          expect.toBe(
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
              expect.toBe(
                act.adjustedPosition.debt.amount.toString(),
                'gte',
                act.simulation.position.debt.amount.toString(),
              )
            })
            it('should collect fee', async () => {
              const actualFeesDelta = act.feeWalletBalanceAfterAdjust.minus(
                act.feeWalletBalanceBeforeAdjust,
              )

              expect.toBe(
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
        fixture = await loadFixture(
          systemWithAaveV3Positions({
            use1inch: false,
            network: networkFork,
            systemConfigPath: `${networkFork}.conf.ts`,
          }),
        )
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
          expect.toBe(
            act.simulation.position.debt.amount.toString(),
            'gte',
            act.adjustedPosition.debt.amount.toString(),
          )
        })
        it('should collect fee', async () => {
          const actualFeesDelta = act.feeWalletBalanceAfterAdjust.minus(
            act.feeWalletBalanceBeforeAdjust,
          )

          expect.toBe(
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
              expect.toBe(
                act.simulation.position.debt.amount.toString(),
                'gte',
                act.adjustedPosition.debt.amount.toString(),
              )
            })
            it('should collect fee', async () => {
              const actualFeesDelta = act.feeWalletBalanceAfterAdjust.minus(
                act.feeWalletBalanceBeforeAdjust,
              )

              expect.toBe(
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
