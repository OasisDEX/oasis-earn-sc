import { AaveVersion } from '@dma-library/strategies'
import {
  AaveAdjustDependencies,
  AaveV2AdjustDependencies,
  AaveV3AdjustDependencies,
} from '@dma-library/strategies/aave/adjust/types'

export function isV2(
  dependencies: AaveAdjustDependencies,
): dependencies is AaveV2AdjustDependencies & {
  protocolVersion: AaveVersion.v2
} {
  return dependencies.protocol.version === AaveVersion.v2
}

export function isV3(
  dependencies: AaveAdjustDependencies,
): dependencies is AaveV3AdjustDependencies & {
  protocolVersion: AaveVersion.v3
} {
  return dependencies.protocol.version === AaveVersion.v3
}
