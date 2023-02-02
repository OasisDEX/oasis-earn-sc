import { IPosition, IPositionTransition } from '@oasisdex/oasis-actions/src'
import BigNumber from 'bignumber.js'
import { loadFixture } from 'ethereum-waffle'

import {
  getSupportedStrategies,
  getSystemWithAavePositions,
  SystemWithAAVEPositions,
} from '../fixtures'
import {
  getSupportedAaveV3Strategies,
  getSystemWithAaveV3Positions,
} from '../fixtures/system/getSystemWithAaveV3Positions'
import { SystemWithAAVEV3Positions } from '../fixtures/types/systemWithAAVEPositions'
import { expectToBe, expectToBeEqual } from '../utils'

describe(`Strategy | AAVE | Open Position`, async function () {
  describe.skip('Using AAVE V2', async function () {
    let fixture: SystemWithAAVEPositions
    const supportedStrategies = getSupportedStrategies()

    describe('Open position: With Uniswap', () => {
      before(async () => {
        fixture = await loadFixture(getSystemWithAavePositions({ use1inch: false }))
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
        supportedStrategies.forEach(strategy => {
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
    describe('Open position: With 1inch', () => {
      before(async () => {
        fixture = await loadFixture(getSystemWithAavePositions({ use1inch: true }))
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
        supportedStrategies.forEach(strategy => {
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

    describe.skip('Open position: With Uniswap', () => {
      before(async () => {
        fixture = await loadFixture(getSystemWithAaveV3Positions({ use1inch: false }))
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
          expectToBeEqual(simulatedTransition.swap.tokenFee, feeWalletBalanceChange)
        })
      })
      describe('Using DPM Proxy', async () => {
        supportedStrategies.forEach(strategy => {
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
    describe('Open position: With 1inch', () => {
      before(async () => {
        fixture = await loadFixture(getSystemWithAaveV3Positions({ use1inch: true }))
      })

      describe.skip('Using DSProxy', () => {
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
          expectToBeEqual(simulatedTransition.swap.tokenFee, feeWalletBalanceChange)
        })
      })
      describe('Using DPM Proxy', async () => {
        supportedStrategies.forEach(strategy => {
          console.log('strategy', strategy)
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
            console.log(
              'positionDetails.__feeWalletBalanceChange',
              positionDetails.__feeWalletBalanceChange.toString(),
            )
            feeWalletBalanceChange = positionDetails.__feeWalletBalanceChange
          })

          it(`Should draw the correct amount of debt for ${strategy}`, async () => {
            console.log(
              'simulatedPosition.debt.amount.toFixed(0)',
              simulatedPosition.debt.amount.toFixed(0),
            )
            console.log('position.debt.amount.toFixed(0)', position.debt.amount.toFixed(0))

            expectToBe(
              simulatedPosition.debt.amount.toFixed(0),
              'lte',
              position.debt.amount.toFixed(0),
            )
          })
          it(`Should deposit all collateral for ${strategy}`, async () => {
            console.log(
              'simulatedPosition.collateral.amount.toFixed(0)',
              simulatedPosition.collateral.amount.toFixed(0),
            )
            console.log(
              'position.collateral.amount.toFixed(0)',
              position.collateral.amount.toFixed(0),
            )

            expectToBe(
              simulatedPosition.collateral.amount,
              'lte',
              position.collateral.amount.toFixed(0),
            )
          })
          it(`Should have the correct multiple for ${strategy}`, async () => {
            console.log('TEST')
            console.log('position.riskRatio.multiple', position.riskRatio.multiple.toString())
            console.log(
              'simulatedPosition.riskRatio.multiple',
              simulatedPosition.riskRatio.multiple.toString(),
            )

            expectToBe(position.riskRatio.multiple, 'lte', simulatedPosition.riskRatio.multiple)
          })
          it(`Should collect fee for ${strategy}`, async () => {
            expectToBeEqual(simulatedTransition.swap.tokenFee, feeWalletBalanceChange)
          })
        })
      })
    })
  })
})
