import "./bootstrap-env";
import "tsconfig-paths/register";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-preprocessor";
import "hardhat-docgen";
import "hardhat-tracer";

import { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.15",
    settings: {
      metadata: {
        bytecodeHash: "none",
      },
      optimizer: {
        enabled: true,
        runs: 100,
      },
    },
  },
  networks: {
    local: {
      url: "http://127.0.0.1:8545",
      timeout: 100000,
      chainId: 2137,
    },
    tenderly: {
      url: "https://rpc.tenderly.co/fork/f2bcdfe6-cf39-4575-83a2-18ef23fab0c2",
      chainId: 1,
      accounts: [
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
        "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
        "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
        "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
      ],
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
