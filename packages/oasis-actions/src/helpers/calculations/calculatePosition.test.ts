import { expect } from 'chai'
import { default as dotenv } from 'dotenv'
import path from 'path'
import process from 'process'

import { calculateTargetPosition, Position } from './calculatePosition'
import { mapRowsToScenarios, Scenario } from './generateScenarios'

dotenv.config({ path: path.join(process.cwd(), '../../.env') })

describe('Calculate Position Helper', async () => {
  const data: any[][] = (
    await import(
      path.join(process.cwd(), './packages/oasis-actions/src/helpers/calculations/scenarios.json')
    )
  ).default

  const scenarios: Scenario[] = mapRowsToScenarios(data)

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
      it(`Test: ${name}`, async () => {
        /* Note: we have to remove seed/topups from current values because they've already been rolled up/assigned in googlesheets */
        const currentPosition = new Position(
          currentDebt.plus(debtAddedByUser),
          currentCollateral.minus(collateralAddedByUser),
          oraclePrice,
          { liquidationRatio },
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
      })
    },
  )
})
