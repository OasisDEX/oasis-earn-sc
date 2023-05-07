import { expect, retrySetup } from '@dma-common/test-utils'
import { isOptimismByNetwork } from '@dma-common/utils/common'
import {
  getSupportedStrategies,
  SystemWithAavePositions,
  systemWithAavePositions,
} from '@dma-contracts/test/fixtures'
import {
  getSupportedAaveV3Strategies,
  systemWithAaveV3Positions,
} from '@dma-contracts/test/fixtures/system/system-with-aave-v3-positions'
import { SystemWithAAVEV3Positions } from '@dma-contracts/test/fixtures/types/system-with-aave-positions'
import { Network } from '@dma-deployments/types/network'
import { PositionTransition } from '@dma-library'
import { IPosition } from '@domain'
import BigNumber from 'bignumber.js'

const networkFork = process.env.NETWORK_FORK as Network
const EXPECT_LARGER_SIMULATED_FEE = 'Expect simulated fee to be more than the user actual pays'

describe(`Strategy | AAVE | Open Position | E2E`, async function () {
  describe('Using AAVE V2', async function () {
    let fixture: SystemWithAavePositions

    const supportedStrategies = getSupportedStrategies()

    describe('Open position: With Uniswap', function () {
      before(async function () {
        if (isOptimismByNetwork(networkFork)) {
          this.skip()
        }
        /*
         * Intermittently fails when creating the position with the following error
         * VM Exception while processing transaction: reverted with reason string '5'
         * That's why we use retrySetup to avoid flakiness
         */
        const _fixture = await retrySetup(
          systemWithAavePositions({
            use1inch: false,
            configExtensionPaths: [`test/uSwap.conf.ts`],
          }),
        )
        if (!_fixture) throw new Error('Failed to load fixture')
        fixture = _fixture
      })

      describe('Using DSProxy', function () {
        let position: IPosition
        let simulatedPosition: IPosition
        let simulatedTransition: PositionTransition['simulation']
        let feeWalletBalanceChange: BigNumber

        before(async function () {
          const { dsProxyPosition: dsProxyStEthEthEarnPositionDetails } = fixture

          position = await dsProxyStEthEthEarnPositionDetails.getPosition()
          simulatedPosition = dsProxyStEthEthEarnPositionDetails.__openPositionSimulation.position
          simulatedTransition = dsProxyStEthEthEarnPositionDetails.__openPositionSimulation
          feeWalletBalanceChange = dsProxyStEthEthEarnPositionDetails.__feeWalletBalanceChange
        })

        it('Should draw the correct amount of debt', async () => {
          expect.toBe(
            simulatedPosition.debt.amount.toFixed(0),
            'lte',
            position.debt.amount.toFixed(0),
          )
        })
        it('Should deposit all collateral', async () => {
          expect.toBe(
            simulatedPosition.collateral.amount,
            'lte',
            position.collateral.amount.toFixed(0),
          )
        })
        it('Should have the correct multiple', async () => {
          expect.toBe(position.riskRatio.multiple, 'lte', simulatedPosition.riskRatio.multiple)
        })
        it('Should collect fee', async () => {
          expect.toBeEqual(simulatedTransition.swap.tokenFee, feeWalletBalanceChange)
        })
      })
      describe('Using DPM Proxy', async function () {
        supportedStrategies.forEach(({ name: strategy }) => {
          let position: IPosition
          let simulatedPosition: IPosition
          let simulatedTransition: PositionTransition['simulation']
          let feeWalletBalanceChange: BigNumber

          before(async function () {
            const { dpmPositions } = fixture
            const positionDetails = dpmPositions[strategy]
            if (!positionDetails) {
              this.skip()
            }
            position = await positionDetails.getPosition()
            simulatedPosition = positionDetails.__openPositionSimulation.position
            simulatedTransition = positionDetails.__openPositionSimulation
            feeWalletBalanceChange = positionDetails.__feeWalletBalanceChange
          })

          it(`Should draw the correct amount of debt for ${strategy}`, async () => {
            expect.toBe(
              simulatedPosition.debt.amount.toFixed(0),
              'lte',
              position.debt.amount.toFixed(0),
            )
          })
          it(`Should deposit all collateral for ${strategy}`, async () => {
            expect.toBe(
              simulatedPosition.collateral.amount,
              'lte',
              position.collateral.amount.toFixed(0),
            )
          })
          it(`Should have the correct multiple for ${strategy}`, async () => {
            expect.toBe(position.riskRatio.multiple, 'lte', simulatedPosition.riskRatio.multiple)
          })
          it(`Should collect fee for ${strategy}`, async () => {
            expect.toBeEqual(simulatedTransition.swap.tokenFee, feeWalletBalanceChange)
          })
        })
      })
    })
    describe('Open position: With 1inch', function () {
      before(async function () {
        if (isOptimismByNetwork(networkFork)) {
          this.skip()
        }
        /*
         * Intermittently fails when creating the position with the following error
         * VM Exception while processing transaction: reverted with reason string '5'
         * That's why we use retrySetup to avoid flakiness
         */
        const _fixture = await retrySetup(
          systemWithAavePositions({
            use1inch: true,
            configExtensionPaths: [`test/swap.conf.ts`],
          }),
        )
        if (!_fixture) throw new Error('Failed to load fixture')
        fixture = _fixture
      })

      describe('Using DSProxy', () => {
        let position: IPosition
        let simulatedPosition: IPosition
        let simulatedTransition: PositionTransition['simulation']
        let feeWalletBalanceChange: BigNumber

        before(async () => {
          const { dsProxyPosition: dsProxyStEthEthEarnPositionDetails } = fixture

          position = await dsProxyStEthEthEarnPositionDetails.getPosition()
          simulatedPosition = dsProxyStEthEthEarnPositionDetails.__openPositionSimulation.position
          simulatedTransition = dsProxyStEthEthEarnPositionDetails.__openPositionSimulation
          feeWalletBalanceChange = dsProxyStEthEthEarnPositionDetails.__feeWalletBalanceChange
        })

        it('Should draw the correct amount of debt', async () => {
          expect.toBe(
            simulatedPosition.debt.amount.toFixed(0),
            'lte',
            position.debt.amount.toFixed(0),
          )
        })
        it('Should deposit all collateral', async () => {
          expect.toBe(
            simulatedPosition.collateral.amount,
            'lte',
            position.collateral.amount.toFixed(0),
          )
        })
        it('Should have the correct multiple', async () => {
          expect.toBe(position.riskRatio.multiple, 'lte', simulatedPosition.riskRatio.multiple)
        })
        it('Should collect fee', async () => {
          expect.toBeEqual(simulatedTransition.swap.tokenFee, feeWalletBalanceChange)
        })
      })
      describe('Using DPM Proxy', async () => {
        supportedStrategies.forEach(({ name: strategy }) => {
          let position: IPosition
          let simulatedPosition: IPosition
          let simulatedTransition: PositionTransition['simulation']
          let feeWalletBalanceChange: BigNumber

          before(async function () {
            const { dpmPositions } = fixture
            const positionDetails = dpmPositions[strategy]
            if (!positionDetails) {
              this.skip()
            }
            position = await positionDetails.getPosition()
            simulatedPosition = positionDetails.__openPositionSimulation.position
            simulatedTransition = positionDetails.__openPositionSimulation
            feeWalletBalanceChange = positionDetails.__feeWalletBalanceChange
          })

          it(`Should draw the correct amount of debt for ${strategy}`, async () => {
            expect.toBe(
              simulatedPosition.debt.amount.toFixed(0),
              'lte',
              position.debt.amount.toFixed(0),
            )
          })
          it(`Should deposit all collateral for ${strategy}`, async () => {
            expect.toBe(
              simulatedPosition.collateral.amount,
              'lte',
              position.collateral.amount.toFixed(0),
            )
          })
          it(`Should have the correct multiple for ${strategy}`, async () => {
            expect.toBe(position.riskRatio.multiple, 'lte', simulatedPosition.riskRatio.multiple)
          })
          it(`Should collect fee for ${strategy}`, async () => {
            expect.toBeEqual(simulatedTransition.swap.tokenFee, feeWalletBalanceChange)
          })
        })
      })
    })
  })
  describe('Using AAVE V3', async function () {
    let fixture: SystemWithAAVEV3Positions
    const supportedStrategies = getSupportedAaveV3Strategies(networkFork)

    describe('Open position: With Uniswap', function () {
      before(async function () {
        /*
         * Intermittently fails when creating the position with the following error
         * VM Exception while processing transaction: reverted with reason string '5'
         * That's why we use retrySetup to avoid flakiness
         */
        const _fixture = await retrySetup(
          systemWithAaveV3Positions({
            use1inch: false,
            network: networkFork,
            systemConfigPath: `test/${networkFork}.conf.ts`,
            configExtensionPaths: [`test/uSwap.conf.ts`],
          }),
        )
        if (!_fixture) throw new Error('Failed to load fixture')
        fixture = _fixture
      })

      describe('Using DSProxy', () => {
        let position: IPosition
        let simulatedPosition: IPosition
        let simulatedTransition: PositionTransition['simulation']
        let feeWalletBalanceChange: BigNumber

        before(async () => {
          const { dsProxyPosition: dsProxyEthUsdcMultiplyPositionDetails } = fixture

          position = await dsProxyEthUsdcMultiplyPositionDetails.getPosition()
          simulatedPosition =
            dsProxyEthUsdcMultiplyPositionDetails.__openPositionSimulation.position
          simulatedTransition = dsProxyEthUsdcMultiplyPositionDetails.__openPositionSimulation
          feeWalletBalanceChange = dsProxyEthUsdcMultiplyPositionDetails.__feeWalletBalanceChange
        })

        it('Should draw the correct amount of debt', async () => {
          expect.toBe(
            simulatedPosition.debt.amount.toFixed(0),
            'lte',
            position.debt.amount.toFixed(0),
          )
        })
        it('Should deposit all collateral', async () => {
          expect.toBe(
            simulatedPosition.collateral.amount,
            'lte',
            position.collateral.amount.toFixed(0),
          )
        })
        it('Should have the correct multiple', async () => {
          expect.toBe(position.riskRatio.multiple, 'lte', simulatedPosition.riskRatio.multiple)
        })
        it('Should collect fee', async () => {
          expect.toBe(
            simulatedTransition.swap.tokenFee,
            'gte',
            feeWalletBalanceChange,
            EXPECT_LARGER_SIMULATED_FEE,
          )
        })
      })
      describe('Using DPM Proxy', async () => {
        const insufficientLiquidityStrategies = ['WSTETH/ETH Earn']
        supportedStrategies
          .filter(({ name }) => !insufficientLiquidityStrategies.includes(name))
          .forEach(({ name: strategy }) => {
            let position: IPosition
            let simulatedPosition: IPosition
            let simulatedTransition: PositionTransition['simulation']
            let feeWalletBalanceChange: BigNumber

            before(async function () {
              const { dpmPositions } = fixture
              const positionDetails = dpmPositions[strategy]
              if (!positionDetails) {
                this.skip()
              }
              position = await positionDetails.getPosition()
              simulatedPosition = positionDetails.__openPositionSimulation.position
              simulatedTransition = positionDetails.__openPositionSimulation
              feeWalletBalanceChange = positionDetails.__feeWalletBalanceChange
            })

            it(`Should draw the correct amount of debt for ${strategy}`, async () => {
              expect.toBe(
                simulatedPosition.debt.amount.toFixed(0),
                'lte',
                position.debt.amount.toFixed(0),
              )
            })
            it(`Should deposit all collateral for ${strategy}`, async () => {
              expect.toBe(
                simulatedPosition.collateral.amount,
                'lte',
                position.collateral.amount.toFixed(0),
              )
            })
            it(`Should have the correct multiple for ${strategy}`, async () => {
              expect.toBe(position.riskRatio.multiple, 'lte', simulatedPosition.riskRatio.multiple)
            })
            it(`Should collect fee for ${strategy}`, async () => {
              expect.toBe(
                simulatedTransition.swap.tokenFee,
                'gte',
                feeWalletBalanceChange,
                EXPECT_LARGER_SIMULATED_FEE,
              )
            })
          })
      })
    })
    describe('Open position: With 1inch', () => {
      before(async () => {
        /*
         * Intermittently fails when creating the position with the following error
         * VM Exception while processing transaction: reverted with reason string '5'
         * That's why we use retrySetup to avoid flakiness
         */
        const _fixture = await retrySetup(
          systemWithAaveV3Positions({
            use1inch: true,
            network: networkFork,
            systemConfigPath: `test/${networkFork}.conf.ts`,
            configExtensionPaths: [`test/swap.conf.ts`],
          }),
        )
        if (!_fixture) throw new Error('Failed to load fixture')
        fixture = _fixture
      })

      describe('Using DSProxy', () => {
        let position: IPosition
        let simulatedPosition: IPosition
        let simulatedTransition: PositionTransition['simulation']
        let feeWalletBalanceChange: BigNumber

        before(async () => {
          const { dsProxyPosition: dsProxyEthUsdcMultiplyPositionDetails } = fixture

          position = await dsProxyEthUsdcMultiplyPositionDetails.getPosition()
          simulatedPosition =
            dsProxyEthUsdcMultiplyPositionDetails.__openPositionSimulation.position
          simulatedTransition = dsProxyEthUsdcMultiplyPositionDetails.__openPositionSimulation
          feeWalletBalanceChange = dsProxyEthUsdcMultiplyPositionDetails.__feeWalletBalanceChange
        })

        it('Should draw the correct amount of debt', async () => {
          expect.toBe(
            simulatedPosition.debt.amount.toFixed(0),
            'lte',
            position.debt.amount.toFixed(0),
          )
        })
        it('Should deposit all collateral', async () => {
          expect.toBe(
            simulatedPosition.collateral.amount,
            'lte',
            position.collateral.amount.toFixed(0),
          )
        })
        it('Should have the correct multiple', async () => {
          expect.toBe(position.riskRatio.multiple, 'lte', simulatedPosition.riskRatio.multiple)
        })
        it('Should collect fee', async () => {
          expect.toBe(
            simulatedTransition.swap.tokenFee,
            'gte',
            feeWalletBalanceChange,
            EXPECT_LARGER_SIMULATED_FEE,
          )
        })
      })
      describe('Using DPM Proxy', function () {
        supportedStrategies.forEach(({ name: strategy }) => {
          let position: IPosition
          let simulatedPosition: IPosition
          let simulatedTransition: PositionTransition['simulation']
          let feeWalletBalanceChange: BigNumber

          before(async function () {
            const { dpmPositions } = fixture
            const positionDetails = dpmPositions[strategy]
            if (!positionDetails) {
              this.skip()
            }
            position = await positionDetails.getPosition()
            simulatedPosition = positionDetails.__openPositionSimulation.position
            simulatedTransition = positionDetails.__openPositionSimulation
            feeWalletBalanceChange = positionDetails.__feeWalletBalanceChange
          })

          it(`Should draw the correct amount of debt for ${strategy}`, async () => {
            expect.toBe(
              simulatedPosition.debt.amount.toFixed(0),
              'lte',
              position.debt.amount.toFixed(0),
            )
          })
          it(`Should deposit all collateral for ${strategy}`, async () => {
            expect.toBe(
              simulatedPosition.collateral.amount,
              'lte',
              position.collateral.amount.toFixed(0),
            )
          })
          it(`Should have the correct multiple for ${strategy}`, async () => {
            expect.toBe(position.riskRatio.multiple, 'lte', simulatedPosition.riskRatio.multiple)
          })
          it(`Should collect fee for ${strategy}`, async () => {
            expect.toBe(
              simulatedTransition.swap.tokenFee,
              'gte',
              feeWalletBalanceChange,
              EXPECT_LARGER_SIMULATED_FEE,
            )
          })
        })
      })
    })
  })
})
