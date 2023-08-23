import { AaveVersion } from '@dma-library/types/aave'

export function isV3<
  GeneralDeps extends { protocol: { version: AaveVersion } } | { protocolVersion: AaveVersion },
  SpecificDeps extends GeneralDeps,
>(dependencies: GeneralDeps): dependencies is SpecificDeps {
  if ('protocolVersion' in dependencies) {
    return dependencies.protocolVersion === AaveVersion.v3
  }
  return dependencies.protocol.version === AaveVersion.v3
}
