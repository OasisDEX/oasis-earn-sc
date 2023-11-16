import { Address } from '@deploy-configurations/types/address'
import { BigNumber } from 'bignumber.js'

/**
 * Morpho market parameters
 *
 * @param loanToken The loan token address
 * @param collateralToken The collateral token address
 * @param oracle The oracle address
 * @param irm The interest rate model address
 * @param lltv The liquidation loan-to-value ratio
 */
export type MorphoBlueMarket = {
  loanToken: Address
  collateralToken: Address
  oracle: Address
  irm: Address
  lltv: BigNumber
}
