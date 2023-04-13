import { expect } from '@oasisdex/dma-common/test-utils'
import { Network } from '@oasisdex/dma-common/utils/network'
import { PositionTransition } from '@oasisdex/dma-library/src'
import { IPosition } from '@oasisdex/domain'
import BigNumber from 'bignumber.js'
import { loadFixture } from 'ethereum-waffle'

import {
  getSupportedStrategies,
  SystemWithAavePositions,
  systemWithAavePositions,
} from '../../../fixtures'
import {
  getSupportedAaveV3Strategies,
  systemWithAaveV3Positions,
} from '../../../fixtures/system/system-with-aave-v3-positions'
import { SystemWithAAVEV3Positions } from '../../../fixtures/types/system-with-aave-positions'

const ciOnlyTests = process.env.RUN_ONLY_CI_TESTS === '1'
const networkFork = process.env.NETWORK_FORK as Network
const EXPECT_LARGER_SIMULATED_FEE = 'Expect simulated fee to be more than the user actual pays'

describe(`Strategy | AAVE | Open Position | E2E`, async function () {
  describe('Using AAVE V2', async function () {
    let fixture: SystemWithAavePositions

    const supportedStrategies = getSupportedStrategies(ciOnlyTests)

    describe.only('Open position: With Uniswap', function () {
      before(async function () {
        if (networkFork === Network.OPT_MAINNET) {
          this.skip()
        }
        fixture = await loadFixture(
          systemWithAavePositions({
            use1inch: false,
          }),
        )
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
    describe('Open position: With 1inch', function () {
      before(async function () {
        if (networkFork === Network.OPT_MAINNET) {
          this.skip()
        }
        fixture = await loadFixture(
          systemWithAavePositions({
            use1inch: true,
          }),
        )
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
    const supportedStrategies = getSupportedAaveV3Strategies()

    describe('Open position: With Uniswap', () => {
      before(async function () {
        fixture = await systemWithAaveV3Positions({
          use1inch: false,
          network: networkFork,
          systemConfigPath: `./test/${networkFork}.conf.ts`,
          configExtentionPaths: [`./test/uSwap.conf.ts`],
        })()
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
        fixture = await systemWithAaveV3Positions({
          use1inch: true,
          network: networkFork,
          systemConfigPath: `./test/${networkFork}.conf.ts`,
          configExtentionPaths: [`./test/swap.conf.ts`],
        })()
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
