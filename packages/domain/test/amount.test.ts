import { ONE, TEN, ZERO } from '@dma-common/constants'
import { Amount } from '@domain/amount'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'

describe('Amount Class | Unit', () => {
  describe('precision switching', () => {
    it('should switch precision from normal to max', () => {
      const tokenPrecision = 6
      const normalPrecision = 0
      const amount = new Amount(ONE, 'normal', tokenPrecision)
      amount.switchPrecisionMode('max')
      const precisionDiff = TEN.pow(tokenPrecision - normalPrecision)
      expect(amount.toBigNumber()).to.deep.equal(precisionDiff)
    })
    it('should switch precision from max to normalized', () => {
      const normalizedPrecision = 18
      const tokenPrecision = 6
      const amount = new Amount(ONE, 'max', tokenPrecision)
      amount.switchPrecisionMode('normalized')
      const precisionDiff = TEN.pow(normalizedPrecision - tokenPrecision)
      expect(amount.toBigNumber()).to.deep.equal(precisionDiff)
    })
    it('should switch precision from normalized to normal', () => {
      const normalizedPrecision = 18
      const tokenPrecision = 6
      const normalPrecision = 0
      const amount = new Amount(ONE, 'normalized', tokenPrecision)
      amount.switchPrecisionMode('normal')
      const precisionDiff = TEN.pow(normalPrecision - normalizedPrecision)
      expect(amount.toBigNumber()).to.deep.equal(precisionDiff)
    })
    it('should switch precision from normalized to max', () => {
      const normalizedPrecision = 18
      const tokenPrecision = 6
      const amount = new Amount(ONE, 'normalized', tokenPrecision)
      amount.switchPrecisionMode('max')
      const precisionDiff = TEN.pow(tokenPrecision - normalizedPrecision)
      expect(amount.toBigNumber()).to.deep.equal(precisionDiff)
    })
  })
  describe('addition', function () {
    it('should add amounts in same precision mode', () => {
      const amount1 = new Amount(new BigNumber(10), 'normal')
      const amount2 = new Amount(new BigNumber(5), 'normal')
      amount1.plus(amount2)
      expect(amount1.toBigNumber()).to.deep.equal(new BigNumber(15))
    })

    it('should add max amount to normal amount', () => {
      const tokenPrecision = 6
      const amount1 = new Amount(new BigNumber(ONE), 'normal', tokenPrecision)
      const amount2 = new Amount(new BigNumber(5e5), 'max', tokenPrecision)
      amount1.plus(amount2)
      expect(amount1.toBigNumber()).to.deep.equal(new BigNumber(1.5))
    })

    it('should add nax amount to normalized amount', () => {
      const tokenPrecision = 6
      const amount1 = new Amount(new BigNumber(1e12), 'normalized', tokenPrecision)
      const amount2 = new Amount(new BigNumber(1), 'max', tokenPrecision)
      amount1.plus(amount2)
      expect(amount1.toBigNumber()).to.deep.equal(new BigNumber(2e12))
    })

    it('should add BigNumber to Amount', () => {
      const tokenPrecision = 6
      const amount = new Amount(new BigNumber(1e12), 'normalized', tokenPrecision)
      const amountAsBigNumber = new BigNumber(1e10)
      amount.plus(amountAsBigNumber)
      expect(amount.toBigNumber()).to.deep.equal(new BigNumber(1.01e12))
    })

    it('should throw an error when adding incompatible amounts', () => {
      const token1Precision = 18
      const token2Precision = 6
      const amount1 = new Amount(new BigNumber('1e12'), 'max', token1Precision)
      const amount2 = new Amount(new BigNumber(ONE), 'max', token2Precision)
      expect(() => amount1.plus(amount2)).to.throw()
    })
  })
  describe('subtraction', function () {
    it('should subtract amounts in same precision mode', () => {
      const amount1 = new Amount(new BigNumber(10), 'normal')
      const amount2 = new Amount(new BigNumber(5), 'normal')
      amount1.minus(amount2)
      expect(amount1.toBigNumber()).to.deep.equal(new BigNumber(5))
    })

    it('should subtract max amount to normal amount', () => {
      const tokenPrecision = 6
      const amount1 = new Amount(new BigNumber(ONE), 'normal', tokenPrecision)
      const amount2 = new Amount(new BigNumber(5e5), 'max', tokenPrecision)
      amount1.minus(amount2)
      expect(amount1.toBigNumber()).to.deep.equal(new BigNumber(0.5))
    })

    it('should add nax amount to normalized amount', () => {
      const tokenPrecision = 6
      const amount1 = new Amount(new BigNumber(1e12), 'normalized', tokenPrecision)
      const amount2 = new Amount(new BigNumber(1), 'max', tokenPrecision)
      amount1.minus(amount2)
      expect(amount1.toBigNumber()).to.deep.equal(ZERO)
    })

    it('should subtract BigNumber from Amount', () => {
      const tokenPrecision = 6
      const amount = new Amount(new BigNumber(1e12), 'normalized', tokenPrecision)
      const amountAsBigNumber = new BigNumber(1e10)
      amount.minus(amountAsBigNumber)
      expect(amount.toBigNumber()).to.deep.equal(new BigNumber(9.9e11))
    })

    it('should throw an error when adding incompatible amounts', () => {
      const token1Precision = 18
      const token2Precision = 6
      const amount1 = new Amount(new BigNumber('1e12'), 'max', token1Precision)
      const amount2 = new Amount(new BigNumber(ONE), 'max', token2Precision)
      expect(() => amount1.minus(amount2)).to.throw()
    })
  })
  describe('multiplication', function () {
    it('should multiply amounts in same precision mode', () => {
      const amount1 = new Amount(new BigNumber(10), 'normal')
      const amount2 = new Amount(new BigNumber(5), 'normal')
      amount1.times(amount2)
      expect(amount1.toBigNumber()).to.deep.equal(new BigNumber(50))
    })

    it('should multiply max amount to normal amount', () => {
      const tokenPrecision = 6
      const amount1 = new Amount(new BigNumber(ONE), 'normal', tokenPrecision)
      const amount2 = new Amount(new BigNumber(5e5), 'max', tokenPrecision)
      amount1.times(amount2)
      expect(amount1.toBigNumber()).to.deep.equal(new BigNumber(0.5))
    })

    it('should multiply max amount to normalized amount', () => {
      const tokenPrecision = 6
      const amount1 = new Amount(new BigNumber(1e12), 'normalized', tokenPrecision)
      const amount2 = new Amount(new BigNumber(2), 'max', tokenPrecision)
      amount1.times(amount2)
      expect(amount1.toBigNumber()).to.deep.equal(new BigNumber(2e6))
    })

    it('should multiply Amount by BigNumber', () => {
      const tokenPrecision = 6
      const amount = new Amount(new BigNumber(1e12), 'normalized', tokenPrecision)
      const amountAsBigNumber = new BigNumber(1e10)
      amount.times(amountAsBigNumber)
      expect(amount.toBigNumber()).to.deep.equal(new BigNumber(1e22))
    })

    it('should throw an error when adding incompatible amounts', () => {
      const token1Precision = 18
      const token2Precision = 6
      const amount1 = new Amount(new BigNumber('1e12'), 'max', token1Precision)
      const amount2 = new Amount(new BigNumber(ONE), 'max', token2Precision)
      expect(() => amount1.times(amount2)).to.throw()
    })
  })
  describe('division', function () {
    it('should divide amounts in same precision mode', () => {
      const amount1 = new Amount(new BigNumber(10), 'normal')
      const amount2 = new Amount(new BigNumber(5), 'normal')
      amount1.div(amount2)
      expect(amount1.toBigNumber()).to.deep.equal(new BigNumber(2))
    })

    it('should divide normal amount by max amount', () => {
      const tokenPrecision = 6
      const amount1 = new Amount(new BigNumber(ONE), 'normal', tokenPrecision)
      const amount2 = new Amount(new BigNumber(5e5), 'max', tokenPrecision)
      amount1.div(amount2)
      expect(amount1.toBigNumber()).to.deep.equal(new BigNumber(2))
    })

    it('should divide max amount to normalized amount', () => {
      const tokenPrecision = 6
      const amount1 = new Amount(new BigNumber(1e12), 'normalized', tokenPrecision)
      const amount2 = new Amount(new BigNumber(2), 'max', tokenPrecision)
      amount1.div(amount2)
      expect(amount1.toBigNumber()).to.deep.equal(new BigNumber(0.5))
    })

    it('should divide Amount by BigNumber', () => {
      const tokenPrecision = 6
      const amount = new Amount(new BigNumber(1e12), 'normalized', tokenPrecision)
      const amountAsBigNumber = new BigNumber(2e10)
      amount.dividedBy(amountAsBigNumber)
      expect(amount.toBigNumber()).to.deep.equal(new BigNumber(50))
    })

    it('should throw an error when adding incompatible amounts', () => {
      const token1Precision = 18
      const token2Precision = 6
      const amount1 = new Amount(new BigNumber('1e12'), 'max', token1Precision)
      const amount2 = new Amount(new BigNumber(ONE), 'max', token2Precision)
      expect(() => amount1.div(amount2)).to.throw()
    })
  })
  describe('toBigNumberInPrecision', function () {
    it('should get the raw amount in normal precision', () => {
      const amount = new Amount(new BigNumber(10), 'max')
      expect(amount.toBigNumber('normal')).to.deep.equal(new BigNumber(10e-18))
    })

    it('should get the raw amount in max precision', () => {
      const amount = new Amount(new BigNumber(10), 'normal')
      expect(amount.toBigNumber('max')).to.deep.equal(new BigNumber(10e18))
    })
  })

  describe('getTokenPrecision', function () {
    it('should return the token precision', () => {
      const amount = new Amount(new BigNumber(10), 'normal', 6)
      expect(amount.getTokenPrecision()).to.deep.equal(6)
    })
  })
})
