import { Address } from '@deploy-configurations/types/address'

export class Token<TokenSymbols = string> {
  public symbol: TokenSymbols
  public precision: number
  constructor(symbol: TokenSymbols, precision: number) {
    this.symbol = symbol
    this.precision = precision
  }
}

export class TokenConfig<TokenSymbols = string> extends Token<TokenSymbols> {
  public address: Address | null
  constructor(symbol: TokenSymbols, precision: number, address: Address | null = null) {
    super(symbol, precision)
    this.address = address
  }

  setAddress(address: Address): void {
    this.address = address
  }
}
