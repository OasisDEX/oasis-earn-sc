import { Network } from '@deploy-configurations/types/network'

export type ForkConfig = {
  nodeURL: string
  blockNumber: string
  chainID: number
}

export type ForkConfigMaybe = ForkConfig | undefined

function _validateForkNetwork(networkFork: Network | undefined) {
  if (
    networkFork &&
    (networkFork as string) !== '' &&
    !(
      networkFork == Network.MAINNET ||
      networkFork == Network.OPTIMISM ||
      networkFork == Network.ARBITRUM ||
      networkFork == Network.BASE ||
      networkFork == Network.LOCAL
    )
  ) {
    throw new Error(
      `NETWORK_FORK value not valid. Specify ${Network.MAINNET}, ${Network.OPTIMISM}, ${Network.ARBITRUM} or ${Network.BASE} or ${Network.LOCAL}`,
    )
  }
}

function _getForkedConfig(networkFork: Network | undefined): ForkConfigMaybe {
  _validateForkNetwork(networkFork)

  let forkConfig: ForkConfig | undefined = undefined

  switch (networkFork) {
    case Network.MAINNET:
      {
        if (!process.env.MAINNET_URL) {
          throw new Error(`You must provide MAINNET_URL value in the .env file`)
        }
        if (!process.env.BLOCK_NUMBER) {
          throw new Error(`You must provide a BLOCK_NUMBER value in the .env file.`)
        }

        forkConfig = {
          nodeURL: process.env.MAINNET_URL,
          blockNumber: process.env.BLOCK_NUMBER,
          chainID: 1,
        }
      }
      break
    case Network.OPTIMISM:
      {
        if (!process.env.OPTIMISM_URL) {
          throw new Error(`You must provide OPTIMISM_URL value in the .env file`)
        }
        if (!process.env.OPTIMISM_BLOCK_NUMBER) {
          throw new Error(`You must provide a OPTIMISM_BLOCK_NUMBER value in the .env file.`)
        }

        forkConfig = {
          nodeURL: process.env.OPTIMISM_URL,
          blockNumber: process.env.OPTIMISM_BLOCK_NUMBER,
          chainID: 10,
        }
      }
      break
    case Network.ARBITRUM:
      {
        if (!process.env.ARBITRUM_URL) {
          throw new Error(`You must provide ARBITRUM_URL value in the .env file`)
        }
        if (!process.env.ARBITRUM_BLOCK_NUMBER) {
          throw new Error(`You must provide a ARBITRUM_BLOCK_NUMBER value in the .env file.`)
        }

        forkConfig = {
          nodeURL: process.env.ARBITRUM_URL,
          blockNumber: process.env.ARBITRUM_BLOCK_NUMBER,
          chainID: 42161,
        }
      }
      break
    case Network.BASE:
      {
        if (!process.env.BASE_URL) {
          throw new Error(`You must provide BASE_URL value in the .env file`)
        }
        if (!process.env.BASE_BLOCK_NUMBER) {
          throw new Error(`You must provide a BASE_BLOCK_NUMBER value in the .env file.`)
        }

        forkConfig = {
          nodeURL: process.env.BASE_URL,
          blockNumber: process.env.BASE_BLOCK_NUMBER,
          chainID: 8453,
        }
      }
      break
    default:
      break
  }

  if (forkConfig && !/^\d+$/.test(forkConfig.blockNumber)) {
    throw new Error(`Provide a valid block number. Provided value is ${forkConfig.blockNumber}`)
  }

  return forkConfig
}

export function getForkedNetworkConfig(): ForkConfigMaybe {
  if (!process.env.NETWORK_FORK || process.env.NETWORK_FORK === '') {
    return undefined
  }

  const networkFork = process.env.NETWORK_FORK as Network | undefined

  const forkConfig: ForkConfigMaybe = _getForkedConfig(networkFork)

  if (forkConfig) {
    console.log(`Forking on ${networkFork}`)
    console.log(`Forking from block number: ${forkConfig && forkConfig.blockNumber}`)
    console.log(`Forking with ChainID ${forkConfig && forkConfig.chainID}`)
  }

  return forkConfig
}
