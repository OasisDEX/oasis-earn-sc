import type { OasisPosition } from './types'

export interface IFeeManagerClient {
  GetPosition(params: {
    proxyAddress: string
    marketId?: string
  }): Promise<OasisPosition | undefined>
}
