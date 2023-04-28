import './bootstrap-env';
import 'tsconfig-paths/register';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-waffle';
import 'hardhat-gas-reporter';
import '@typechain/hardhat';
import 'solidity-coverage';
import 'solidity-docgen';
import 'hardhat-tracer';
import 'hardhat-abi-exporter';
declare const config: {
    solidity: {
        compilers: {
            version: string;
            settings: {
                optimizer: {
                    enabled: boolean;
                    runs: number;
                };
            };
        }[];
        settings: {
            optimizer: {
                enabled: boolean;
                runs: number;
            };
        };
    };
    networks: {
        optimism?: {
            url: string;
            accounts: string[];
            initialBaseFeePerGas: number;
        } | undefined;
        mainnet?: {
            url: string;
            accounts: string[];
            gasPrice: number;
        } | undefined;
        goerli?: {
            url: string;
            accounts: string[];
            initialBaseFeePerGas: number;
        } | undefined;
        local: {
            url: string;
            timeout: number;
            chainId: number;
        };
        hardhat: {
            forking: {
                url: string;
                blockNumber: number;
            };
            chainId: number;
            mining: {
                auto: boolean;
            };
            hardfork: string;
            gas: string;
            initialBaseFeePerGas: number;
            allowUnlimitedContractSize: boolean;
        };
    };
    gasReporter: {
        enabled: boolean;
        currency: string;
    };
    mocha: {
        timeout: number;
    };
    etherscan: {
        apiKey: {
            mainnet: string;
            optimisticEthereum: string;
        };
    };
};
export default config;
//# sourceMappingURL=hardhat.config.d.ts.map