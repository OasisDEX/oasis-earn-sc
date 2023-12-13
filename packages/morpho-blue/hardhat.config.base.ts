import './bootstrap-env'
import 'tsconfig-paths/register'
import '@nomiclabs/hardhat-etherscan'
import '@nomiclabs/hardhat-waffle'
import 'hardhat-gas-reporter'
import '@typechain/hardhat'
import 'solidity-coverage'
import 'solidity-docgen'
import 'hardhat-tracer'
import 'hardhat-abi-exporter'

import * as tdly from '@tenderly/hardhat-tenderly'

tdly.setup({ automaticVerifications: true })

const config = {
  networks: {
    hardhat: {
      mining: {
        auto: true,
        interval: 2000,
      },
      hardfork: 'shanghai',
      gas: 'auto',
    },
    goerli: {
      url: process.env.GOERLI_URL || '',
    },
    tenderly: {
      url: process.env.TENDERLY_FORK_URL ?? '',
      chainId: Number(process.env.TENDERLY_FORK_CHAIN_ID ?? 1),
    },
  },
  solidity: {
    version: '0.8.19',
    settings: {
      optimizer: {
        enabled: true,
        runs: 4294967295,
      },
      viaIR: true,
    },
  },
  typechain: {
    outDir: 'typechain',
    externalArtifacts: ['deps/**/*.json'],
  },
  tenderly: {
    username: 'oazoapps', // tenderly username (or organization name)
    project: process.env.TENDERLY_PROJECT ?? '', // project name
    privateVerification: true, // if true, contracts will be verified privately, if false, contracts will be verified publicly
    deploymentsDir: 'artifacts',
  },
}

export default config
