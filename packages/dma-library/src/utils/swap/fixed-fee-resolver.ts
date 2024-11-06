import type { Network } from '@deploy-configurations/types/network'
import { NULL_ADDRESS } from '@dma-common/constants'
import { SwapFeeType } from '@dma-library/types'
import BigNumber from 'bignumber.js'

import { getEarnMultiplyFee } from '../fee-service/getEarnMultiplyFee'
import type { ProtocolId } from '../fee-service/ProtocolId'

export const fixedFeeResolver = async (
  positionData:
    | {
        network: Network
        protocolId: ProtocolId
        proxyAddress: string
      }
    | undefined,
  isOpeningPosition?: boolean,
): Promise<{
  feeType: SwapFeeType
  feeToCharge: BigNumber
}> => {
  if (isOpeningPosition) {
    return {
      feeType: SwapFeeType.Fixed,
      feeToCharge: new BigNumber(0),
    }
  }

  if (positionData === undefined) {
    throw new Error('Position data is required for earn multiply fee calculation')
  }
  if (positionData.proxyAddress === NULL_ADDRESS) {
    throw new Error(
      `Proxy address is zero so if you're trying to open a new position, you should set isOpeningPosition to true when calculating a fee`,
    )
  }

  return {
    feeType: SwapFeeType.Fixed,
    feeToCharge: new BigNumber(await getEarnMultiplyFee(positionData)),
  }
}
