import { DEFAULT_FEE, NO_FEE } from '@dma-common/constants'
import { feeResolver } from '@dma-library/utils/swap'
import { isCorrelatedPosition } from '@dma-library/utils/swap/fee-resolver'
import BigNumber from 'bignumber.js'
import { assert } from 'chai'

describe('feeResolver', function () {
  it('should return DEFAULT_FEE if isEntrySwap flag is set', function () {
    const fee = feeResolver('WSTETH', 'ETH', { isEntrySwap: true })
    assert(fee.isEqualTo(new BigNumber(DEFAULT_FEE)))
  })

  it('should return NO_FEE when decreasing risk and token pair are correlated', function () {
    const fee = feeResolver('WSTETH', 'ETH')
    assert(fee.isEqualTo(new BigNumber(NO_FEE)))
  })

  it('should return NO_FEE when increasing risk and token pair are correlated', function () {
    const fee = feeResolver('ETH', 'WSTETH', { isIncreasingRisk: true })
    assert(fee.isEqualTo(new BigNumber(NO_FEE)))
  })

  it('should return DEFAULT_FEE for all other cases', function () {
    const fee = feeResolver('ETH', 'USDC')
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
