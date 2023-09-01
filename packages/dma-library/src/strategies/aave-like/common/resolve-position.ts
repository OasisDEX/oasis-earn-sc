import * as StrategyParams from '@dma-library/types/strategy-params'
import { isAaveView, resolveAavelikeViews } from '@dma-library/views/aave-like'

/**
 * Resolves the current position for the given protocol version
 * Used on open to account for dust issues when reopening a position
 * With same proxy
 */
export async function resolveCurrentPositionForProtocol(
  args: StrategyParams.WithAaveLikeStrategyArgs,
  dependencies: Omit<StrategyParams.WithAaveLikeStrategyDependencies, 'currentPosition'>,
) {
  const { view, version } = resolveAavelikeViews(dependencies.protocolType)

  if (isAaveView(view)) {
    if (!version) throw new Error('Version must be defined when using Aave view')
    return await view[version]({ ...args, proxy: dependencies.proxy }, { ...dependencies })
  }
  return await view({ ...args, proxy: dependencies.proxy }, { ...dependencies })
}
