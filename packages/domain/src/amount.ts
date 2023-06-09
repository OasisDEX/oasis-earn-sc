import { ONE, TEN, TEN_POW_18, TYPICAL_PRECISION, ZERO } from '@dma-common/constants'
import BigNumber from 'bignumber.js'

/**
 * Possible precision levels are:
 * - none                                             EG 1 USDC = 1
 * - (no precision set, just the raw amount)
 *
 * - tokenMax                                                EG 1 USDC = 1e6
 * - (max precision for the token)
 *
 * - normalized                                         EG 1 USDC = 1e18
 * - (precision set 18 decimals for to standardise amounts for maths reasons)
 */
type PrecisionMode = 'none' | 'tokenMax' | 'normalized'
type PrecisionMap = Record<PrecisionMode, BigNumber>

type AmountArgs = {
  amount: BigNumber
  precision?: {
    /** none: 1USDC = 1, max: 1USDC = 1e6, normalized: 1USDC = 1e18 */
    mode?: PrecisionMode
    tokenMaxDecimals?: number
  }
}

export class Amount {
  private currentPrecisionScale: BigNumber
  private readonly tokenMaxDecimals: number
  private amount: BigNumber
  private readonly precisionMap: PrecisionMap
  constructor(args: AmountArgs) {
    const initialAmount = args.amount || ZERO
    const initialPrecisionMode = args?.precision?.mode || 'none'
    this.tokenMaxDecimals = args?.precision?.tokenMaxDecimals || TYPICAL_PRECISION
    this.precisionMap = {
      none: ONE,
      tokenMax: new BigNumber(TEN.pow(this.tokenMaxDecimals)),
      normalized: TEN_POW_18,
    }
    this.currentPrecisionScale = this.precisionMap[initialPrecisionMode]
    this.amount = initialAmount
  }

  static from(amount: Amount | BigNumber) {
    if (amount instanceof Amount) {
      return new Amount({
        amount: amount.toBigNumber(),
        precision: {
          mode: amount.getCurrentPrecisionMode(),
          tokenMaxDecimals: amount.getTokenMaxDecimals(),
        },
      })
    }
    return new Amount({ amount })
  }

  plus(otherAmount: Amount | BigNumber): Amount {
    if (otherAmount instanceof Amount) {
      return this._doMaths(otherAmount, 'plus')
    }
    return this._plusByBigNumber(otherAmount)
  }

  minus(otherAmount: Amount | BigNumber): Amount {
    if (otherAmount instanceof Amount) {
      return this._doMaths(otherAmount, 'minus')
    }
    return this._minusByBigNumber(otherAmount)
  }

  times(otherAmount: Amount | BigNumber): Amount {
    if (otherAmount instanceof Amount) {
      this._doMaths(otherAmount, 'times')
      // Needs to be divided by the current precision to get the correct amount
      return this._dividedByBigNumber(this.currentPrecisionScale)
    }
    return this._timesByBigNumber(otherAmount)
  }

  div(otherAmount: Amount | BigNumber): Amount {
    if (otherAmount instanceof Amount) {
      return this._doMaths(otherAmount, 'div')
    }
    return this._dividedByBigNumber(otherAmount)
  }

  dividedBy(otherAmount: Amount | BigNumber): Amount {
    return this.div(otherAmount)
  }

  getCurrentPrecisionMode(): PrecisionMode {
    for (const precisionMode of Object.keys(this.precisionMap)) {
      if (this.precisionMap[precisionMode].isEqualTo(this.currentPrecisionScale)) {
        return precisionMode as PrecisionMode
      }
    }

    throw new Error('Could not get current precision')
  }

  getTokenMaxDecimals(): number {
    return this.tokenMaxDecimals
  }

  switchPrecisionMode(mode: PrecisionMode): Amount {
    if (!(mode in this.precisionMap)) {
      throw new Error(`Invalid precision mode: ${mode}`)
    }

    const ratio = this.precisionMap[mode].dividedBy(this.currentPrecisionScale)
    this.amount = this.amount.multipliedBy(ratio)
    this.currentPrecisionScale = this.precisionMap[mode]

    return Amount.from(this)
  }

  toBigNumber(mode: PrecisionMode = this.getCurrentPrecisionMode()): BigNumber {
    if (!(mode in this.precisionMap)) {
      throw new Error(`Invalid precision level: ${mode}`)
    }

    const ratio = this.currentPrecisionScale.dividedBy(this.precisionMap[mode])
    return this.amount.dividedBy(ratio)
  }

  integerValue(rm?: BigNumber.RoundingMode | undefined): Amount {
    return this._setAmount(this.amount.integerValue(rm))
  }

  private _dividedByBigNumber(otherAmount: BigNumber): Amount {
    return this._setAmount(this.amount.div(otherAmount))
  }

  private _timesByBigNumber(otherAmount: BigNumber): Amount {
    return this._setAmount(this.amount.times(otherAmount))
  }

  private _minusByBigNumber(otherAmount: BigNumber): Amount {
    return this._setAmount(this.amount.minus(otherAmount))
  }

  private _plusByBigNumber(otherAmount: BigNumber): Amount {
    return this._setAmount(this.amount.plus(otherAmount))
  }

  private _setAmount(amount: BigNumber): Amount {
    this.amount = amount
    return Amount.from(this)
  }

  private _doMaths(otherAmount: Amount, operator: 'plus' | 'minus' | 'times' | 'div') {
    this._verifyAmountsAreCompatible(otherAmount)
    const currentPrecisionMode = this.getCurrentPrecisionMode()
    const currentAmount = this.toBigNumber()
    const otherAmountInSamePrecisionMode = otherAmount.toBigNumber(currentPrecisionMode)

    const newAmount = currentAmount[operator](otherAmountInSamePrecisionMode)
    return this._setAmount(newAmount)
  }

  private _verifyAmountsAreCompatible(otherAmount: Amount) {
    const thisTokenMaxDecimals = this._getTokenMaxPrecisionAsBigNumber()
    const otherTokenMaxDecimals = otherAmount._getTokenMaxPrecisionAsBigNumber()

    if (thisTokenMaxDecimals.eq(otherTokenMaxDecimals)) {
      return true // All good
    }

    throw new Error(
      `Amounts are not compatible: ${thisTokenMaxDecimals.toString()} !== ${otherTokenMaxDecimals.toString()}`,
    )
  }

  private _getTokenMaxPrecisionAsBigNumber(): BigNumber {
    return new BigNumber(this.tokenMaxDecimals)
  }
}
