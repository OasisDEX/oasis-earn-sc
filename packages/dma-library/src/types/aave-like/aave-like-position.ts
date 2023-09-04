import { Address } from '@deploy-configurations/types/address'
import { Optional } from '@dma-common/types/optional'
import { IPositionCategory, Position, PositionBalance } from '@domain'
import BigNumber from 'bignumber.js'

import { AaveLikeTokens } from './tokens'

interface IAaveLikePositionBalance {
  amount: BigNumber
  precision: number
  symbol: AaveLikeTokens
  address: Address
}

export class AaveLikePositionBalance extends PositionBalance {
  public symbol: AaveLikeTokens
  public address: Address
  constructor(args: Optional<IAaveLikePositionBalance, 'precision'>) {
    super(args)
    this.symbol = args.symbol
    this.address = args.address
  }
}

export class AaveLikePosition extends Position {
  public debt: AaveLikePositionBalance
  public collateral: AaveLikePositionBalance

  constructor(
    debt: Optional<IAaveLikePositionBalance, 'precision'>,
    collateral: Optional<IAaveLikePositionBalance, 'precision'>,
    oraclePrice: BigNumber,
    category: IPositionCategory,
  ) {
    super(debt, collateral, oraclePrice, category)
    this.debt = new AaveLikePositionBalance(debt)
    this.collateral = new AaveLikePositionBalance(collateral)
  }
}
