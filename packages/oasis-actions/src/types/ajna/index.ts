import { BigNumber } from 'bignumber.js'

import { IRiskRatio, RiskRatio } from '../../helpers/calculations/RiskRatio'
import { Address } from '../common'

/*
AJNA ACRONYM FINDER

I was getting tired of referencing the whitepaper for acronyms 

LPB | (Total) Liquidity provided balance


HTP | Highest Threshold Price
The Threshold Price of the least collateralised loan in the pool. Lenders must deposit above the HTP to earn interest

HPB | Highest Price Bucket
Highest priced bucket that contains collateral

LUP | Lowest Utilisation Price
The price of the lowest Lender that is matched with a Borrower

MOMP |  Most Optimistic Matching Price
The price at which the amount of deposit above it is equal to the average loan size in the pool. It's the price at which a loan of average size matches the most favourable lenders in the book

NIM | Net Interest Margin
Accrues in the pool reserves and acts as a liquidity buffer to lenders

NP | Neutral price 
THE NP of a loan is the interest-adjusted MOMP at the last time debt was drawn or collateral removed. 

PTP | Pool Threshold Price
Total Debt of the Pool / Total Collateral Pledged

TP | Threshold price. 
The TP of a loan is the price at which the value of the collateral equals the value of the debt.



A loan is considered fully collateralized when its debt is less than the value of its collateral, 
valued at the LUP. Equivalently, each loan is considered collateralized if TP ≤ LUP. 

Each pool hasa pool threshold price PTP, which is the total debt of the pool divided by the total collateral pledged to the pool.
Note that the TP of a loan is entirely under the control of the borrower. 
If a loan becomes undercollateralized, then it's eligible for liquidation (see 7.0 LIQUIDATIONS).
*/

export interface Pool {
  poolAddress: Address
  quoteToken: Address
  collateralToken: Address

  lup: BigNumber

  // annualized rate as a fraction 0.05 = 5%
  rate: BigNumber
}

export interface IAjnaPosition {
  pool: Pool
  owner: Address
  collateralAmount: BigNumber
  debtAmount: BigNumber

  liquidationPrice: BigNumber

  riskRatio: IRiskRatio

  deposit(amount: BigNumber): AjnaPosition
  withdraw(amount: BigNumber): AjnaPosition
  borrow(amount: BigNumber): AjnaPosition
  payback(amount: BigNumber): AjnaPosition
}

export class AjnaPosition implements IAjnaPosition {
  riskRatio: IRiskRatio

  constructor(
    public pool: Pool,
    public owner: Address,
    public collateralAmount: BigNumber,
    public debtAmount: BigNumber,
  ) {
    this.riskRatio = new RiskRatio(
      debtAmount.div(collateralAmount.times(pool.lup)),
      RiskRatio.TYPE.LTV,
    )
  }

  get liquidationPrice() {
    return new BigNumber(0)
  }

  deposit(collateralAmount: BigNumber) {
    return new AjnaPosition(
      this.pool,
      this.owner,
      this.collateralAmount.plus(collateralAmount),
      this.debtAmount,
    )
  }

  withdraw(collateralAmount: BigNumber) {
    return new AjnaPosition(
      this.pool,
      this.owner,
      this.collateralAmount.minus(collateralAmount),
      this.debtAmount,
    )
  }

  borrow(quoteAmount: BigNumber): AjnaPosition {
    return new AjnaPosition(
      this.pool,
      this.owner,
      this.collateralAmount,
      this.debtAmount.plus(quoteAmount),
    )
  }

  payback(quoteAmount: BigNumber): AjnaPosition {
    return new AjnaPosition(
      this.pool,
      this.owner,
      this.collateralAmount,
      this.debtAmount.minus(quoteAmount),
    )
  }
}

export interface AjnaEarn {
  quoteToken: BigNumber
  bucketIndex: number
}
