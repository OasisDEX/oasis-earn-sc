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

export { AjnaEarnPosition } from './ajna-earn-position'
export { AjnaPosition } from './ajna-position'
