import { ONE, ZERO } from '@dma-common/constants'
import { expect } from '@dma-common/test-utils'
import { Position } from '@domain/position'
import { RiskRatio } from '@domain/risk-ratio'
import BigNumber from 'bignumber.js'

import { testDataSources } from './scenarios/generateTestData'
import { fetchTestScenarios } from './utils'

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
  feePaidFromSourceToken: BigNumber
  feePaidFromTargetToken: BigNumber
}

describe('Calculate Position Helper | Unit', async () => {
  describe('LTV_target', async () => {
    const scenarios = (await fetchTestScenarios<Scenario>(testDataSources.LTV_target)) as Scenario[]
    const debug = false

    scenarios.forEach((scenario, index) => {
      const {
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
        feePaidFromSourceToken,
      } = scenario
      it(`Test: ${name}`, async () => {
        if (debug) {
          console.log('Values from Google Sheets')
          console.log('Scenario index', index)
          Object.entries(scenario).forEach(([key, value]) => {
            console.log(`${key}: ${value}`)
          })
        }
        const riskRatio = new RiskRatio(targetLoanToValue, RiskRatio.TYPE.LTV)
        const dustLimit = new BigNumber(0)

        /* Note: we have to remove User deposits from current values because they've already been rolled up (assigned) in our googlesheets data*/
        const currentVault = new Position(
          { amount: currentDebt.plus(debtDenominatedTokensDepositedByUser), symbol: 'ANY' },
          { amount: currentCollateral.minus(collateralDepositedByUser), symbol: 'ANY' },
          oraclePrice,
          { liquidationThreshold, maxLoanToValue, dustLimit },
        )

        const oazoFeeBase = new BigNumber(10000)
        const target = currentVault.adjustToTargetRiskRatio(riskRatio, {
          depositedByUser: {
            debtInWei: debtDenominatedTokensDepositedByUser,
            collateralInWei: collateralDepositedByUser,
          },
          flashloan: {
            maxLoanToValueFL: maxLoanToValueFL,
            tokenSymbol: 'DAI',
          },
          fees: { flashLoan: flashloanFees, oazo: oazoFees.times(oazoFeeBase) },
          prices: {
            market: marketPrice,
            oracle: oraclePrice,
            oracleFLtoDebtToken: oraclePriceFLtoDebtToken,
          },
          collectSwapFeeFrom: 'sourceToken',
          slippage,
          useFlashloanSafetyMargin: false,
          // debug,
        })

        const actualFromTokenAmount = target.flags.isIncreasingRisk
          ? fromTokenAmountInc
          : fromTokenAmountDec
        const actualToTokenAmount = target.flags.isIncreasingRisk
          ? toTokenAmountInc
          : toTokenAmountDec

        // From Token Swap Amount
        debug && console.log('From Token Swap Amount')
        expect(target.swap.fromTokenAmount.toFixed(2)).to.equal(actualFromTokenAmount.toFixed(2))

        // To Token Swapped Amount
        debug && console.log('To Token Swap Amount')
        expect(target.swap.minToTokenAmount.toFixed(2)).to.equal(actualToTokenAmount.toFixed(2))

        // Debt Delta
        debug && console.log('Debt Delta')
        expect(target.delta.debt.toFixed(2)).to.equal(debtDelta.toFixed(2))

        // Collateral Delta
        debug && console.log('Collateral Delta')
        expect(target.delta.collateral.toFixed(2)).to.equal(collateralDelta.toFixed(2))

        // Is Flashloan needed?
        debug && console.log('Is Flashloan required?')
        expect(target.flags.requiresFlashloan).to.equal(isFlashLoanRequired)

        // Flashloan Amount
        debug && console.log('Flashloan Amount')
        const expectedAmountToFlashloan = isFlashLoanRequired ? target.delta?.flashloanAmount : ZERO
        expect(expectedAmountToFlashloan.toFixed(0)).to.equal(amountToFlashloan.toFixed(0))

        // Target Debt
        debug && console.log('Target Debt')
        expect(target.position.debt.amount.toFixed(2)).to.equal(targetDebt.toFixed(2))

        // Target Collateral
        debug && console.log('Target Collateral')
        expect(target.position.collateral.amount.toFixed(2)).to.equal(targetCollateral.toFixed(2))

        // Health Factor
        debug && console.log('Health Factor')
        expect(target.position.healthFactor.toFixed(2)).to.equal(healthFactor.toFixed(2))

        // Liquidation Price
        debug && console.log('Liquidation Price')
        expect(target.position.liquidationPrice.toFixed(2)).to.equal(minOraclePrice.toFixed(2))

        // Fee Paid - assumes fees always collected from source token
        debug && console.log('Fees')
        expect(target.swap.tokenFee.toFixed(4)).to.equal(feePaidFromSourceToken.toFixed(4))
      })
    })
  })

  // TODO: failing and need investigating
  describe.skip('LTV_min', async () => {
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
      it.skip(`Test LTV_min ${scenario.name}`, () => {
        const position = new Position(
          {
            amount: scenario.currentDebt,
            symbol: 'ANY',
          },
          {
            amount: scenario.currentCollateral,
            symbol: 'ANY',
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

describe('Position Mock Tests | Unit', () => {
  const maxDebt = { amount: new BigNumber(80), symbol: 'ETH', precision: 18 }
  const halfDebt = { amount: new BigNumber(40), symbol: 'ETH', precision: 18 }
  const collateral = { amount: new BigNumber(200), symbol: 'STETH', precision: 18 }
  const oraclePrice = new BigNumber(0.5)
  const positionCategory = {
    liquidationThreshold: new BigNumber(0.81),
    maxLoanToValue: new BigNumber(0.8),
    dustLimit: new BigNumber(0),
  }

  describe('Max Debt to Borrow', () => {
    it('Should return 0 if current LTV is max LTV', () => {
      const position = new Position(maxDebt, collateral, oraclePrice, positionCategory)

      const result = position.maxDebtToBorrow

      expect(result.toString()).to.equal(ZERO.toString())
    })

    it('Should return exactly value of debt when LTV is half of max LTV', () => {
      const position = new Position(halfDebt, collateral, oraclePrice, positionCategory)

      const result = position.maxDebtToBorrow

      expect(result.toString()).to.equal(halfDebt.amount.toString())
    })
  })
  describe('Max Collateral to Withdraw', () => {
    it('Should return 0 if current LTV is max LTV', () => {
      const position = new Position(maxDebt, collateral, oraclePrice, positionCategory)

      const result = position.maxCollateralToWithdraw

      expect(result.toString()).to.equal(ZERO.toString())
    })
  })

  it('Should return exactly halt value of collateral when LTV is half of max LTV', () => {
    const position = new Position(halfDebt, collateral, oraclePrice, positionCategory)

    const result = position.maxCollateralToWithdraw

    expect(result.toString()).to.equal(collateral.amount.div(2).toString())
  })
})
