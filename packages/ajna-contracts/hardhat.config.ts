import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import fs from "fs";
import "hardhat-preprocessor";
import "hardhat-docgen";
import "hardhat-tracer";
require("dotenv").config();

function getRemappings() {
  return fs
    .readFileSync("remappings.txt", "utf8")
    .split("\n")
    .filter(Boolean)
    .map(line => line.trim().split("="));
}
function createHardhatNetwork(network: string, node: string | undefined, key: string | undefined, gasPrice: number) {
  if (!node || !key) {
    return null;
  }

  return [
    network,
    {
      url: node,
      accounts: [key],
      gasPrice,
    },
  ];
}

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.14",
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
    goerli: {
      url: process.env.ALCHEMY_NODE_GOERLI,
      gasPrice: 250000000000,
      accounts: [process.env.PRIVATE_KEY!],
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
  preprocess: {
    eachLine: hre => ({
      transform: (line: string) => {
        if (line.match(/^\s*import /i)) {
          getRemappings().forEach(([find, replace]) => {
            if (line.match(find)) {
              line = line.replace(find, replace);
            }
          });
        }
        return line;
      },
    }),
  },
  docgen: {
    path: "./docs",
    clear: true,
    runOnCompile: false,
  },
};

export default config;
