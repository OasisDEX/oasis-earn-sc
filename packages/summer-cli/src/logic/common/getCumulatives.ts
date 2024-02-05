import BigNumber from 'bignumber.js';

export const getCumulatives = () => {
  return Promise.resolve({
    borrowCumulativeDepositUSD: new BigNumber(0),
    borrowCumulativeDepositInQuoteToken: new BigNumber(0),
    borrowCumulativeDepositInCollateralToken: new BigNumber(0),
    borrowCumulativeWithdrawUSD: new BigNumber(0),
    borrowCumulativeWithdrawInQuoteToken: new BigNumber(0),
    borrowCumulativeWithdrawInCollateralToken: new BigNumber(0),
    borrowCumulativeCollateralDeposit: new BigNumber(0),
    borrowCumulativeCollateralWithdraw: new BigNumber(0),
    borrowCumulativeDebtDeposit: new BigNumber(0),
    borrowCumulativeDebtWithdraw: new BigNumber(0),
    borrowCumulativeFeesUSD: new BigNumber(0),
    borrowCumulativeFeesInQuoteToken: new BigNumber(0),
    borrowCumulativeFeesInCollateralToken: new BigNumber(0),
  });
};
