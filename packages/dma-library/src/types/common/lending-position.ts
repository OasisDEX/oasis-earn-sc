import { Address } from '@deploy-configurations/types/address'
import { IRiskRatio } from '@domain'
import { BigNumber } from 'bignumber.js'

export interface LendingPosition {
  owner: Address
  collateralAmount: BigNumber
  debtAmount: BigNumber

  marketPrice: BigNumber
  liquidationPrice: BigNumber
  liquidationToMarketPrice: BigNumber

  collateralAvailable: BigNumber
  riskRatio: IRiskRatio
  maxRiskRatio: IRiskRatio
  minRiskRatio: IRiskRatio

  borrowRate: BigNumber
  netValue: BigNumber
  buyingPower: BigNumber
  pnl: {
    withFees: BigNumber
    withoutFees: BigNumber
  }

  debtAvailable(collateralAmount?: BigNumber, debtAmount?: BigNumber): BigNumber

  deposit(amount: BigNumber): LendingPosition

  withdraw(amount: BigNumber): LendingPosition

  borrow(amount: BigNumber): LendingPosition

  payback(amount: BigNumber): LendingPosition
}
