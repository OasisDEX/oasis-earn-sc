import { expect } from 'chai'
import { default as dotenv } from 'dotenv'
import path from 'path'
import process from 'process'

import { calculateTargetPosition, Position } from './calculatePosition'
import { mapRowsToScenarios, Scenario } from './testDataUtils'

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
      collateralDepositedByUser,
      debtDenominatedTokensDepositedByUser,
      targetLoanToValue,
      currentCollateral,
      currentDebt,
      oraclePrice,
      oraclePriceFLtoDebtToken,
      marketPrice,
      slippage,
      marketPriceAdjustedForSlippage,
      oazoFees,
      flashloanFees,
      liquidationThreshold,
      maxLoanToValue,
      maxLoanToValueFL,
      X,
      Y,
      isFlashLoanRequired,
      debtDelta,
      collateralDelta,
      multiple,
      amountToFlashloan,
      targetDebt,
      targetCollateral,
      healthFactor,
      minOraclePrice,
    }) => {
      it(`Test: ${name}`, async () => {
        /* Note: we have to remove User deposits from current values because they've already been rolled up (assigned) in our googlesheets data*/
        const currentPosition = new Position(
          { amount: currentDebt.plus(debtDenominatedTokensDepositedByUser) },
          { amount: currentCollateral.minus(collateralDepositedByUser) },
          oraclePrice,
          { liquidationThreshold, maxLoanToValue },
        )

        const calculatedPositionInfo = calculateTargetPosition({
          depositedByUser: {
            debt: debtDenominatedTokensDepositedByUser,
            collateral: collateralDepositedByUser,
          },
          currentPosition: currentPosition,
          targetLoanToValue,
          maxLoanToValueFL: maxLoanToValueFL,
          fees: { flashLoan: flashloanFees, oazo: oazoFees },
          prices: {
            market: marketPrice,
            oracle: oraclePrice,
            oracleFLtoDebtToken: oraclePriceFLtoDebtToken,
          },
          slippage,
          // debug: true,
        })

        // Debt Delta
        expect(calculatedPositionInfo.debtDelta.toFixed(2)).to.equal(debtDelta.toFixed(2))

        // Collateral Delta
        expect(calculatedPositionInfo.collateralDelta.toFixed(2)).to.equal(
          collateralDelta.toFixed(2),
        )

        // Is Flashloan needed?
        expect(calculatedPositionInfo.isFlashloanRequired).to.equal(isFlashLoanRequired)

        // Flashloan Amount
        expect(calculatedPositionInfo.flashloanAmount.toFixed(2)).to.equal(
          amountToFlashloan.toFixed(2),
        )

        // Target Debt
        expect(calculatedPositionInfo.targetPosition.debt.amount.toFixed(2)).to.equal(
          targetDebt.toFixed(2),
        )

        // Target Collateral
        expect(calculatedPositionInfo.targetPosition.collateral.amount.toFixed(2)).to.equal(
          targetCollateral.toFixed(2),
        )

        // Health Factor
        expect(calculatedPositionInfo.targetPosition.healthFactor.toFixed(2)).to.equal(
          healthFactor.toFixed(2),
        )

        // Liquidation Price
        expect(calculatedPositionInfo.targetPosition.liquidationPrice.toFixed(2)).to.equal(
          minOraclePrice.toFixed(2),
        )
      })
    },
  )
})
