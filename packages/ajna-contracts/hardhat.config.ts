import "./bootstrap-env";
import "tsconfig-paths/register";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-preprocessor";
import "hardhat-docgen";
import "hardhat-tracer";

import { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.18",
    settings: {
      metadata: {
        bytecodeHash: "none",
      },
      optimizer: {
        enabled: true,
        runs: 0,
      },
    },
  },
  networks: {
    local: {
      url: "http://127.0.0.1:8545",
      timeout: 100000,
      chainId: 2137,
    },
    hardhat: {
      chainId: 2137,
      mining: {
        auto: true,
        interval: 2000,
      },
      hardfork: "london",
      gas: "auto",
      initialBaseFeePerGas: 1000000000,
      allowUnlimitedContractSize: false,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  docgen: {
    path: "./docs",
    clear: true,
    runOnCompile: false,
  },
};

export default config;
