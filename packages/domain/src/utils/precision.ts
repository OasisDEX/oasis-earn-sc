import { TYPICAL_PRECISION } from '@dma-common/constants'
import BigNumber from 'bignumber.js'

/**
 * We standardise token balances to 18 decimal places
 * The reason for this is that our worked examples in Excel require numbers to be standardised in this fashion
 * because Excel cannot handle the precision of fractions
 * */
export function standardiseAmountTo18Decimals(amount: BigNumber, precision: number): BigNumber {
  // 1e6 USDC (1 USDC) -> 1e18 USDC // 1e18 ETH (1 ETH) -> 1e18 ETH
  return amount.times(10 ** (TYPICAL_PRECISION - precision))
}

export function revertToTokenSpecificPrecision(amount: BigNumber, precision: number): BigNumber {
  // 1e18 ETH (1 ETH) -> 1e18 ETH // 1e18 USDC (1 Normalised USDC) -> 1e6 (1 USDC) USDC
  return amount.div(10 ** (TYPICAL_PRECISION - precision))
}
