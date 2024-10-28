import { DEFAULT_FEE, LOW_CORRELATED_ASSET_FEE } from '@dma-common/constants'
import { SwapFeeType } from '@dma-library/types'
import { percentageFeeResolver } from '@dma-library/utils/swap'
import { isCorrelatedPosition } from '@dma-library/utils/swap/isCorrelatedPosition'
import BigNumber from 'bignumber.js'
import { assert, expect } from 'chai'

describe('feeResolver', function () {
  it('should return DEFAULT_FEE if isEntrySwap flag is set', function () {
    const { feeToCharge, feeType } = percentageFeeResolver('WSTETH', 'ETH', {
      isEntrySwap: true,
    })
    assert(feeToCharge.isEqualTo(new BigNumber(DEFAULT_FEE)))
    assert(feeType === SwapFeeType.Percentage)
  })
  it('should return LOW_CORRELATED_ASSET_FEE for DAI and SUSDE', function () {
    const { feeToCharge, feeType } = percentageFeeResolver('SUSDE', 'DAI', {
      isEntrySwap: false,
    })
    assert(feeToCharge.isEqualTo(new BigNumber(LOW_CORRELATED_ASSET_FEE)))
    assert(feeType === SwapFeeType.Percentage)
  })

  it('should throw when trying to take NO_FEE for correlated assets, take AUM fee instead', function () {
    const fail = () => percentageFeeResolver('WSTETH', 'ETH')
    expect(fail).to.throw('Cannot take NO_FEE for correlated assets')
  })

  it('should return DEFAULT_FEE for all other cases', function () {
    const { feeToCharge, feeType } = percentageFeeResolver('ETH', 'USDC', {} as any)
    assert(feeToCharge.isEqualTo(new BigNumber(DEFAULT_FEE)))
    assert(feeType === SwapFeeType.Percentage)
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
