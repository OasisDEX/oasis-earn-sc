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
    mainnet: {
      url: process.env.MAINNET_URL || "",
      initialBaseFeePerGas: 1000000000,
      gasPrice: 45000000000, // 45 gwei
      // FIXME: uncomment when we have the env variable properly set up in gh actions
      // accounts: [process.env.PRIV_KEY_MAINNET || ""],
    },
    base: {
      url: process.env.BASE_URL || "",
      // initialBaseFeePerGas: 1000000000,
      // gasPrice: 45000000000, // 45 gwei
      // FIXME: uncomment when we have the env variable properly set up in gh actions
      // accounts: [process.env.PRIV_KEY_BASE || ""],
    },
    goerli: {
      url: process.env.GOERLI_URL || "",
      // FIXME: uncomment when we have the env variable properly set up in gh actions
      // accounts: [process.env.PRIV_KEY_GOERLI || ""],
      initialBaseFeePerGas: 1000000000,
    },
    local: {
      url: "http://127.0.0.1:8545",
      timeout: 100000,
      chainId: 2137,
    },
    hardhat: {
      forking: {
        enabled: true,
        url: process.env.MAINNET_URL || "https://eth-mainnet.alchemyapi.io/v2/TPEGdU79CfRDkqQ4RoOCTRzUX4GUAO44",
        blockNumber: 17663832,
      },
      chainId: 2137,
      mining: {
        auto: true,
        interval: 2000,
      },
      hardfork: "shanghai",
      gas: "auto",
      initialBaseFeePerGas: 1000000000,
      allowUnlimitedContractSize: false,
    },
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY || "",
      optimisticEthereum: process.env.OPTIMISM_ETHERSCAN_API_KEY || "",
      arbitrumOne: process.env.ARBISCAN_API_KEY || "",
      base: process.env.BASE_ETHERSCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org",
        },
      },
    ],
  },
  docgen: {
    path: "./docs",
    clear: true,
    runOnCompile: false,
  },
};

export default config;
