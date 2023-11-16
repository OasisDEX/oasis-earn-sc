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

import { HardhatUserConfig } from 'hardhat/config'

const config: HardhatUserConfig = {
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
    outDir: 'typechain/',
    externalArtifacts: ['deps/**/*.json'],
  },
}

export default config
