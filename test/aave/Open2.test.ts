import { IPosition, IPositionTransition } from '@oasisdex/oasis-actions/src'
import BigNumber from 'bignumber.js'
import { loadFixture } from 'ethereum-waffle'

import { RuntimeConfig } from '../../helpers/types/common'
import {
  getSupportedStrategies,
  getSystemWithAAVEPositions,
  SystemWithAAVEPositions,
} from '../fixtures'
import { expectToBe, expectToBeEqual } from '../utils'

describe(`Strategy | AAVE | Open Position`, async function () {
  let fixture: SystemWithAAVEPositions
  const supportedStrategies = getSupportedStrategies()

  describe('Open position: With Uniswap', () => {
    before(async () => {
      fixture = await loadFixture(getSystemWithAAVEPositions({ use1inch: false }))
    })

    describe('Using DSProxy', () => {
      let position: IPosition
      let simulatedPosition: IPosition
      let simulatedTransition: IPositionTransition['simulation']
      let feeWalletBalanceChange: BigNumber
      let config: RuntimeConfig

      before(async () => {
        const { dsProxyPosition: dsProxyStEthEthEarnPositionDetails, config: _config } = fixture

        position = await dsProxyStEthEthEarnPositionDetails.getPosition()
        simulatedPosition = dsProxyStEthEthEarnPositionDetails.__openPositionSimulation.position
        simulatedTransition = dsProxyStEthEthEarnPositionDetails.__openPositionSimulation
        feeWalletBalanceChange = dsProxyStEthEthEarnPositionDetails.__feeWalletBalanceChange
        config = _config
      })

      it('Should draw the correct amount of debt', async () => {
        expectToBe(simulatedPosition.debt.amount.toFixed(0), 'lte', position.debt.amount.toFixed(0))
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
        let config: RuntimeConfig

        before(async function () {
          const { dpmPositions, config: _config } = fixture
          const positionDetails = dpmPositions[strategy]
          if (!positionDetails) {
            this.skip()
          }
          position = await positionDetails.getPosition()
          simulatedPosition = positionDetails.__openPositionSimulation.position
          simulatedTransition = positionDetails.__openPositionSimulation
          feeWalletBalanceChange = positionDetails.__feeWalletBalanceChange
          config = _config
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
      fixture = await loadFixture(getSystemWithAAVEPositions({ use1inch: true }))
    })

    describe('Using DSProxy', () => {
      let position: IPosition
      let simulatedPosition: IPosition
      let simulatedTransition: IPositionTransition['simulation']
      let feeWalletBalanceChange: BigNumber
      let config: RuntimeConfig

      before(async () => {
        const { dsProxyPosition: dsProxyStEthEthEarnPositionDetails, config: _config } = fixture
        position = await dsProxyStEthEthEarnPositionDetails.getPosition()
        simulatedPosition = dsProxyStEthEthEarnPositionDetails.__openPositionSimulation.position
        simulatedTransition = dsProxyStEthEthEarnPositionDetails.__openPositionSimulation
        feeWalletBalanceChange = dsProxyStEthEthEarnPositionDetails.__feeWalletBalanceChange
        config = _config
      })

      it('Should draw the correct amount of debt', async () => {
        expectToBe(simulatedPosition.debt.amount.toFixed(0), 'lte', position.debt.amount.toFixed(0))
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
        let config: RuntimeConfig

        before(async function () {
          const { dpmPositions, config: _config } = fixture
          const positionDetails = dpmPositions[strategy]
          if (!positionDetails) {
            this.skip()
          }
          position = await positionDetails.getPosition()
          simulatedPosition = positionDetails.__openPositionSimulation.position
          simulatedTransition = positionDetails.__openPositionSimulation
          feeWalletBalanceChange = positionDetails.__feeWalletBalanceChange
          config = _config
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
