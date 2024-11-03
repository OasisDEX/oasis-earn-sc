import { DEFAULT_FEE, LOW_CORRELATED_ASSET_FEE } from '@dma-common/constants'
import { SwapFeeType } from '@dma-library/types'
import { percentageFeeResolver } from '@dma-library/utils/swap'
import BigNumber from 'bignumber.js'
import { assert, expect } from 'chai'
import { config } from 'dotenv'
import path from 'path'

config({ path: path.join(__dirname, '../../../.env') })

describe('percentageFeeResolver', function () {
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
    expect(fail).to.throw('AUM fee is required for earn multiply correlated assets')
  })

  it('should return DEFAULT_FEE for all other cases', function () {
    const { feeToCharge, feeType } = percentageFeeResolver('ETH', 'USDC', {} as any)
    assert(feeToCharge.isEqualTo(new BigNumber(DEFAULT_FEE)))
    assert(feeType === SwapFeeType.Percentage)
  })
})
