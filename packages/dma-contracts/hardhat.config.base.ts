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

import { Network } from '@deploy-configurations/types/network'
import * as tdly from '@tenderly/hardhat-tenderly'
import * as process from 'process'

import { ChainIdByNetwork } from '../deploy-configurations/utils/network'
import { filterConsole, getForkedNetworkConfig } from './utils'

// Remove the annoying duplicate definition warning from Ethers.js. In version 6 this should already be
// removed, but it seems that our Hardhat version is still using Ethers.js 5.
filterConsole(['duplicate definition -'], { methods: ['log'] })

tdly.setup()

const forkConfig = getForkedNetworkConfig()

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const includeMainnet = !!process.env.MAINNET_URL && !!process.env.PRIV_KEY_MAINNET
const includeGoerli = !!process.env.GOERLI_URL && !!process.env.PRIV_KEY_GOERLI
const includeOptimism = !!process.env.OPTIMISM_URL && !!process.env.PRIV_KEY_OPTIMISM
const includeArbitrum = !!process.env.ARBITRUM_URL && !!process.env.PRIV_KEY_ARBITRUM
const includeBase = !!process.env.BASE_URL && !!process.env.PRIV_KEY_BASE

const config = {
  solidity: {
    compilers: [
      {
        version: '0.4.21',
        settings: {
          optimizer: {
            enabled: true,
            runs: 0,
          },
        },
      },
      {
        version: '0.4.24',
        settings: {
          optimizer: {
            enabled: true,
            runs: 0,
          },
        },
      },
      {
        version: '0.5.17',
        settings: {
          optimizer: {
            enabled: true,
            runs: 0,
          },
        },
      },
      {
        version: '0.8.18',
        settings: {
          optimizer: {
            enabled: true,
            runs: 0,
          },
        },
      },
      {
        version: '0.8.19',
        settings: {
          optimizer: {
            enabled: true,
            runs: 0,
          },
        },
      },
      {
        version: '0.8.15',
        settings: {
          optimizer: {
            enabled: true,
            runs: 0,
          },
        },
      },
    ],
    settings: {
      optimizer: {
        enabled: true,
        runs: 0,
      },
    },
  },
  networks: {
    tenderly: {
      url: 'https://rpc.tenderly.co/fork/6629361a-f4a9-48c9-9bf4-0a83da275a7c',
      accounts: [
        '0xe4966abd3595e37f1d9313616d9a833fdbde301f70b61eb17cb7e919ca0addd8',
        '0x8a78506679446be6dc846c7dddbbee4b5f0ae725caa50126739e0851d66a29c8',
        '0x284e6f4bc08734aacbd59772662216e288d01a689610c105a5ed8e8defc4425d',
        '0xd7af053f5710feb0718095bd5f403b4e6db3625bf572bb1fcae19a84f0faa71a',
        '0xa15ee68c2bd73743cd1a54ac95215bc79cfaa164460fcb907759459ef15d0a99',
        '0xd90167141d1bef8a39da4a62673cc18e0a9dd31e25ab47695564fe79d6555cac',
        '0x3386f570f1af049a61a551efd5cbe9d0070d7eb79ec70c5436e89cdc0ec8548d',
        '0xc14983f5efd216aa3d0ded41f6469774942aa5c2d89f4c9da83229cd45834189',
        '0x467d25134b5539cf5788eab218fbed1dba640bcd5c8562a94f191cc5992de20b',
        '0x8fc5a92c787ae1a4183f1cc5ace40c459d07457c932fc368bdc4b215ad31832a',
        '0x573950c5ca81624e315ad243c6af1b9eb6e32f4f2f45f6f26669ed0b209b6746',
      ],
    },
    local: {
      url: 'http://127.0.0.1:8545',
      timeout: 1000000,
      chainId: ChainIdByNetwork[Network.LOCAL],
      // accounts: [
      //   '0xe4966abd3595e37f1d9313616d9a833fdbde301f70b61eb17cb7e919ca0addd8',
      //   '0x8a78506679446be6dc846c7dddbbee4b5f0ae725caa50126739e0851d66a29c8',
      //   '0x284e6f4bc08734aacbd59772662216e288d01a689610c105a5ed8e8defc4425d',
      //   '0xd7af053f5710feb0718095bd5f403b4e6db3625bf572bb1fcae19a84f0faa71a',
      //   '0xa15ee68c2bd73743cd1a54ac95215bc79cfaa164460fcb907759459ef15d0a99',
      //   '0xd90167141d1bef8a39da4a62673cc18e0a9dd31e25ab47695564fe79d6555cac',
      //   '0x3386f570f1af049a61a551efd5cbe9d0070d7eb79ec70c5436e89cdc0ec8548d',
      //   '0xc14983f5efd216aa3d0ded41f6469774942aa5c2d89f4c9da83229cd45834189',
      //   '0x467d25134b5539cf5788eab218fbed1dba640bcd5c8562a94f191cc5992de20b',
      //   '0x8fc5a92c787ae1a4183f1cc5ace40c459d07457c932fc368bdc4b215ad31832a',
      //   '0x573950c5ca81624e315ad243c6af1b9eb6e32f4f2f45f6f26669ed0b209b6746',
      // ],
    },
    hardhat: {
      forking: {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        url: forkConfig ? forkConfig.nodeURL : 'http://localhost:8545',
        blockNumber: forkConfig ? parseInt(forkConfig.blockNumber) : 0,
        enabled: !!forkConfig,
      },
      accounts: [
        {
          privateKey: '8a78506679446be6dc846c7dddbbee4b5f0ae725caa50126739e0851d66a29c8',
          balance: '10000000000000000000000000',
        },
        {
          privateKey: '284e6f4bc08734aacbd59772662216e288d01a689610c105a5ed8e8defc4425d',
          balance: '10000000000000000000000000',
        },
        {
          privateKey: 'd7af053f5710feb0718095bd5f403b4e6db3625bf572bb1fcae19a84f0faa71a',
          balance: '10000000000000000000000000',
        },
        {
          privateKey: 'a15ee68c2bd73743cd1a54ac95215bc79cfaa164460fcb907759459ef15d0a99',
          balance: '10000000000000000000000000',
        },
        {
          privateKey: 'd90167141d1bef8a39da4a62673cc18e0a9dd31e25ab47695564fe79d6555cac',
          balance: '10000000000000000000000000',
        },
        {
          privateKey: '3386f570f1af049a61a551efd5cbe9d0070d7eb79ec70c5436e89cdc0ec8548d',
          balance: '10000000000000000000000000',
        },
        {
          privateKey: 'c14983f5efd216aa3d0ded41f6469774942aa5c2d89f4c9da83229cd45834189',
          balance: '10000000000000000000000000',
        },
        {
          privateKey: '467d25134b5539cf5788eab218fbed1dba640bcd5c8562a94f191cc5992de20b',
          balance: '10000000000000000000000000',
        },
        {
          privateKey: '8fc5a92c787ae1a4183f1cc5ace40c459d07457c932fc368bdc4b215ad31832a',
          balance: '10000000000000000000000000',
        },
        {
          privateKey: '573950c5ca81624e315ad243c6af1b9eb6e32f4f2f45f6f26669ed0b209b6746',
          balance: '10000000000000000000000000',
        },
      ],
      chainId: ChainIdByNetwork[Network.LOCAL],
      mining: {
        auto: true,
        interval: 2000,
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
    ...(includeArbitrum
      ? {
          arbitrum: {
            url: process.env.ARBITRUM_URL || '',
            accounts: [process.env.PRIV_KEY_ARBITRUM || ''],
            initialBaseFeePerGas: 1000000000,
          },
        }
      : {}),
    ...(includeBase
      ? {
          base: {
            url: process.env.BASE_URL || '',
            accounts: [process.env.PRIV_KEY_BASE || ''],
          },
        }
      : {}),
    devnet: {
      url: process.env.TENDERLY_FORK_URL ?? '',
      chainId: Number(process.env.TENDERLY_FORK_CHAIN_ID ?? 1),
    },
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
      arbitrumOne: process.env.ARBISCAN_API_KEY || '',
      base: process.env.BASE_ETHERSCAN_API_KEY || '',
    },
    customChains: [
      {
        network: 'base',
        chainId: 8453,
        urls: {
          apiURL: 'https://api.basescan.org/api',
          browserURL: 'https://basescan.org',
        },
      },
    ],
  },
  typechain: {
    outDir: 'typechain',
    externalArtifacts: ['../abis/external/**/*.json'],
  },
  abiExporter: {
    path: '../abis/system',
    runOnCompile: true,
    clear: true,
    flat: false,
    spacing: 2,
    pretty: false,
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
  tenderly: {
    username: 'oazoapps', // tenderly username (or organization name)
    project: process.env.TENDERLY_PROJECT ?? '', // project name
    privateVerification: true, // if true, contracts will be verified privately, if false, contracts will be verified publicly
  },
}

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString()
}

export default config
