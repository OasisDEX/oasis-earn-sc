import BigNumber from 'bignumber.js'
import { Optional } from 'utility-types'

import {
  IPositionCategory,
  Position,
  PositionBalance,
} from '../../../helpers/calculations/Position'
import { Address } from '../IPositionRepository'
import { AAVETokens } from './tokens'

interface IAavePositionBalance {
  amount: BigNumber
  precision: number
  symbol: AAVETokens
  address: Address
}

export class AavePositionBalance extends PositionBalance {
  public symbol: AAVETokens
  public address: Address
  constructor(args: Optional<IAavePositionBalance, 'precision'>) {
    super(args)
    this.symbol = args.symbol
    this.address = args.address
  }
}

export class AavePosition extends Position {
  public debt: AavePositionBalance
  public collateral: AavePositionBalance

  constructor(
    debt: Optional<IAavePositionBalance, 'precision'>,
    collateral: Optional<IAavePositionBalance, 'precision'>,
    oraclePrice: BigNumber,
    category: IPositionCategory,
  ) {
    super(debt, collateral, oraclePrice, category)
    this.debt = new AavePositionBalance(debt)
    this.collateral = new AavePositionBalance(collateral)
  }
}
