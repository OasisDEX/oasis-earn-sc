import { ONE, TEN, TEN_POW_18, TYPICAL_PRECISION, ZERO } from '@dma-common/constants'
import BigNumber from 'bignumber.js'

/**
 * Possible precision levels are:
 * - normal                                             EG 1 USDC = 1
 * - (no precision set, just the raw amount)
 *
 * - max                                                EG 1 USDC = 1e6
 * - (max precision for the token)
 *
 * - normalized                                         EG 1 USDC = 1e18
 * - (precision set 18 decimals for to standardise amounts for maths reasons)
 */
type PrecisionMode = 'normal' | 'max' | 'normalized'
type PrecisionMap = Record<PrecisionMode, BigNumber>

export class Amount {
  private currentPrecision: BigNumber
  private readonly tokenPrecision: number
  private amount: BigNumber
  private readonly precisionMap: PrecisionMap
  constructor(
    initialAmount = ZERO,
    initialPrecision: PrecisionMode = 'normal',
    tokenPrecision: number = TYPICAL_PRECISION,
  ) {
    this.tokenPrecision = tokenPrecision
    this.precisionMap = {
      normal: ONE,
      max: new BigNumber(TEN.pow(tokenPrecision)),
      normalized: TEN_POW_18,
    }
    this.currentPrecision = this.precisionMap[initialPrecision]
    this.amount = initialAmount
  }

  static from(amount: Amount | BigNumber) {
    if (amount instanceof Amount) {
      return new Amount(
        amount.toBigNumber(),
        amount.getCurrentPrecisionMode(),
        amount.getTokenPrecision(),
      )
    }
    return new Amount(amount)
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
      return this._dividedByBigNumber(this.currentPrecision)
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
      if (this.precisionMap[precisionMode].isEqualTo(this.currentPrecision)) {
        return precisionMode as PrecisionMode
      }
    }

    throw new Error('Could not get current precision')
  }

  getTokenPrecision(): number {
    return this.tokenPrecision
  }

  switchPrecisionMode(mode: PrecisionMode): Amount {
    if (!(mode in this.precisionMap)) {
      throw new Error(`Invalid precision mode: ${mode}`)
    }

    const ratio = this.precisionMap[mode].dividedBy(this.currentPrecision)
    this.amount = this.amount.multipliedBy(ratio)
    this.currentPrecision = this.precisionMap[mode]

    return Amount.from(this)
  }

  toBigNumber(mode: PrecisionMode = this.getCurrentPrecisionMode()): BigNumber {
    if (!(mode in this.precisionMap)) {
      throw new Error(`Invalid precision level: ${mode}`)
    }

    const ratio = this.currentPrecision.dividedBy(this.precisionMap[mode])
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
    const thisMaxPrecision = this._getMaxPrecision()
    const otherMaxPrecision = otherAmount._getMaxPrecision()

    if (thisMaxPrecision.eq(otherMaxPrecision)) {
      return true // All good
    }

    throw new Error(
      `Amounts are not compatible: ${thisMaxPrecision.toString()} !== ${otherMaxPrecision.toString()}`,
    )
  }

  private _getMaxPrecision(): BigNumber {
    return this.precisionMap.max
  }
}
