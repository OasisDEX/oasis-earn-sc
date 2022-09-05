import { expect } from 'chai'

import { calculateTargetPosition, Position } from './calculatePosition'
import { Scenario, testScenarios } from './testScenarios'

describe('Calculate Position Helper', () => {
  let scenarios: Scenario[] | undefined
  before(async function () {
    scenarios = await testScenarios()
  })

  it('should mirror calculations for imported scenarios', async () => {
    if (scenarios) {
      scenarios.forEach(
        ({
          name,
          type,
          collateralAddedByUser,
          debtAddedByUser,
          collateralDelta,
          debtDelta,
          targetCollateralRatio,
          currentCollateral,
          currentDebt,
          liquidationRatio,
          multiple,
          isFlashLoanRequired,
          marketPriceAdjustedForSlippage,
          marketPrice,
          slippage,
          oraclePrice,
          oazoFees,
          flashloanFees,
          targetDebt,
          targetCollateral,
        }) => {
          /* Note: we have to remove seed/topups from current values because they've already been rolled up/assigned in googlesheets */
          const currentPosition = new Position(
            currentDebt.minus(debtAddedByUser),
            currentCollateral.minus(collateralAddedByUser),
            oraclePrice,
            liquidationRatio,
          )

          const calculatedPositionInfo = calculateTargetPosition({
            addedByUser: {
              debt: debtAddedByUser,
              collateral: collateralAddedByUser,
            },
            currentPosition: currentPosition,
            targetCollateralRatio,
            fees: { flashLoan: flashloanFees, oazo: oazoFees },
            prices: { market: marketPrice, oracle: oraclePrice },
            slippage,
            debug: true,
          })

          expect(calculatedPositionInfo.debtDelta.toFixed(2)).to.equal(debtDelta.toFixed(2))
          expect(calculatedPositionInfo.collateralDelta.toFixed(2)).to.equal(
            collateralDelta.toFixed(2),
          )
          expect(calculatedPositionInfo.isFlashloanRequired).to.equal(isFlashLoanRequired)
          expect(calculatedPositionInfo.targetPosition.debt.toFixed(2)).to.equal(
            targetDebt.toFixed(2),
          )
          expect(calculatedPositionInfo.targetPosition.collateral.toFixed(2)).to.equal(
            targetCollateral.toFixed(2),
          )
        },
      )
    } else {
      expect.fail(null, null, 'No imported scenarios available')
    }
  })
})
