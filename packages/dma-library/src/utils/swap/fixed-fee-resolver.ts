import { NULL_ADDRESS } from '@dma-common/constants'
import { SwapFeeType } from '@dma-library/types'
import BigNumber from 'bignumber.js'

import {
  type FixedFeePositionData,
  getFixedFeeForPosition,
} from '../fee-service/getFixedFeeForPosition'
import type { ResolvedFee } from './fee-resolver'

const debugEnabled = process.env.DEBUG === 'true'
const log = (...args: any[]) => {
  if (debugEnabled) {
    console.log(...args)
  }
}

export const fixedFeeResolver = async (
  positionData: FixedFeePositionData | undefined,
  isOpeningPosition?: boolean,
  isIncreasingRisk?: boolean,
): Promise<ResolvedFee> => {
  if (isOpeningPosition) {
    log('Fixed fee is zero when opening a new earn position')
    return {
      feeType: SwapFeeType.Fixed,
      feeToCharge: new BigNumber(0),
    }
  }

  if (isIncreasingRisk) {
    log('Fixed fee is zero when increasing risk')
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
  if (positionData.protocolId === undefined) {
    throw new Error('Protocol ID is required for earn multiply fee calculation')
  }
  const fixedFee = await getFixedFeeForPosition(positionData)
  const resolvedFee = {
    feeType: SwapFeeType.Fixed,
    feeToCharge: new BigNumber(fixedFee),
  }
  log('Fixed fee:', {
    feeToCharge: resolvedFee.feeToCharge.toString(),
    positionData,
    isOpeningPosition,
  })

  return resolvedFee
}
