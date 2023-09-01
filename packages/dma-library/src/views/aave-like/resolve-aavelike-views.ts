import { AaveLikeProtocol } from '@dma-library/types/protocol'
import { resolveProtocolKeyConfig } from '@dma-library/utils/aave-like'
import { views } from '@dma-library/views'
import { AaveView } from '@dma-library/views/aave'
import { SparkGetCurrentPosition } from '@dma-library/views/spark'

export function isAaveView(view: AaveView | SparkGetCurrentPosition): view is AaveView {
  return view && ('v2' in view || 'v3' in view)
}

export function resolveAavelikeViews(protocolType: AaveLikeProtocol) {
  const { protocol, version } = resolveProtocolKeyConfig(protocolType)

  if (protocol === 'aave' && !version) {
    throw new Error('Must specify version for Aave protocol')
  }

  const view = views[protocol]
  return { view, version }
}
