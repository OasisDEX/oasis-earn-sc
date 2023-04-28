import { Optional } from '@dma-common/types/optional'
import { Address } from '@oasisdex/dma-deployments/types/address'
import { IPositionCategory, Position, PositionBalance } from '@oasisdex/domain/src'
import BigNumber from 'bignumber.js'

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
