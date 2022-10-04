import '@nomiclabs/hardhat-etherscan'
import '@nomiclabs/hardhat-waffle'
import 'hardhat-gas-reporter'
import '@typechain/hardhat'
import 'solidity-coverage'
import './tasks/deploy'
import './tasks/createPosition'
import './tasks/closePosition'
import './tasks/proxy'

import { default as dotenv } from 'dotenv'
import { HardhatUserConfig, task } from 'hardhat/config'

dotenv.config()

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners()

  for (const account of accounts) {
    console.log(account.address)
  }
})

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
        runs: 300,
      },
    },
  },
  networks: {
    local: {
      url: 'http://127.0.0.1:8545',
      timeout: 100000,
      chainId: 2137,
    },
    hardhat: {
      forking: {
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
    // goerli: {
    //   url: process.env.ALCHEMY_NODE_GOERLI!,ib
    //   accounts: [process.env.PRIV_KEY_GOERLI!],
    //   // gasPrice: 5000000000,
    //   initialBaseFeePerGas: 1000000000,
    // }
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
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
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  typechain: {
    outDir: 'typechain',
  }
}

export default config
