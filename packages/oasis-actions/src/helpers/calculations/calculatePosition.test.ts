import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { default as dotenv } from 'dotenv'
import path from 'path'
import process from 'process'

import { ZERO } from '../constants'
import { Position } from './calculatePosition'
import { mapRowsToScenarios, Scenario } from './testDataUtils'

dotenv.config({ path: path.join(process.cwd(), '../../.env') })

describe('Calculate Position Helper', async () => {
  const data: any[][] = (
    await import(
      path.join(process.cwd(), './packages/oasis-actions/src/helpers/calculations/scenarios.json')
    )
  ).default

  const scenarios = mapRowsToScenarios(data) as Scenario[]

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
      unknownX,
      fromTokenAmountInc,
      toTokenAmountInc,
      fromTokenAmountDec,
      toTokenAmountDec,
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
      feePaidFromBaseToken,
      feePaidFromCollateralToken,
    }) => {
      it(`Test: ${name}`, async () => {
        /* Note: we have to remove User deposits from current values because they've already been rolled up (assigned) in our googlesheets data*/
        const currentPosition = new Position(
          { amount: currentDebt.plus(debtDenominatedTokensDepositedByUser) },
          { amount: currentCollateral.minus(collateralDepositedByUser) },
          oraclePrice,
          { liquidationThreshold, maxLoanToValue },
        )

        const oazoFeeBase = new BigNumber(10000)
        const computed = currentPosition.adjustToTargetLTV(targetLoanToValue, {
          depositedByUser: {
            debt: debtDenominatedTokensDepositedByUser,
            collateral: collateralDepositedByUser,
          },
          maxLoanToValueFL: maxLoanToValueFL,
          fees: { flashLoan: flashloanFees, oazo: oazoFees.times(oazoFeeBase) },
          prices: {
            market: marketPrice,
            oracle: oraclePrice,
            oracleFLtoDebtToken: oraclePriceFLtoDebtToken,
          },
          slippage,
          // debug: true,
        })

        const actualFromTokenAmount = computed.isMultipleIncrease
          ? fromTokenAmountInc
          : fromTokenAmountDec
        const actualToTokenAmount = computed.isMultipleIncrease
          ? toTokenAmountInc
          : toTokenAmountDec

        // From Token Swap Amount
        expect(computed.fromTokenAmount.toFixed(2)).to.equal(actualFromTokenAmount.toFixed(2))

        // To Token Swapped Amount
        expect(computed.toTokenAmount.toFixed(2)).to.equal(actualToTokenAmount.toFixed(2))

        // Debt Delta
        expect(computed.debtDelta.toFixed(2)).to.equal(debtDelta.toFixed(2))

        // Collateral Delta
        expect(computed.collateralDelta.toFixed(2)).to.equal(collateralDelta.toFixed(2))

        // Is Flashloan needed?
        expect(computed.isFlashloanRequired).to.equal(isFlashLoanRequired)

        // Flashloan Amount
        expect(computed.flashloanAmount.toFixed(0)).to.equal(amountToFlashloan.toFixed(0))

        // Target Debt
        expect(computed.targetPosition.debt.amount.toFixed(2)).to.equal(targetDebt.toFixed(2))

        // Target Collateral
        expect(computed.targetPosition.collateral.amount.toFixed(2)).to.equal(
          targetCollateral.toFixed(2),
        )

        // Health Factor
        expect(computed.targetPosition.healthFactor.toFixed(2)).to.equal(healthFactor.toFixed(2))

        // Liquidation Price
        expect(computed.targetPosition.liquidationPrice.toFixed(2)).to.equal(
          minOraclePrice.toFixed(2),
        )

        // Fee Paid
        if (computed.isMultipleIncrease) {
          expect(computed.fee.toFixed(4)).to.equal(feePaidFromBaseToken.toFixed(4))
        } else {
          expect(computed.fee.toFixed(4)).to.equal(feePaidFromCollateralToken.toFixed(4))
        }
      })
    },
  )
})
