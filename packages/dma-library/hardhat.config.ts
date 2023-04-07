import 'tsconfig-paths/register'

import * as dotenv from 'dotenv'
import { HardhatUserConfig } from 'hardhat/config'
import * as path from 'path'
import * as process from 'process'

import '@nomiclabs/hardhat-etherscan'
import '@nomiclabs/hardhat-waffle'
import 'hardhat-gas-reporter'
import 'solidity-coverage'
import 'solidity-docgen'
import 'hardhat-tracer'

dotenv.config({ path: path.join(__dirname, '../../.env') })

const blockNumber = process.env.BLOCK_NUMBER
if (!blockNumber) {
  throw new Error(`You must provide a block number.`)
}

if (!/^\d+$/.test(blockNumber)) {
  throw new Error(`Provide a valid block number. Provided value is ${blockNumber}`)
}

console.log(`Forking from block number: ${blockNumber}`)

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.8.15',
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
      chainId: 2137,
    },
    hardhat: {
      forking: {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        url: process.env.MAINNET_URL!,
        blockNumber: parseInt(blockNumber),
      },
      chainId: 2137,
      mining: {
        auto: true,
      },
      hardfork: 'london',
      gas: 'auto',
      initialBaseFeePerGas: 1000000000,
      allowUnlimitedContractSize: true,
    },
    goerli: {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      url: process.env.GOERLI_URL!,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      accounts: [process.env.PRIV_KEY_GOERLI!],
      // gasPrice: 5000000000,
      initialBaseFeePerGas: 1000000000,
    },
    mainnet: {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      url: process.env.MAINNET_URL!,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      accounts: [process.env.PRIV_KEY_MAINNET!],
      gasPrice: 50000000000,
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === '1',
    currency: 'USD',
  },
  paths: {
    sources: './dma-contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
  mocha: {
    timeout: 600000,
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
}

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString()
}

export default config
