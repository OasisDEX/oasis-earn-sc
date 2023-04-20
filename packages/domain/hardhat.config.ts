import 'tsconfig-paths/register'
import '@nomiclabs/hardhat-ethers'

import * as dotenv from 'dotenv'
import { HardhatUserConfig } from 'hardhat/config'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, './.env') })

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
      chainId: 2137,
      mining: {
        auto: true,
      },
      hardfork: 'london',
      gas: 'auto',
      initialBaseFeePerGas: 1000000000,
      allowUnlimitedContractSize: true,
    },
  },
}

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString()
}

export default config
