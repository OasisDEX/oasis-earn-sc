import { BigNumber } from 'bignumber.js'

export interface LendingCumulativesData {
  borrowCumulativeDepositUSD: BigNumber
  borrowCumulativeDepositInQuoteToken: BigNumber
  borrowCumulativeDepositInCollateralToken: BigNumber
  borrowCumulativeWithdrawUSD: BigNumber
  borrowCumulativeWithdrawInQuoteToken: BigNumber
  borrowCumulativeWithdrawInCollateralToken: BigNumber
  borrowCumulativeCollateralDeposit: BigNumber
  borrowCumulativeCollateralWithdraw: BigNumber
  borrowCumulativeDebtDeposit: BigNumber
  borrowCumulativeDebtWithdraw: BigNumber
  borrowCumulativeFeesUSD: BigNumber
  borrowCumulativeFeesInQuoteToken: BigNumber
  borrowCumulativeFeesInCollateralToken: BigNumber
}

export interface LendingCumulativesRawData {
  borrowCumulativeDepositUSD: number
  borrowCumulativeDepositInQuoteToken: number
  borrowCumulativeDepositInCollateralToken: number
  borrowCumulativeWithdrawUSD: number
  borrowCumulativeWithdrawInQuoteToken: number
  borrowCumulativeWithdrawInCollateralToken: number
  borrowCumulativeCollateralDeposit: number
  borrowCumulativeCollateralWithdraw: number
  borrowCumulativeDebtDeposit: number
  borrowCumulativeDebtWithdraw: number
  borrowCumulativeFeesUSD: number
  borrowCumulativeFeesInQuoteToken: number
  borrowCumulativeFeesInCollateralToken: number
}

export interface EarnCumulativesData {
  earnCumulativeFeesInQuoteToken: BigNumber
  earnCumulativeQuoteTokenDeposit: BigNumber
  earnCumulativeQuoteTokenWithdraw: BigNumber
  earnCumulativeDepositUSD: BigNumber
  earnCumulativeDepositInQuoteToken: BigNumber
  earnCumulativeDepositInCollateralToken: BigNumber
  earnCumulativeWithdrawUSD: BigNumber
  earnCumulativeWithdrawInQuoteToken: BigNumber
  earnCumulativeWithdrawInCollateralToken: BigNumber
  earnCumulativeFeesUSD: BigNumber
  earnCumulativeFeesInCollateralToken: BigNumber
}

export interface EarnCumulativesRawData {
  earnCumulativeFeesInQuoteToken: number
  earnCumulativeQuoteTokenDeposit: number
  earnCumulativeQuoteTokenWithdraw: number
  earnCumulativeDepositUSD: number
  earnCumulativeDepositInQuoteToken: number
  earnCumulativeDepositInCollateralToken: number
  earnCumulativeWithdrawUSD: number
  earnCumulativeWithdrawInQuoteToken: number
  earnCumulativeWithdrawInCollateralToken: number
  earnCumulativeFeesUSD: number
  earnCumulativeFeesInCollateralToken: number
}
