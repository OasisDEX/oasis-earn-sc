import { Amount } from '@domain/amount'
import BigNumber from 'bignumber.js'

/**
 * We normalize token balances to 18 decimal places
 * The reason for this is that our worked examples in Excel require numbers to be standardised in this fashion
 * because Excel cannot handle the precision of fractions
 * */
export function standardiseAmountTo18Decimals(
  amount: BigNumber,
  initialPrecision: number,
): BigNumber {
  // 1e6 USDC (1 USDC) -> 1e18 USDC // 1e18 ETH (1 ETH) -> 1e18 ETH
  const _amount = new Amount(amount, 'max', initialPrecision)
  return _amount.switchPrecisionMode('normalized').toBigNumber()
}

export function revertToTokenSpecificPrecision(amount: BigNumber, precision: number): BigNumber {
  // 1e18 ETH (1 ETH) -> 1e18 ETH // 1e18 USDC (1 Normalised USDC) -> 1e6 (1 USDC) USDC
  const _amount = new Amount(amount, 'normalized', precision)
  return _amount.switchPrecisionMode('max').toBigNumber()
}
