import { Network } from '@helpers/network'
import { IPosition, IPositionTransition } from '@oasisdex/oasis-actions/src'
import BigNumber from 'bignumber.js'
import { loadFixture } from 'ethereum-waffle'

import {
  getSupportedStrategies,
  getSystemWithAavePositions,
  SystemWithAAVEPositions,
} from '../../../fixtures'
import {
  getSupportedAaveV3Strategies,
  getSystemWithAaveV3Positions,
} from '../../../fixtures/system/getSystemWithAaveV3Positions'
import { SystemWithAAVEV3Positions } from '../../../fixtures/types/systemWithAAVEPositions'
import { expectToBe, expectToBeEqual } from '../../../utils'

const ciOnlyTests = process.env.RUN_ONLY_CI_TESTS === '1'
const networkFork = process.env.NETWORK_FORK as Network
const EXPECT_LARGER_SIMULATED_FEE = 'Expect simulated fee to be more than the user actual pays'

describe(`Strategy | AAVE | Open Position`, async function () {
  describe('Using AAVE V2', async function () {
    let fixture: SystemWithAAVEPositions

    const supportedStrategies = getSupportedStrategies(ciOnlyTests)

    describe('Open position: With Uniswap', function () {
      before(async function () {
        if (networkFork === Network.OPT_MAINNET) {
          this.skip()
        }
        fixture = await loadFixture(
          getSystemWithAavePositions({
            use1inch: false,
          }),
        )
      })

      describe('Using DSProxy', () => {
        let position: IPosition
        let simulatedPosition: IPosition
        let simulatedTransition: IPositionTransition['simulation']
        let feeWalletBalanceChange: BigNumber

        before(async () => {
          const { dsProxyPosition: dsProxyStEthEthEarnPositionDetails } = fixture

          position = await dsProxyStEthEthEarnPositionDetails.getPosition()
          simulatedPosition = dsProxyStEthEthEarnPositionDetails.__openPositionSimulation.position
          simulatedTransition = dsProxyStEthEthEarnPositionDetails.__openPositionSimulation
          feeWalletBalanceChange = dsProxyStEthEthEarnPositionDetails.__feeWalletBalanceChange
        })

        it('Should draw the correct amount of debt', async () => {
          expectToBe(
            simulatedPosition.debt.amount.toFixed(0),
            'lte',
            position.debt.amount.toFixed(0),
          )
        })
        it('Should deposit all collateral', async () => {
          expectToBe(
            simulatedPosition.collateral.amount,
            'lte',
            position.collateral.amount.toFixed(0),
          )
        })
        it('Should have the correct multiple', async () => {
          expectToBe(position.riskRatio.multiple, 'lte', simulatedPosition.riskRatio.multiple)
        })
        it('Should collect fee', async () => {
          expectToBeEqual(simulatedTransition.swap.tokenFee, feeWalletBalanceChange)
        })
      })
      describe('Using DPM Proxy', async () => {
        supportedStrategies.forEach(({ name: strategy }) => {
          let position: IPosition
          let simulatedPosition: IPosition
          let simulatedTransition: IPositionTransition['simulation']
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
            expectToBe(
              simulatedPosition.debt.amount.toFixed(0),
              'lte',
              position.debt.amount.toFixed(0),
            )
          })
          it(`Should deposit all collateral for ${strategy}`, async () => {
            expectToBe(
              simulatedPosition.collateral.amount,
              'lte',
              position.collateral.amount.toFixed(0),
            )
          })
          it(`Should have the correct multiple for ${strategy}`, async () => {
            expectToBe(position.riskRatio.multiple, 'lte', simulatedPosition.riskRatio.multiple)
          })
          it(`Should collect fee for ${strategy}`, async () => {
            expectToBeEqual(simulatedTransition.swap.tokenFee, feeWalletBalanceChange)
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
          getSystemWithAavePositions({
            use1inch: true,
          }),
        )
      })

      describe('Using DSProxy', () => {
        let position: IPosition
        let simulatedPosition: IPosition
        let simulatedTransition: IPositionTransition['simulation']
        let feeWalletBalanceChange: BigNumber

        before(async () => {
          const { dsProxyPosition: dsProxyStEthEthEarnPositionDetails } = fixture

          position = await dsProxyStEthEthEarnPositionDetails.getPosition()
          simulatedPosition = dsProxyStEthEthEarnPositionDetails.__openPositionSimulation.position
          simulatedTransition = dsProxyStEthEthEarnPositionDetails.__openPositionSimulation
          feeWalletBalanceChange = dsProxyStEthEthEarnPositionDetails.__feeWalletBalanceChange
        })

        it('Should draw the correct amount of debt', async () => {
          expectToBe(
            simulatedPosition.debt.amount.toFixed(0),
            'lte',
            position.debt.amount.toFixed(0),
          )
        })
        it('Should deposit all collateral', async () => {
          expectToBe(
            simulatedPosition.collateral.amount,
            'lte',
            position.collateral.amount.toFixed(0),
          )
        })
        it('Should have the correct multiple', async () => {
          expectToBe(position.riskRatio.multiple, 'lte', simulatedPosition.riskRatio.multiple)
        })
        it('Should collect fee', async () => {
          expectToBeEqual(simulatedTransition.swap.tokenFee, feeWalletBalanceChange)
        })
      })
      describe('Using DPM Proxy', async () => {
        supportedStrategies.forEach(({ name: strategy }) => {
          let position: IPosition
          let simulatedPosition: IPosition
          let simulatedTransition: IPositionTransition['simulation']
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
            expectToBe(
              simulatedPosition.debt.amount.toFixed(0),
              'lte',
              position.debt.amount.toFixed(0),
            )
          })
          it(`Should deposit all collateral for ${strategy}`, async () => {
            expectToBe(
              simulatedPosition.collateral.amount,
              'lte',
              position.collateral.amount.toFixed(0),
            )
          })
          it(`Should have the correct multiple for ${strategy}`, async () => {
            expectToBe(position.riskRatio.multiple, 'lte', simulatedPosition.riskRatio.multiple)
          })
          it(`Should collect fee for ${strategy}`, async () => {
            expectToBeEqual(simulatedTransition.swap.tokenFee, feeWalletBalanceChange)
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
        fixture = await getSystemWithAaveV3Positions({
          use1inch: false,
          network: networkFork,
          systemConfigPath: `./test-configs/${networkFork}.conf.ts`,
          configExtentionPaths: [`./test-configs/uSwap.conf.ts`],
        })()
      })

      describe('Using DSProxy', () => {
        let position: IPosition
        let simulatedPosition: IPosition
        let simulatedTransition: IPositionTransition['simulation']
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
          expectToBe(
            simulatedPosition.debt.amount.toFixed(0),
            'lte',
            position.debt.amount.toFixed(0),
          )
        })
        it('Should deposit all collateral', async () => {
          expectToBe(
            simulatedPosition.collateral.amount,
            'lte',
            position.collateral.amount.toFixed(0),
          )
        })
        it('Should have the correct multiple', async () => {
          expectToBe(position.riskRatio.multiple, 'lte', simulatedPosition.riskRatio.multiple)
        })
        it('Should collect fee', async () => {
          expectToBe(
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
            let simulatedTransition: IPositionTransition['simulation']
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
              expectToBe(
                simulatedPosition.debt.amount.toFixed(0),
                'lte',
                position.debt.amount.toFixed(0),
              )
            })
            it(`Should deposit all collateral for ${strategy}`, async () => {
              expectToBe(
                simulatedPosition.collateral.amount,
                'lte',
                position.collateral.amount.toFixed(0),
              )
            })
            it(`Should have the correct multiple for ${strategy}`, async () => {
              expectToBe(position.riskRatio.multiple, 'lte', simulatedPosition.riskRatio.multiple)
            })
            it(`Should collect fee for ${strategy}`, async () => {
              expectToBe(
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
        fixture = await getSystemWithAaveV3Positions({
          use1inch: true,
          network: networkFork,
          systemConfigPath: `./test-configs/${networkFork}.conf.ts`,
          configExtentionPaths: [`./test-configs/swap.conf.ts`],
        })()
      })

      describe('Using DSProxy', () => {
        let position: IPosition
        let simulatedPosition: IPosition
        let simulatedTransition: IPositionTransition['simulation']
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
          expectToBe(
            simulatedPosition.debt.amount.toFixed(0),
            'lte',
            position.debt.amount.toFixed(0),
          )
        })
        it('Should deposit all collateral', async () => {
          expectToBe(
            simulatedPosition.collateral.amount,
            'lte',
            position.collateral.amount.toFixed(0),
          )
        })
        it('Should have the correct multiple', async () => {
          expectToBe(position.riskRatio.multiple, 'lte', simulatedPosition.riskRatio.multiple)
        })
        it('Should collect fee', async () => {
          expectToBe(
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
          let simulatedTransition: IPositionTransition['simulation']
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
            expectToBe(
              simulatedPosition.debt.amount.toFixed(0),
              'lte',
              position.debt.amount.toFixed(0),
            )
          })
          it(`Should deposit all collateral for ${strategy}`, async () => {
            expectToBe(
              simulatedPosition.collateral.amount,
              'lte',
              position.collateral.amount.toFixed(0),
            )
          })
          it(`Should have the correct multiple for ${strategy}`, async () => {
            expectToBe(position.riskRatio.multiple, 'lte', simulatedPosition.riskRatio.multiple)
          })
          it(`Should collect fee for ${strategy}`, async () => {
            expectToBe(
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
