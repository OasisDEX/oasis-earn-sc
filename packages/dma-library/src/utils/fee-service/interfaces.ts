import type { OasisPosition } from './types'

export interface IFeeManagerClient {
  GetPosition(proxyAddress: string): Promise<OasisPosition | undefined>
}
