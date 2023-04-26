"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./bootstrap-env");
require("tsconfig-paths/register");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("@typechain/hardhat");
require("solidity-coverage");
require("solidity-docgen");
require("hardhat-tracer");
require("hardhat-abi-exporter");
const network_1 = require("@dma-deployments/utils/network");
const process = __importStar(require("process"));
const network_2 = require("types/network");
const networkFork = process.env.NETWORK_FORK;
if (!networkFork || !(networkFork == network_2.Network.MAINNET || networkFork == network_2.Network.OPTIMISM)) {
    throw new Error(`NETWORK_FORK Missing. Specify ${network_2.Network.MAINNET} or ${network_2.Network.OPTIMISM}`);
}
let forkConfig = undefined;
if (networkFork == network_2.Network.MAINNET) {
    const nodeURL = process.env.MAINNET_URL;
    if (!nodeURL) {
        throw new Error(`You must provide MAINNET_URL value in the .env file`);
    }
    const blockNumber = process.env.BLOCK_NUMBER;
    if (!blockNumber) {
        throw new Error(`You must provide a BLOCK_NUMBER value in the .env file.`);
    }
    forkConfig = {
        nodeURL,
        blockNumber,
    };
}
if (networkFork == network_2.Network.OPTIMISM) {
    const nodeURL = process.env.OPTIMISM_URL;
    if (!nodeURL) {
        throw new Error(`You must provide OPTIMISM_URL value in the .env file`);
    }
    const blockNumber = process.env.OPTIMISM_BLOCK_NUMBER;
    if (!blockNumber) {
        throw new Error(`You must provide a OPTIMISM_BLOCK_NUMBER value in the .env file.`);
    }
    forkConfig = {
        nodeURL,
        blockNumber,
    };
}
if (forkConfig && !/^\d+$/.test(forkConfig.blockNumber)) {
    throw new Error(`Provide a valid block number. Provided value is ${forkConfig.blockNumber}`);
}
console.log(`Forking on ${networkFork}`);
console.log(`Forking from block number: ${forkConfig && forkConfig.blockNumber}`);
// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more
const includeMainnet = !!process.env.MAINNET_URL && !!process.env.PRIV_KEY_MAINNET;
const includeGoerli = !!process.env.GOERLI_URL && !!process.env.PRIV_KEY_GOERLI;
const includeOptimism = !!process.env.OPTIMISM_URL && !!process.env.PRIV_KEY_OPTIMISM;
const config = {
    solidity: {
        compilers: [
            {
                version: '0.4.21',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 1000,
                    },
                },
            },
            {
                version: '0.4.24',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 1000,
                    },
                },
            },
            {
                version: '0.5.17',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 1000,
                    },
                },
            },
            {
                version: '0.8.15',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 1000,
                    },
                },
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
            chainId: network_1.ChainIdByNetwork[network_2.Network.LOCAL],
        },
        hardhat: {
            forking: {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                url: forkConfig ? forkConfig.nodeURL : 'http://127.0.0.1:8545',
                blockNumber: forkConfig ? parseInt(forkConfig.blockNumber) : 0,
            },
            chainId: network_1.ChainIdByNetwork[network_2.Network.LOCAL],
            mining: {
                auto: true,
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
    },
    gasReporter: {
        enabled: process.env.REPORT_GAS === '1',
        currency: 'USD',
    },
    mocha: {
        timeout: 600000,
    },
    etherscan: {
        apiKey: {
            mainnet: process.env.ETHERSCAN_API_KEY || '',
            optimisticEthereum: process.env.OPTIMISM_ETHERSCAN_API_KEY || '',
        },
    },
};
// @ts-ignore
BigInt.prototype.toJSON = function () {
    return this.toString();
};
exports.default = config;
