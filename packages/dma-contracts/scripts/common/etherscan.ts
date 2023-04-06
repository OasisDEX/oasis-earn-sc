import { Network } from '@oasisdex/dma-common/utils/network'

export function etherscanAPIUrl(network: string) {
  return network === Network.MAINNET
    ? 'https://api.etherscan.io/api'
    : `https://api-${network}.etherscan.io/api`
}
