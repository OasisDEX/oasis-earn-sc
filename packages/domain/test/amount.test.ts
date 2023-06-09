import { ONE, TEN, ZERO } from '@dma-common/constants'
import { Amount } from '@domain/amount'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'

describe('Amount Class | Unit', () => {
  describe('precision switching', () => {
    it('should switch precision from no-precision to tokenMax', () => {
      const tokenMaxDecimals = 6
      const noDecimalPrecision = 0
      const amount = new Amount({
        amount: ONE,
        precision: { mode: 'none', tokenMaxDecimals: tokenMaxDecimals },
      })
      amount.switchPrecisionMode('tokenMax')
      const precisionDiff = TEN.pow(tokenMaxDecimals - noDecimalPrecision)
      expect(amount.toBigNumber()).to.deep.equal(precisionDiff)
    })
    it('should switch precision from tokenMax to normalized', () => {
      const normalizedDecimals = 18
      const tokenMaxDecimals = 6
      const amount = new Amount({
        amount: ONE,
        precision: { mode: 'tokenMax', tokenMaxDecimals: tokenMaxDecimals },
      })
      amount.switchPrecisionMode('normalized')
      const precisionDiff = TEN.pow(normalizedDecimals - tokenMaxDecimals)
      expect(amount.toBigNumber()).to.deep.equal(precisionDiff)
    })
    it('should switch precision from normalized to none', () => {
      const normalizedDecimals = 18
      const tokenMaxDecimals = 6
      const noDecimalPrecision = 0
      const amount = new Amount({
        amount: ONE,
        precision: { mode: 'normalized', tokenMaxDecimals: tokenMaxDecimals },
      })
      amount.switchPrecisionMode('none')
      const precisionDiff = TEN.pow(noDecimalPrecision - normalizedDecimals)
      expect(amount.toBigNumber()).to.deep.equal(precisionDiff)
    })
    it('should switch precision from normalized to tokenMax', () => {
      const normalizedDecimals = 18
      const tokenMaxDecimals = 6
      const amount = new Amount({
        amount: ONE,
        precision: { mode: 'normalized', tokenMaxDecimals: tokenMaxDecimals },
      })
      amount.switchPrecisionMode('tokenMax')
      const precisionDiff = TEN.pow(tokenMaxDecimals - normalizedDecimals)
      expect(amount.toBigNumber()).to.deep.equal(precisionDiff)
    })
  })
  describe('addition', function () {
    it('should add Amounts in same precision mode', () => {
      const amount1 = new Amount({
        amount: TEN,
        precision: { mode: 'none' },
      })
      const amount2 = new Amount({
        amount: new BigNumber(5),
        precision: { mode: 'none' },
      })
      amount1.plus(amount2)
      expect(amount1.toBigNumber()).to.deep.equal(new BigNumber(15))
    })

    it('should add tokenMax Amount to no precision Amount', () => {
      const tokenMaxDecimals = 6
      const amount1 = new Amount({
        amount: ONE,
        precision: { mode: 'none', tokenMaxDecimals },
      })
      const amount2 = new Amount({
        amount: new BigNumber(5e5),
        precision: { mode: 'tokenMax', tokenMaxDecimals },
      })
      amount1.plus(amount2)
      expect(amount1.toBigNumber()).to.deep.equal(new BigNumber(1.5))
    })

    it('should add tokenMax Amount to normalized Amount', () => {
      const tokenMaxDecimals = 6
      const amount1 = new Amount({
        amount: new BigNumber(1e12),
        precision: { mode: 'normalized', tokenMaxDecimals },
      })
      const amount2 = new Amount({
        amount: ONE,
        precision: { mode: 'tokenMax', tokenMaxDecimals },
      })
      amount1.plus(amount2)
      expect(amount1.toBigNumber()).to.deep.equal(new BigNumber(2e12))
    })

    it('should add BigNumber to Amount', () => {
      const tokenMaxDecimals = 6
      const amount = new Amount({
        amount: new BigNumber(1e12),
        precision: { mode: 'normalized', tokenMaxDecimals },
      })
      const amountAsBigNumber = new BigNumber(1e10)
      amount.plus(amountAsBigNumber)
      expect(amount.toBigNumber()).to.deep.equal(new BigNumber(1.01e12))
    })

    it('should throw an error when adding incompatible amounts', () => {
      const token1MaxDecimals = 18
      const token2MaxDecimals = 6
      const amount1 = new Amount({
        amount: new BigNumber(1e12),
        precision: { mode: 'tokenMax', tokenMaxDecimals: token1MaxDecimals },
      })
      const amount2 = new Amount({
        amount: ONE,
        precision: { mode: 'tokenMax', tokenMaxDecimals: token2MaxDecimals },
      })
      expect(() => amount1.plus(amount2)).to.throw()
    })
  })
  describe('subtraction', function () {
    it('should subtract Amounts in same precision mode', () => {
      const amount1 = new Amount({
        amount: TEN,
        precision: { mode: 'none' },
      })
      const amount2 = new Amount({
        amount: new BigNumber(5),
        precision: { mode: 'none' },
      })
      amount1.minus(amount2)
      expect(amount1.toBigNumber()).to.deep.equal(new BigNumber(5))
    })

    it('should subtract tokenMax Amount to no-precision Amount', () => {
      const tokenPrecision = 6
      const amount1 = new Amount({
        amount: ONE,
        precision: { mode: 'none', tokenMaxDecimals: tokenPrecision },
      })
      const amount2 = new Amount({
        amount: new BigNumber(5e5),
        precision: { mode: 'tokenMax', tokenMaxDecimals: tokenPrecision },
      })
      amount1.minus(amount2)
      expect(amount1.toBigNumber()).to.deep.equal(new BigNumber(0.5))
    })

    it('should add nax amount to normalized amount', () => {
      const tokenPrecision = 6
      const amount1 = new Amount({
        amount: new BigNumber(1e12),
        precision: { mode: 'normalized', tokenMaxDecimals: tokenPrecision },
      })
      const amount2 = new Amount({
        amount: ONE,
        precision: { mode: 'tokenMax', tokenMaxDecimals: tokenPrecision },
      })
      amount1.minus(amount2)
      expect(amount1.toBigNumber()).to.deep.equal(ZERO)
    })

    it('should subtract BigNumber from Amount', () => {
      const tokenPrecision = 6
      const amount = new Amount({
        amount: new BigNumber(1e12),
        precision: { mode: 'normalized', tokenMaxDecimals: tokenPrecision },
      })
      const amountAsBigNumber = new BigNumber(1e10)
      amount.minus(amountAsBigNumber)
      expect(amount.toBigNumber()).to.deep.equal(new BigNumber(9.9e11))
    })

    it('should throw an error when adding incompatible amounts', () => {
      const token1Precision = 18
      const token2Precision = 6
      const amount1 = new Amount({
        amount: new BigNumber(1e12),
        precision: { mode: 'tokenMax', tokenMaxDecimals: token1Precision },
      })
      const amount2 = new Amount({
        amount: ONE,
        precision: { mode: 'tokenMax', tokenMaxDecimals: token2Precision },
      })
      expect(() => amount1.minus(amount2)).to.throw()
    })
  })
  describe('multiplication', function () {
    it('should multiply Amounts in same precision mode', () => {
      const amount1 = new Amount({
        amount: TEN,
        precision: { mode: 'none' },
      })
      const amount2 = new Amount({
        amount: new BigNumber(5),
        precision: { mode: 'none' },
      })
      amount1.times(amount2)
      expect(amount1.toBigNumber()).to.deep.equal(new BigNumber(50))
    })

    it('should multiply tokenMax Amount to no-precision Amount', () => {
      const tokenPrecision = 6
      const amount1 = new Amount({
        amount: ONE,
        precision: { mode: 'none', tokenMaxDecimals: tokenPrecision },
      })
      const amount2 = new Amount({
        amount: new BigNumber(5e5),
        precision: { mode: 'tokenMax', tokenMaxDecimals: tokenPrecision },
      })
      amount1.times(amount2)
      expect(amount1.toBigNumber()).to.deep.equal(new BigNumber(0.5))
    })

    it('should multiply tokenMax Amount to normalized Amount', () => {
      const tokenPrecision = 6
      const amount1 = new Amount({
        amount: new BigNumber(1e12),
        precision: { mode: 'normalized', tokenMaxDecimals: tokenPrecision },
      })
      const amount2 = new Amount({
        amount: new BigNumber(2),
        precision: { mode: 'tokenMax', tokenMaxDecimals: tokenPrecision },
      })
      amount1.times(amount2)
      expect(amount1.toBigNumber()).to.deep.equal(new BigNumber(2e6))
    })

    it('should multiply Amount by BigNumber', () => {
      const tokenPrecision = 6
      const amount = new Amount({
        amount: new BigNumber(1e12),
        precision: { mode: 'normalized', tokenMaxDecimals: tokenPrecision },
      })
      const amountAsBigNumber = new BigNumber(1e10)
      amount.times(amountAsBigNumber)
      expect(amount.toBigNumber()).to.deep.equal(new BigNumber(1e22))
    })

    it('should throw an error when adding incompatible amounts', () => {
      const token1Precision = 18
      const token2Precision = 6
      const amount1 = new Amount({
        amount: new BigNumber(1e12),
        precision: { mode: 'tokenMax', tokenMaxDecimals: token1Precision },
      })
      const amount2 = new Amount({
        amount: ONE,
        precision: { mode: 'tokenMax', tokenMaxDecimals: token2Precision },
      })
      expect(() => amount1.times(amount2)).to.throw()
    })
  })
  describe('division', function () {
    it('should divide Amounts in same precision mode', () => {
      const amount1 = new Amount({
        amount: TEN,
        precision: { mode: 'none' },
      })
      const amount2 = new Amount({
        amount: new BigNumber(5),
        precision: { mode: 'none' },
      })
      amount1.div(amount2)
      expect(amount1.toBigNumber()).to.deep.equal(new BigNumber(2))
    })

    it('should divide no-precision Amount by tokenMax Amount', () => {
      const tokenPrecision = 6
      const amount1 = new Amount({
        amount: ONE,
        precision: { mode: 'none', tokenMaxDecimals: tokenPrecision },
      })
      const amount2 = new Amount({
        amount: new BigNumber(5e5),
        precision: { mode: 'tokenMax', tokenMaxDecimals: tokenPrecision },
      })
      amount1.div(amount2)
      expect(amount1.toBigNumber()).to.deep.equal(new BigNumber(2))
    })

    it('should divide tokenMax Amount to normalized Amount', () => {
      const tokenPrecision = 6
      const amount1 = new Amount({
        amount: new BigNumber(1e12),
        precision: { mode: 'normalized', tokenMaxDecimals: tokenPrecision },
      })
      const amount2 = new Amount({
        amount: new BigNumber(2),
        precision: { mode: 'tokenMax', tokenMaxDecimals: tokenPrecision },
      })
      amount1.div(amount2)
      expect(amount1.toBigNumber()).to.deep.equal(new BigNumber(0.5))
    })

    it('should divide Amount by BigNumber', () => {
      const tokenPrecision = 6
      const amount = new Amount({
        amount: new BigNumber(1e12),
        precision: { mode: 'normalized', tokenMaxDecimals: tokenPrecision },
      })
      const amountAsBigNumber = new BigNumber(2e10)
      amount.dividedBy(amountAsBigNumber)
      expect(amount.toBigNumber()).to.deep.equal(new BigNumber(50))
    })

    it('should throw an error when adding incompatible Amounts', () => {
      const token1Precision = 18
      const token2Precision = 6
      const amount1 = new Amount({
        amount: new BigNumber(1e12),
        precision: { mode: 'tokenMax', tokenMaxDecimals: token1Precision },
      })
      const amount2 = new Amount({
        amount: ONE,
        precision: { mode: 'tokenMax', tokenMaxDecimals: token2Precision },
      })
      expect(() => amount1.div(amount2)).to.throw()
    })
  })
  describe('toBigNumberInPrecision', function () {
    it('should get the Amount as a BigNumber in no-precision mode', () => {
      const amount = new Amount({
        amount: TEN,
        precision: { mode: 'tokenMax' },
      })
      expect(amount.toBigNumber('none')).to.deep.equal(new BigNumber(10e-18))
    })

    it('should get the Amount as a BigNumber in tokenMax precision', () => {
      const amount = new Amount({
        amount: TEN,
        precision: { mode: 'none' },
      })
      expect(amount.toBigNumber('tokenMax')).to.deep.equal(new BigNumber(10e18))
    })
  })

  describe('getTokenMaxDecimals', function () {
    it('should return the token precision (decimals)', () => {
      const amount = new Amount({
        amount: TEN,
        precision: { mode: 'none', tokenMaxDecimals: 6 },
      })
      expect(amount.getTokenMaxDecimals()).to.deep.equal(6)
    })
  })
})
