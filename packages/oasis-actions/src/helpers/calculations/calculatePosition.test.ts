import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { default as dotenv } from 'dotenv'
import path from 'path'
import process from 'process'

import { Position, RiskRatio } from './calculatePosition'
import { testDataSources } from './test-scenarios/scenarioDataSources'
import { fetchTestScenarios } from './testDataUtils'

dotenv.config({ path: path.join(process.cwd(), '../../.env') })

type Scenario = {
  name: string
  type: 'Open' | 'Increase multiple' | 'Decrease multiple'
  protocol: 'Maker' | 'AAVE'
  collateralDepositedByUser: BigNumber
  debtDenominatedTokensDepositedByUser: BigNumber
  targetLoanToValue: BigNumber
  currentCollateral: BigNumber
  currentDebt: BigNumber
  oraclePrice: BigNumber
  oraclePriceFLtoDebtToken: BigNumber
  marketPrice: BigNumber
  slippage: BigNumber
  marketPriceAdjustedForSlippage: BigNumber
  oazoFees: BigNumber
  flashloanFees: BigNumber
  liquidationThreshold: BigNumber
  liquidationThresholdFL: BigNumber
  maxLoanToValue: BigNumber
  maxLoanToValueFL: BigNumber
  unknownX: BigNumber
  fromTokenAmountInc: BigNumber
  toTokenAmountInc: BigNumber
  fromTokenAmountDec: BigNumber
  toTokenAmountDec: BigNumber
  Y: BigNumber
  isFlashLoanRequired: boolean
  debtDelta: BigNumber
  collateralDelta: BigNumber
  multiple: BigNumber
  amountToFlashloan: BigNumber
  targetCollateral: BigNumber
  targetDebt: BigNumber
  healthFactor: BigNumber
  minOraclePrice: BigNumber
  feePaidFromBaseToken: BigNumber
  feePaidFromCollateralToken: BigNumber
}

describe('Calculate Position Helper', async () => {
  describe('LTV_target', async () => {
    const scenarios = (await fetchTestScenarios<Scenario>(testDataSources.LTV_target)) as Scenario[]
    // console.log(scenarios)
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
          const riskRatio = new RiskRatio(targetLoanToValue, RiskRatio.TYPE.LTV)
          const dustLimit = new BigNumber(0)
          /* Note: we have to remove User deposits from current values because they've already been rolled up (assigned) in our googlesheets data*/
          const currentPosition = new Position(
            { amount: currentDebt.plus(debtDenominatedTokensDepositedByUser) },
            { amount: currentCollateral.minus(collateralDepositedByUser) },
            oraclePrice,
            { liquidationThreshold, maxLoanToValue, dustLimit },
          )

          const oazoFeeBase = new BigNumber(10000)
          const computed = currentPosition.adjustToTargetRiskRatio(riskRatio, {
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
  describe('LTV_min', async () => {
    type Scenario = {
      name: string
      dustLimit: BigNumber
      currentCollateral: BigNumber
      currentDebt: BigNumber
      oraclePrice: BigNumber
      marketPrice: BigNumber
      slippage: BigNumber
      ltvMin: BigNumber
    }

    const scenarios: Scenario[] = await fetchTestScenarios<Scenario>(testDataSources.LTV_min)

    scenarios.forEach(scenario => {
      // // console.log(scenario)
      // if (scenario.name !== 'Example 2') {
      //   return
      // }
      it(`Test LTV_min ${scenario.name}`, () => {
        const position = new Position(
          {
            amount: scenario.currentDebt,
            denomination: 'nope',
          },
          {
            amount: scenario.currentCollateral,
            denomination: 'nope',
          },
          scenario.oraclePrice,
          {
            liquidationThreshold: new BigNumber('0.81'),
            maxLoanToValue: new BigNumber('0.69'),
            dustLimit: scenario.dustLimit,
          },
        )

        expect(
          position
            .minConfigurableRiskRatio({
              slippage: scenario.slippage,
              marketPrice: scenario.marketPrice,
              oraclePrice: scenario.oraclePrice,
            })
            .loanToValue.toFixed(4),
        ).to.equal(scenario.ltvMin.toFixed(4))
      })
    })
  })

  // it('sets the min-configurable LTV to zero if both the dust limit and current debt are zero', () => {
  //   const position = new Position(
  //     {
  //       amount: new BigNumber(0),
  //       denomination: 'nope',
  //     },
  //     {
  //       amount: new BigNumber(100),
  //       denomination: 'nope',
  //     },
  //     new BigNumber(1),
  //     {
  //       liquidationThreshold: new BigNumber('0.81'),
  //       maxLoanToValue: new BigNumber('0.69'),
  //       dustLimit: new BigNumber(0),
  //     },
  //   )
  //
  //   expect(position.minConfigurableRiskRatio(params).loanToValue.toFixed(2)).to.equal('0.00')
  // })
  //
  // it('calculates the correct minimum configurable LTV based on dust limit, collateral, and collateral price', () => {
  //   const position = new Position(
  //     {
  //       amount: new BigNumber(10_000),
  //       denomination: 'nope',
  //     },
  //     {
  //       amount: new BigNumber(10),
  //       denomination: 'nope',
  //     },
  //     new BigNumber(3_000),
  //     {
  //       liquidationThreshold: new BigNumber('0.81'),
  //       maxLoanToValue: new BigNumber('0.69'),
  //       dustLimit: new BigNumber(15_000),
  //     },
  //   )
  //
  //   expect(position.minConfigurableRiskRatio(params).loanToValue.toFixed(2)).to.equal('0.50')
  // })
  //
  // it('uses the current debt on the vault if set', () => {
  //   const position = new Position(
  //     {
  //       amount: new BigNumber(15_000),
  //       denomination: 'nope',
  //     },
  //     {
  //       amount: new BigNumber(10),
  //       denomination: 'nope',
  //     },
  //     new BigNumber(3_000),
  //     {
  //       liquidationThreshold: new BigNumber('0.81'),
  //       maxLoanToValue: new BigNumber('0.69'),
  //       dustLimit: new BigNumber(0),
  //     },
  //   )
  //
  //   expect(position.minConfigurableRiskRatio(params).loanToValue.toFixed(2)).to.equal('0.50')
  // })

  // describe('RiskRatio', () => {
  //   type RiskRatioScenario = {
  //     name: string
  //     input: BigNumber
  //     type
  //   }
  //   const scenarios: RiskRatioScenario[] = [
  // })
})
