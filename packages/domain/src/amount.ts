import { ONE, TEN, TEN_POW_18, TYPICAL_PRECISION, ZERO } from '@dma-common/constants'
import BigNumber from 'bignumber.js'

/**
 * Possible precision levels are:
 * - normal                                             EG 1 USDC = 1
 * - max (max precision for the token)                  EG 1 USDC = 1e6
 * - normalised (precision set 18 decimals for maths)   EG 1 USDC = 1e18
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
      this._dividedByBigNumber(this.currentPrecision)
      return this
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

  switchPrecisionMode(mode: PrecisionMode) {
    if (!(mode in this.precisionMap)) {
      throw new Error(`Invalid precision mode: ${mode}`)
    }

    const ratio = this.precisionMap[mode].dividedBy(this.currentPrecision)
    this.amount = this.amount.multipliedBy(ratio)
    this.currentPrecision = this.precisionMap[mode]
  }

  getRawAmountUsingMode(mode: PrecisionMode): BigNumber {
    if (!(mode in this.precisionMap)) {
      throw new Error(`Invalid precision level: ${mode}`)
    }

    const ratio = this.currentPrecision.dividedBy(this.precisionMap[mode])
    return this.amount.dividedBy(ratio)
  }

  getRawAmount(): BigNumber {
    return this.amount
  }

  private _dividedByBigNumber(otherAmount: BigNumber): Amount {
    this._setAmount(this.amount.div(otherAmount))
    return this
  }

  private _timesByBigNumber(otherAmount: BigNumber): Amount {
    this._setAmount(this.amount.times(otherAmount))
    return this
  }

  private _minusByBigNumber(otherAmount: BigNumber): Amount {
    this._setAmount(this.amount.minus(otherAmount))
    return this
  }

  private _plusByBigNumber(otherAmount: BigNumber): Amount {
    this._setAmount(this.amount.plus(otherAmount))
    return this
  }

  private _setAmount(amount: BigNumber) {
    this.amount = amount
  }

  private _doMaths(otherAmount: Amount, operator: 'plus' | 'minus' | 'times' | 'div') {
    this._verifyAmountsAreCompatible(otherAmount)
    const currentPrecisionMode = this.getCurrentPrecisionMode()
    const currentAmount = this.getRawAmount()
    const otherAmountInSamePrecisionMode = otherAmount.getRawAmountUsingMode(currentPrecisionMode)

    const newAmount = currentAmount[operator](otherAmountInSamePrecisionMode)
    this._setAmount(newAmount)

    return this
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
