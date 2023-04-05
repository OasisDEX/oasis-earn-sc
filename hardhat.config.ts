import 'tsconfig-paths/register'
import '@nomiclabs/hardhat-etherscan'
import '@nomiclabs/hardhat-waffle'
import 'hardhat-gas-reporter'
import '@typechain/hardhat'
import 'solidity-coverage'
import './tasks/deploy'
import './tasks/createPosition'
import './tasks/createAaveV3L1Position'
import './tasks/closePosition'
import './tasks/proxy'
import './tasks/verify-earn'
import './tasks/transfer-erc20'
import './tasks/getTokens'
import './tasks/readErc20Balance'
import 'solidity-docgen'
import 'hardhat-tracer'
import 'hardhat-abi-exporter'
import './tasks/userDpmProxies'
import './tasks/createMultiplyPosition'
import './tasks/transferDPM'
import './tasks/transferAllProxies'

import { ChainIdByNetwork, Network } from '@helpers/network'
import { default as dotenv } from 'dotenv'
import { HardhatUserConfig, task } from 'hardhat/config'
import path from 'path'
import process from 'process'

dotenv.config({ path: path.join(__dirname, './.env') })

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners()

  for (const account of accounts) {
    console.log(account.address)
  }
})
const networkFork = process.env.NETWORK_FORK as Network | undefined

if (!networkFork || !(networkFork == Network.MAINNET || networkFork == Network.OPT_MAINNET)) {
  throw new Error(`NETWORK_FORK Missing. Specify ${Network.MAINNET} or ${Network.OPT_MAINNET}`)
}

let forkConfig: { nodeURL: string; blockNumber: string } | undefined = undefined

if (networkFork == Network.MAINNET) {
  const nodeURL = process.env.MAINNET_URL

  if (!nodeURL) {
    throw new Error(`You must provide MAINNET_URL value in the .env file`)
  }

  const blockNumber = process.env.BLOCK_NUMBER
  if (!blockNumber) {
    throw new Error(`You must provide a BLOCK_NUMBER value in the .env file.`)
  }

  forkConfig = {
    nodeURL,
    blockNumber,
  }
}

if (networkFork == Network.OPT_MAINNET) {
  const nodeURL = process.env.OPTIMISM_URL

  if (!nodeURL) {
    throw new Error(`You must provide OPTIMISM_URL value in the .env file`)
  }

  const blockNumber = process.env.OPTIMISM_BLOCK_NUMBER

  if (!blockNumber) {
    throw new Error(`You must provide a OPTIMISM_BLOCK_NUMBER value in the .env file.`)
  }
  forkConfig = {
    nodeURL,
    blockNumber,
  }
}

if (forkConfig && !/^\d+$/.test(forkConfig.blockNumber)) {
  throw new Error(`Provide a valid block number. Provided value is ${forkConfig.blockNumber}`)
}

console.log(`Forking on ${networkFork}`)
console.log(`Forking from block number: ${forkConfig && forkConfig.blockNumber}`)

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const includeMainnet = !!process.env.MAINNET_URL && !!process.env.PRIV_KEY_MAINNET
const includeGoerli = !!process.env.GOERLI_URL && !!process.env.PRIV_KEY_GOERLI
const includeOptimism = !!process.env.OPTIMISM_URL && !!process.env.PRIV_KEY_OPTIMISM

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.4.24',
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
      {
        version: '0.5.17',
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
      {
        version: '0.8.15',
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
    ],
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
  networks: {
    local: {
      url: 'http://127.0.0.1:8545',
      timeout: 1000000,
      chainId: ChainIdByNetwork[Network.LOCAL],
    },
    hardhat: {
      forking: {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        url: forkConfig ? forkConfig.nodeURL : 'http://127.0.0.1:8545',
        blockNumber: forkConfig ? parseInt(forkConfig.blockNumber) : 0,
      },
      chainId: ChainIdByNetwork[Network.LOCAL],
      mining: {
        auto: true,
      },
      hardfork: 'london',
      gas: 'auto',
      initialBaseFeePerGas: 1000000000,
      allowUnlimitedContractSize: true,
    },
    ...(includeGoerli
      ? {
          goerli: {
            url: process.env.GOERLI_URL || '',
            accounts: [process.env.PRIV_KEY_GOERLI || '', process.env.PRIV_KEY_GOERLI_GNOSIS || ''],
            initialBaseFeePerGas: 1000000000,
          },
        }
      : {}),
    ...(includeMainnet
      ? {
          mainnet: {
            url: process.env.MAINNET_URL || '',
            accounts: [process.env.PRIV_KEY_MAINNET || ''],
            gasPrice: 50000000000,
          },
        }
      : {}),
    ...(includeOptimism
      ? {
          optimism: {
            url: process.env.OPTIMISM_URL || '',
            accounts: [process.env.PRIV_KEY_OPTIMISM || ''],
            initialBaseFeePerGas: 1000000000,
          },
        }
      : {}),
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === '1',
    currency: 'USD',
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
  mocha: {
    timeout: 600000,
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY || '',
      optimisticEthereum: process.env.OPTIMISM_ETHERSCAN_API_KEY || '',
    },
  },
  typechain: {
    outDir: 'typechain',
    externalArtifacts: ['abi/external/**/*.json'],
  },
  docgen: {
    outputDir: './docs',
    pages: 'files',
    exclude: [
      './actions/maker',
      './core/constants',
      './core/types',
      './core/views',
      './interfaces',
      './libs',
      './test',
    ],
  },
  abiExporter: {
    path: './abi/generated',
    runOnCompile: true,
    clear: true,
    flat: false,
    spacing: 2,
    pretty: false,
  },
}

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString()
}

export default config
