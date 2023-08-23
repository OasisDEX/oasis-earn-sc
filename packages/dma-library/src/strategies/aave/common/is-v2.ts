import { AaveVersion } from '@dma-library/types/aave'

export function isV2<
  GeneralDeps extends { protocol: { version: AaveVersion } } | { protocolVersion: AaveVersion },
  SpecificDeps extends GeneralDeps,
>(dependencies: GeneralDeps): dependencies is SpecificDeps {
  if ('protocolVersion' in dependencies) {
    return dependencies.protocolVersion === AaveVersion.v2
  }
  return dependencies.protocol.version === AaveVersion.v2
}
