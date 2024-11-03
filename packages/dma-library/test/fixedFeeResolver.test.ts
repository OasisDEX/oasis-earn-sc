import { Network } from '@deploy-configurations/types/network'
import { SwapFeeType } from '@dma-library/types'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'

import { ProtocolId } from '../src/utils/fee-service/ProtocolId'
import { fixedFeeResolver } from '../src/utils/swap/fixed-fee-resolver'

describe('fixedFeeResolver', function () {
  it('should get fixed fee for aave', async function () {
    const { feeToCharge, feeType } = await fixedFeeResolver({
      network: Network.MAINNET,
      protocolId: ProtocolId.AAVE_V3,
      proxyAddress: '0x00dae344e4b63187621f487bc6b786273f38a36a',
    })
    expect(feeToCharge).instanceof(BigNumber)
    expect(feeType).equal(SwapFeeType.Fixed)
  })
})
