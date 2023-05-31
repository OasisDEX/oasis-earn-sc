import { AjnaPositions, PositionDetails } from '@dma-contracts/test/fixtures'
import { ethUsdcMultiplyAjnaPosition } from './eth-usdc-multiply'

export const ajnaFactories: Record<AjnaPositions, (...args: any[]) => Promise<PositionDetails>> = {
  [ethUsdcMultiplyAjnaPosition.positionName]: ethUsdcMultiplyAjnaPosition,
}
