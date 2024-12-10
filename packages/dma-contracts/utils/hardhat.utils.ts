import { Network } from '@deploy-configurations/types/network'

export type ForkConfig = {
  nodeURL: string
  blockNumber: string
  chainID: number
}

function _validateForkNetwork(networkFork: string | undefined) {
  if (
    typeof networkFork !== 'string' ||
    Object.values(Network).every(networkName => networkName !== networkFork)
  ) {
    throw new Error(
      `NETWORK_FORK value not supported. Specify one of ${Object.values(Network).join(', ')}`,
    )
  }
  return networkFork as Network
}

export function getForkConfigFromEnv(): ForkConfig {
  if (!process.env.NETWORK_FORK) {
    throw new Error(`NETWORK_FORK env variable not set`)
  }

  const networkFork = _validateForkNetwork(process.env.NETWORK_FORK)

  const forkConfig: ForkConfig = _getForkedConfig(networkFork)

  if (forkConfig) {
    console.log(`Forking on ${networkFork}`)
    console.log(`Forking from block number: ${forkConfig && forkConfig.blockNumber}`)
    console.log(`Forking with ChainID ${forkConfig && forkConfig.chainID}`)
  }

  return forkConfig
}

function _getForkedConfig(networkFork: Network): ForkConfig {
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
      throw new Error(`NETWORK_FORK value not supported: ${networkFork}`)
  }

  if (forkConfig && !/^\d+$/.test(forkConfig.blockNumber)) {
    throw new Error(`Provide a valid block number. Provided value is ${forkConfig.blockNumber}`)
  }

  return forkConfig
}
