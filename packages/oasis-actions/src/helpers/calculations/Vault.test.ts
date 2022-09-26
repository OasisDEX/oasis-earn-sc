import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import * as dotenv from 'dotenv'
import path from 'path'
import process from 'process'

import { ONE } from '../constants'
import { RiskRatio } from './RiskRatio'
import { testDataSources } from './test-scenarios/generateTestData'
import { fetchTestScenarios } from './testDataUtils'
import { Vault } from './Vault'

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

describe('Calculate Vault Helper', async () => {
  describe('LTV_target', async () => {
    const scenarios = (await fetchTestScenarios<Scenario>(testDataSources.LTV_target)) as Scenario[]
    // console.log(scenarios)
    scenarios.forEach(
      ({
        name,
        collateralDepositedByUser,
        debtDenominatedTokensDepositedByUser,
        targetLoanToValue,
        currentCollateral,
        currentDebt,
        oraclePrice,
        oraclePriceFLtoDebtToken,
        marketPrice,
        slippage,
        oazoFees,
        flashloanFees,
        liquidationThreshold,
        maxLoanToValue,
        maxLoanToValueFL,
        fromTokenAmountInc,
        toTokenAmountInc,
        fromTokenAmountDec,
        toTokenAmountDec,
        isFlashLoanRequired,
        debtDelta,
        collateralDelta,
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
          const currentPosition = new Vault(
            { amount: currentDebt.plus(debtDenominatedTokensDepositedByUser) },
            { amount: currentCollateral.minus(collateralDepositedByUser) },
            oraclePrice,
            { liquidationThreshold, maxLoanToValue, dustLimit },
          )

          const oazoFeeBase = new BigNumber(10000)
          const target = currentPosition.adjustToTargetRiskRatio(riskRatio, {
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

          const actualFromTokenAmount = target.flags.isMultipleIncrease
            ? fromTokenAmountInc
            : fromTokenAmountDec
          const actualToTokenAmount = target.flags.isMultipleIncrease
            ? toTokenAmountInc
            : toTokenAmountDec

          // From Token Swap Amount
          expect(target.swap.fromTokenAmount.toFixed(2)).to.equal(actualFromTokenAmount.toFixed(2))

          // To Token Swapped Amount
          expect(target.swap.toTokenAmount.toFixed(2)).to.equal(actualToTokenAmount.toFixed(2))

          // Debt Delta
          expect(target.delta.debt.toFixed(2)).to.equal(debtDelta.toFixed(2))

          // Collateral Delta
          expect(target.delta.collateral.toFixed(2)).to.equal(collateralDelta.toFixed(2))

          // Is Flashloan needed?
          expect(target.flags.usesFlashloan).to.equal(isFlashLoanRequired)

          // Flashloan Amount
          expect(target.delta.flashloanAmount.toFixed(0)).to.equal(amountToFlashloan.toFixed(0))

          // Target Debt
          expect(target.position.debt.amount.toFixed(2)).to.equal(targetDebt.toFixed(2))

          // Target Collateral
          expect(target.position.collateral.amount.toFixed(2)).to.equal(targetCollateral.toFixed(2))

          // Health Factor
          expect(target.position.healthFactor.toFixed(2)).to.equal(healthFactor.toFixed(2))

          // Liquidation Price
          expect(target.position.liquidationPrice.toFixed(2)).to.equal(minOraclePrice.toFixed(2))

          // Fee Paid
          if (target.flags.isMultipleIncrease) {
            expect(target.swap.fee.toFixed(4)).to.equal(feePaidFromBaseToken.toFixed(4))
          } else {
            expect(target.swap.fee.toFixed(4)).to.equal(feePaidFromCollateralToken.toFixed(4))
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
      it(`Test LTV_min ${scenario.name}`, () => {
        const position = new Vault(
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
        const marketPriceAccountingForSlippage = scenario.marketPrice.times(
          ONE.plus(scenario.slippage),
        )
        expect(
          position
            .minConfigurableRiskRatio(marketPriceAccountingForSlippage)
            .loanToValue.toFixed(4),
        ).to.equal(scenario.ltvMin.toFixed(4))
      })
    })
  })
})
