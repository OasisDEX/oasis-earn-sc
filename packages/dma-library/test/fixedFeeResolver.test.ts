import { Network } from '@deploy-configurations/types/network'
import { NULL_ADDRESS } from '@dma-common/constants'
import { SwapFeeType } from '@dma-library/types'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'

import { ProtocolId } from '../src/utils/fee-service/ProtocolId'
import { fixedFeeResolver } from '../src/utils/swap/fixed-fee-resolver'

describe('fixedFeeResolver', function () {
  it('should get zero fixed fee for aave when opening a new position', async function () {
    // AAVE
    const { feeToCharge, feeType } = await fixedFeeResolver(
      {
        network: Network.MAINNET,
        protocolId: ProtocolId.AAVE,
        proxyAddress: NULL_ADDRESS,
      },
      true,
    )
    expect(feeToCharge).instanceof(BigNumber)
    expect(feeToCharge.isZero()).equal(true)
    expect(feeType).equal(SwapFeeType.Fixed)
  })
  it('should get fixed fee for aave', async function () {
    const { feeToCharge, feeType } = await fixedFeeResolver({
      network: Network.MAINNET,
      protocolId: ProtocolId.AAVE,
      proxyAddress: '0x01083061ecc486f5d4b63f96f4f83641b6a6cdf0',
    })
    expect(feeToCharge).instanceof(BigNumber)
    expect(feeType).equal(SwapFeeType.Fixed)
  })

  // AAVE_V3
  it('should get zero fixed fee for aave v3 when opening a new position', async function () {
    const { feeToCharge, feeType } = await fixedFeeResolver(
      {
        network: Network.MAINNET,
        protocolId: ProtocolId.AAVE_V3,
        proxyAddress: NULL_ADDRESS,
      },
      true,
    )
    expect(feeToCharge).instanceof(BigNumber)
    expect(feeToCharge.isZero()).equal(true)
    expect(feeType).equal(SwapFeeType.Fixed)
  })

  it('should get fixed fee for aave v3', async function () {
    const { feeToCharge, feeType } = await fixedFeeResolver({
      network: Network.MAINNET,
      protocolId: ProtocolId.AAVE_V3,
      proxyAddress: '0x0febdaecc76737bac839bfba86ade8c3b0582dd3',
    })
    expect(feeToCharge).instanceof(BigNumber)
    expect(feeType).equal(SwapFeeType.Fixed)
  })

  // MORPHO_BLUE
  it('should get zero fixed fee for morpho when opening a new position', async function () {
    const { feeToCharge, feeType } = await fixedFeeResolver(
      {
        network: Network.MAINNET,
        protocolId: ProtocolId.MORPHO_BLUE,
        proxyAddress: NULL_ADDRESS,
        params: {
          marketId: '0xb8fc70e82bc5bb53e773626fcc6a23f7eefa036918d7ef216ecfb1950a94a85e',
        },
      },
      true,
    )
    expect(feeToCharge).instanceof(BigNumber)
    expect(feeToCharge.isZero()).equal(true)
    expect(feeType).equal(SwapFeeType.Fixed)
  })
  it('should get fixed fee for morpho', async function () {
    const { feeToCharge, feeType } = await fixedFeeResolver({
      network: Network.MAINNET,
      protocolId: ProtocolId.MORPHO_BLUE,
      proxyAddress: '0x12b57c0a3beb42a063a548c5df74e1ccbf55c910',
      params: {
        marketId: '0xb8fc70e82bc5bb53e773626fcc6a23f7eefa036918d7ef216ecfb1950a94a85e',
      },
    })
    expect(feeToCharge).instanceof(BigNumber)
    expect(feeType).equal(SwapFeeType.Fixed)
  })
})
