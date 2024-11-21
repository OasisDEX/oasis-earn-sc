import { isCorrelatedPosition } from '@dma-library/utils/swap/isCorrelatedPosition'
import { assert } from 'chai'

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
