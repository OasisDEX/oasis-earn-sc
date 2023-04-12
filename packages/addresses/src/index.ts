// import _ from 'lodash'
//
// import AAVE_ADDRESSES from './aave.json'
// import COMMON_ADDRESSES from './common.json'
// import MAKER_ADDRESSES from './maker.json'
//
// // TODO: feeRecipient copied and pasted from mainnet to optimism
// export const ADDRESSES = _.merge(AAVE_ADDRESSES, COMMON_ADDRESSES, MAKER_ADDRESSES)

import { config as goerliConfig } from '@oasisdex/dma-deployments/configs/goerli.conf'
import { config as mainnetConfig } from '@oasisdex/dma-deployments/configs/mainnet.conf'
import { config as optimismConfig } from '@oasisdex/dma-deployments/configs/optimism.conf'
import { Network } from '@oasisdex/dma-common/utils/network'

export type Addresses = Record<Network, Record<any, any>>

export const ADDRESSES: Addresses = {
  [Network.GOERLI]: goerliConfig,
  [Network.MAINNET]: mainnetConfig,
  [Network.OPT_MAINNET]: optimismConfig,
}
