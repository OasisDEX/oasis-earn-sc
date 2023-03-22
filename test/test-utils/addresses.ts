import { Network } from '@helpers/network'

import { mainnetAddresses } from '../addresses/mainnet'
import { optimismAddresses } from '../addresses/optimism'

export function addressesByNetwork(network: Network) {
  switch (network) {
    case Network.MAINNET:
      return mainnetAddresses
    case Network.OPT_MAINNET:
      return optimismAddresses
    default:
      throw new Error(`Network ${network} not supported`)
  }
}
