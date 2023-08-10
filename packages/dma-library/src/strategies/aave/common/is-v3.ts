import { AaveVersion } from '@dma-library/strategies'

export function isV3<
  GeneralDeps extends { protocol: { version: AaveVersion } },
  SpecificDeps extends GeneralDeps,
>(dependencies: GeneralDeps): dependencies is SpecificDeps {
  return dependencies.protocol.version === AaveVersion.v3
}
