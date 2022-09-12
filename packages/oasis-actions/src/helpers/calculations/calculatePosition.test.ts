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
      amountToSwapOrSwappedAmountToPayback,
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
        const dustLimit = new BigNumber(0)
        /* Note: we have to remove User deposits from current values because they've already been rolled up (assigned) in our googlesheets data*/
        const currentPosition = new Position(
          { amount: currentDebt.plus(debtDenominatedTokensDepositedByUser) },
          { amount: currentCollateral.minus(collateralDepositedByUser) },
          oraclePrice,
          { liquidationThreshold, maxLoanToValue, dustLimit },
        )

        const computed = currentPosition.adjustToTargetLTV(targetLoanToValue, {
          depositedByUser: {
            debt: debtDenominatedTokensDepositedByUser,
            collateral: collateralDepositedByUser,
          },
          maxLoanToValueFL: maxLoanToValueFL,
          fees: { flashLoan: flashloanFees, oazo: oazoFees, oazoFeeBase: new BigNumber(10000) },
          prices: {
            market: marketPrice,
            oracle: oraclePrice,
            oracleFLtoDebtToken: oraclePriceFLtoDebtToken,
          },
          slippage,
          // debug: true,
        })

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
        if (amountToSwapOrSwappedAmountToPayback.gte(ZERO)) {
          expect(computed.fee.toFixed(4)).to.equal(feePaidFromBaseToken.toFixed(4))
        } else {
          expect(computed.fee.toFixed(4)).to.equal(feePaidFromCollateralToken.toFixed(4))
        }
      })
    },
  )

  describe('min-configurable and max-configurable LTV', () => {
    it('sets the min-configurable LTV to zero if both the dust limit and current debt are zero', () => {
      const position = new Position(
        {
          amount: new BigNumber(0),
          denomination: 'nope',
        },
        {
          amount: new BigNumber(100),
          denomination: 'nope',
        },
        new BigNumber(1),
        {
          liquidationThreshold: new BigNumber('0.81'),
          maxLoanToValue: new BigNumber('0.69'),
          dustLimit: new BigNumber(0),
        },
      )

      expect(position.minimumConfigurableLTV.toFixed(2)).to.equal('0.00')
    })

    it('calculates the correct minimum configurable LTV based on dust limit, collateral, and collateral price', () => {
      const position = new Position(
        {
          amount: new BigNumber(10_000),
          denomination: 'nope',
        },
        {
          amount: new BigNumber(10),
          denomination: 'nope',
        },
        new BigNumber(3_000),
        {
          liquidationThreshold: new BigNumber('0.81'),
          maxLoanToValue: new BigNumber('0.69'),
          dustLimit: new BigNumber(15_000),
        },
      )

      expect(position.minimumConfigurableLTV.toFixed(2)).to.equal('0.50')
    })

    it('uses the current debt on the vault if set', () => {
      const position = new Position(
        {
          amount: new BigNumber(15_000),
          denomination: 'nope',
        },
        {
          amount: new BigNumber(10),
          denomination: 'nope',
        },
        new BigNumber(3_000),
        {
          liquidationThreshold: new BigNumber('0.81'),
          maxLoanToValue: new BigNumber('0.69'),
          dustLimit: new BigNumber(0),
        },
      )

      expect(position.minimumConfigurableLTV.toFixed(2)).to.equal('0.50')
    })
  })
})
