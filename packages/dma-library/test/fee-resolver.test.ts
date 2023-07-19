import { DEFAULT_FEE, HIGH_MULTIPLE_FEE, NO_FEE } from '@dma-common/constants'
import { feeResolver } from '@dma-library/utils/swap'
import { isCorrelatedPosition } from '@dma-library/utils/swap/fee-resolver'
import BigNumber from 'bignumber.js'
import { assert } from 'chai'

describe('feeResolver', function () {
  it('should return DEFAULT_FEE if isEntrySwap flag is set', function () {
    const fee = feeResolver('WSTETH', 'ETH', { isEntrySwap: true })
    assert(fee.isEqualTo(new BigNumber(DEFAULT_FEE)))
  })

  it('should return HIGH_MULTIPLE_FEE if fromToken is WSTETH, toToken is ETH and isIncreasingRisk flag is not set', function () {
    const fee = feeResolver('WSTETH', 'ETH')
    assert(fee.isEqualTo(new BigNumber(HIGH_MULTIPLE_FEE)))
  })

  it('should return NO_FEE if isIncreasingRisk and isEarnPosition flags are set', function () {
    const fee = feeResolver('ETH', 'WSTETH', { isIncreasingRisk: true, isEarnPosition: true })
    assert(fee.isEqualTo(new BigNumber(NO_FEE)))
  })

  it('should return DEFAULT_FEE for all other cases', function () {
    const fee = feeResolver('ETH', 'WSTETH')
    assert(fee.isEqualTo(new BigNumber(DEFAULT_FEE)))
  })
})

describe('isCorrelatedPosition', function () {
  it('should return true for symbols in the same set', function () {
    assert.isTrue(isCorrelatedPosition('WSTETH', 'ETH'))
    assert.isTrue(isCorrelatedPosition('ETH', 'RETH'))
    assert.isTrue(isCorrelatedPosition('CBETH', 'STETH'))
  })

  it('should return false for symbols not in the same set', function () {
    assert.isFalse(isCorrelatedPosition('WSTETH', 'USDT')) // assuming 'USDT' is not in the matrix
    assert.isFalse(isCorrelatedPosition('ETH', 'BTC')) // assuming 'BTC' is not in the matrix
  })

  it('should return false for symbols in different sets', function () {
    // assuming 'USDT' and 'BTC' are each in different rows of the matrix
    assert.isFalse(isCorrelatedPosition('USDT', 'BTC'))
  })
})
