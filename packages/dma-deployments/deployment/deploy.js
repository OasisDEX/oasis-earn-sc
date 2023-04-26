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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeploymentSystem = void 0;
// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const operation_definitions_1 = require("@dma-deployments/operation-definitions");
const network_1 = require("@dma-deployments/types/network");
const network_2 = require("@dma-deployments/utils/network");
const wrappers_1 = require("@dma-deployments/utils/wrappers");
const safe_core_sdk_1 = __importDefault(require("@safe-global/safe-core-sdk"));
const safe_ethers_lib_1 = __importDefault(require("@safe-global/safe-ethers-lib"));
const safe_service_client_1 = __importDefault(require("@safe-global/safe-service-client"));
const axios_1 = __importDefault(require("axios"));
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const ethers_1 = require("ethers");
const lodash_1 = __importDefault(require("lodash"));
const node_cache_1 = __importDefault(require("node-cache"));
const path = __importStar(require("path"));
const prompts_1 = __importDefault(require("prompts"));
const util_1 = require("util");
const restrictedNetworks = [network_1.Network.MAINNET, network_1.Network.OPTIMISM, network_1.Network.GOERLI];
const rpcUrls = {
    [network_1.Network.MAINNET]: 'https://eth-mainnet.alchemyapi.io/v2/TPEGdU79CfRDkqQ4RoOCTRzUX4GUAO44',
    [network_1.Network.OPTIMISM]: 'https://opt-mainnet.g.alchemy.com/v2/d2-w3caSVd_wPT05UkXyA3kr3un3Wx_g',
    [network_1.Network.GOERLI]: 'https://eth-goerli.alchemyapi.io/v2/TPEGdU79CfRDkqQ4RoOCTRzUX4GUAO44',
};
const gnosisSafeServiceUrl = {
    [network_1.Network.MAINNET]: '',
    [network_1.Network.HARDHAT]: '',
    [network_1.Network.LOCAL]: '',
    [network_1.Network.OPTIMISM]: '',
    [network_1.Network.GOERLI]: 'https://safe-transaction.goerli.gnosis.io',
    [network_1.Network.HARDHAT]: '',
};
// HELPERS --------------------------
class DeployedSystemHelpers {
    constructor() {
        this.chainId = 0;
        this.network = network_1.Network.LOCAL;
        this.forkedNetwork = undefined;
        this.rpcUrl = '';
        this.isRestrictedNetwork = false;
    }
    async getForkedNetworkChainId(provider) {
        try {
            const metadata = await provider.send('hardhat_metadata', []);
            return metadata.forkedNetwork.chainId;
        }
        catch (e) {
            console.log('\x1b[33m[ WARN ] Current network is not a fork! \x1b[0m');
        }
        return 0;
    }
    getNetworkFromChainId(chainId) {
        return network_2.NetworkByChainId[chainId];
    }
    getRpcUrl(network) {
        return rpcUrls[network];
    }
    async init() {
        if (!this.hre)
            throw new Error('HardhatRuntimeEnvironment is not defined!');
        this.ethers = this.hre.ethers;
        this.provider = this.hre.ethers.provider;
        this.signer = this.provider.getSigner();
        this.signerAddress = await this.signer.getAddress();
        this.isRestrictedNetwork = restrictedNetworks.includes(this.network);
        this.chainId = await this.getForkedNetworkChainId(this.provider);
        this.forkedNetwork = this.getNetworkFromChainId(this.chainId);
        this.rpcUrl = this.getRpcUrl(this.forkedNetwork);
        console.log('NETWORK / FORKED NETWORK', `${this.network} / ${this.forkedNetwork}`);
        return {
            provider: this.provider,
            signer: this.signer,
            address: this.signerAddress,
        };
    }
}
// MAIN CLASS ===============================================
class DeploymentSystem extends DeployedSystemHelpers {
    constructor(hre) {
        super();
        this.hre = hre;
        this.deployedSystem = {};
        this._cache = new node_cache_1.default();
        this.hre = hre;
        this.network = hre.network.name;
    }
    async loadConfig(configFileName) {
        if (configFileName) {
            try {
                this.config = (await Promise.resolve(`${this.getConfigPath(`./${configFileName}`)}`).then(s => __importStar(require(s)))).config;
            }
            catch (e) {
                console.log('\x1b[33m[ WARN ] Config file not found! \x1b[0m', e);
            }
        }
        else {
            // if forked other network then merge configs files
            if (this.forkedNetwork) {
                const baseConfig = (await Promise.resolve(`${this.getConfigPath(`./${this.forkedNetwork}.conf`)}`).then(s => __importStar(require(s)))).config;
                const extendedConfig = (await Promise.resolve(`${this.getConfigPath(`./local-extend.conf`)}`).then(s => __importStar(require(s)))).config;
                this.config = lodash_1.default.merge(baseConfig, extendedConfig);
            }
            else {
                // otherwise load just one config file
                this.config = (await Promise.resolve(`${this.getConfigPath(`./${this.network}.conf`)}`).then(s => __importStar(require(s)))).config;
            }
        }
    }
    async extendConfig(configFileName) {
        if (!this.config) {
            await this.loadConfig(configFileName);
        }
        else {
            this.config = lodash_1.default.merge(this.config, (await Promise.resolve(`${this.getConfigPath(`./${configFileName}`)}`).then(s => __importStar(require(s)))).config);
        }
    }
    async saveConfig() {
        const { writeFile } = await Promise.resolve().then(() => __importStar(require('fs')));
        const configString = (0, util_1.inspect)(this.config, { depth: null });
        writeFile(this.getConfigPath(`./${this.network}.conf.ts`), `export const config = ${configString}`, (error) => {
            if (error) {
                console.log('ERROR: ', error);
            }
        });
    }
    getConfigPath(localPath) {
        const baseDirectory = '../configs';
        const configPath = path.join(baseDirectory, localPath);
        console.log('USING CONFIG', localPath);
        return configPath;
    }
    async postInstantiation(configItem, contract) {
        console.log('POST INITIALIZATION', configItem.name, contract.address);
    }
    async postRegistryEntry(configItem, address) {
        if (!configItem.serviceRegistryName)
            throw new Error('No service registry name provided');
        console.log('REGISTRY ENTRY', configItem.serviceRegistryName, this.getRegistryEntryHash(configItem.serviceRegistryName), address);
    }
    async verifyContract(address, constructorArguments) {
        try {
            await this.hre.run('verify:verify', {
                address,
                constructorArguments,
            });
        }
        catch (e) {
            console.log(`DEBUG: Error during verification of ${address}: ${e.message}`);
        }
    }
    async postDeployment(configItem, contract, constructorArguments) {
        if (!this.provider)
            throw new Error('No provider set');
        if (!this.config)
            throw new Error('No config set');
        if (!this.serviceRegistryHelper)
            throw new Error('ServiceRegistryHelper not initialized');
        console.log('POST DEPLOYMENT', configItem.name, configItem.address);
        // SERVICE REGISTRY addition
        if (configItem.serviceRegistryName) {
            if (gnosisSafeServiceUrl[this.network] !== '') {
                const signer = this.provider.getSigner(1);
                const ethAdapter = new safe_ethers_lib_1.default({ ethers: ethers_1.ethers, signerOrProvider: signer });
                const safeSdk = await safe_core_sdk_1.default.create({
                    ethAdapter: ethAdapter,
                    safeAddress: this.config.common.GnosisSafe.address,
                });
                const safeService = new safe_service_client_1.default({
                    txServiceUrl: gnosisSafeServiceUrl[this.network],
                    ethAdapter,
                });
                const safeInfo = await safeService.getSafeInfo(this.config.common.GnosisSafe.address);
                const encodedData = await this.serviceRegistryHelper.addEntryCalldata(configItem.serviceRegistryName, contract.address);
                if (this.deployedSystem.ServiceRegistry === undefined)
                    throw new Error('No ServiceRegistry deployed');
                const safeTransactionData = {
                    to: this.deployedSystem.ServiceRegistry.contract.address,
                    data: encodedData,
                    value: 0,
                    nonce: safeInfo.nonce,
                };
                const safeTransaction = await safeSdk.createTransaction({
                    safeTransactionData: safeTransactionData,
                });
                const safeTransactionHash = await safeSdk.getTransactionHash(safeTransaction);
                const ownerSignature = await safeSdk.signTransactionHash(safeTransactionHash);
                const address = await signer.getAddress();
                await safeService.proposeTransaction({
                    safeAddress: ethers_1.ethers.utils.getAddress(this.config.common.GnosisSafe.address),
                    safeTransactionData: safeTransaction.data,
                    safeTxHash: safeTransactionHash,
                    senderAddress: ethers_1.ethers.utils.getAddress(address),
                    senderSignature: ownerSignature.data,
                });
            }
            else {
                await this.serviceRegistryHelper.addEntry(configItem.serviceRegistryName, contract.address);
            }
        }
        // ETHERSCAN VERIFICATION (only for mainnet and L1 testnets)
        if (this.network === network_1.Network.MAINNET || this.network === network_1.Network.GOERLI) {
            this.verifyContract(contract.address, constructorArguments);
        }
    }
    getRegistryEntryHash(name) {
        if (name !== '') {
            return ethers_1.utils.keccak256(Buffer.from(name));
            // await this.serviceRegistryHelper!.getEntryHash(name as ContractNames)
        }
        return '';
    }
    async addRegistryEntries(addressesConfig) {
        var _a, _b;
        if (!this.serviceRegistryHelper)
            throw new Error('No service registry helper set');
        for (const configItem of addressesConfig) {
            if (configItem.serviceRegistryName) {
                const address = ((_b = (_a = this.deployedSystem) === null || _a === void 0 ? void 0 : _a[configItem.name]) === null || _b === void 0 ? void 0 : _b.contract.address) ||
                    configItem.address;
                await this.addRegistryEntry(configItem, address);
            }
        }
    }
    async addRegistryEntry(configItem, address) {
        if (!this.serviceRegistryHelper)
            throw new Error('ServiceRegistryHelper not initialized');
        if (configItem.serviceRegistryName) {
            await this.serviceRegistryHelper.addEntry(configItem.serviceRegistryName, address);
            await this.postRegistryEntry(configItem, address);
        }
    }
    async instantiateContracts(addressesConfig) {
        if (!this.signer)
            throw new Error('Signer not initialized');
        for (const configItem of addressesConfig) {
            console.log('INSTANTIATING ', configItem.name, configItem.address);
            const contractInstance = await this.ethers.getContractAt(configItem.name, configItem.address);
            this.deployedSystem[configItem.name] = {
                contract: contractInstance,
                config: configItem,
                hash: this.getRegistryEntryHash(configItem.serviceRegistryName || ''),
            };
            const isServiceRegistry = configItem.name === 'ServiceRegistry';
            !configItem.serviceRegistryName &&
                !isServiceRegistry &&
                console.warn('No Service Registry name for: ', configItem.name, configItem.serviceRegistryName || '');
            if (configItem.name === 'ServiceRegistry') {
                this.serviceRegistryHelper = new wrappers_1.ServiceRegistry(configItem.address, this.signer);
            }
            await this.postInstantiation(configItem, contractInstance);
        }
    }
    async promptBeforeDeployment() {
        console.log('\x1b[33m[ WARN ]: You are deploying to a restricted network. Please make sure you know what you are doing.\x1b[0m');
        const response = await (0, prompts_1.default)({
            type: 'text',
            name: 'value',
            message: `Please type "${this.network}" to continue`,
        });
        if (response.value !== this.network) {
            process.exit(1);
        }
    }
    async deployContracts(addressesConfig) {
        var _a;
        if (!this.signer)
            throw new Error('Signer not initialized');
        if (this.isRestrictedNetwork) {
            await this.promptBeforeDeployment();
        }
        for (const configItem of addressesConfig) {
            let constructorParams = [];
            if (configItem.constructorArgs && ((_a = configItem.constructorArgs) === null || _a === void 0 ? void 0 : _a.length) !== 0) {
                constructorParams = configItem.constructorArgs.map((param) => {
                    var _a;
                    if (typeof param === 'string' && param.indexOf('address:') >= 0) {
                        const contractName = param.replace('address:', '');
                        if (!((_a = this.deployedSystem[contractName]) === null || _a === void 0 ? void 0 : _a.contract.address)) {
                            throw new Error(`Contract ${contractName} not deployed`);
                        }
                        return this.deployedSystem[contractName].contract.address;
                    }
                    return param;
                });
            }
            const contractInstance = await this.deployContract(this.ethers.getContractFactory(configItem.name, this.signer), constructorParams);
            if (configItem.name === 'ServiceRegistry') {
                this.serviceRegistryHelper = new wrappers_1.ServiceRegistry(contractInstance.address, this.signer);
            }
            this.deployedSystem[configItem.name] = {
                contract: contractInstance,
                config: configItem,
                hash: this.getRegistryEntryHash(configItem.serviceRegistryName || ''),
            };
            const isServiceRegistry = configItem.name === 'ServiceRegistry';
            !configItem.serviceRegistryName &&
                !isServiceRegistry &&
                console.warn('No Service Registry name for: ', configItem.name, configItem.serviceRegistryName || '');
            if (configItem.history && configItem.address !== '') {
                configItem.history.push(configItem.address);
            }
            configItem.address = contractInstance.address;
            await this.postDeployment(configItem, contractInstance, constructorParams);
        }
    }
    async deployContract(_factory, params) {
        const factory = await _factory;
        const deployment = await factory.deploy(...params, await this.getGasSettings());
        return (await deployment.deployed());
    }
    async getGasSettings() {
        if (this.hre.network.name !== network_1.Network.MAINNET) {
            return {};
        }
        const { suggestBaseFee } = await this.getGasPrice();
        const maxPriorityFeePerGas = new bignumber_js_1.default(2).shiftedBy(9).toFixed(0);
        const maxFeePerGas = new bignumber_js_1.default(suggestBaseFee)
            .shiftedBy(9)
            .plus(maxPriorityFeePerGas)
            .toFixed(0);
        return {
            maxFeePerGas: ethers_1.BigNumber.from(maxFeePerGas),
            maxPriorityFeePerGas: ethers_1.BigNumber.from(maxPriorityFeePerGas),
        };
    }
    async getGasPrice() {
        const cached = this._cache.get('gasprice');
        if (cached) {
            return cached;
        }
        const { data } = await axios_1.default.get('https://api.etherscan.io/api', {
            params: {
                module: 'gastracker',
                action: 'gasoracle',
                apikey: process.env.ETHERSCAN_API_KEY,
            },
        });
        this._cache.set('gasprice', data.result, 10);
        return data.result;
    }
    async deployCore() {
        if (!this.config)
            throw new Error('No config set');
        await this.instantiateContracts(Object.values(this.config.mpa.core).filter((item) => item.address !== '' && !item.deploy));
        await this.deployContracts(Object.values(this.config.mpa.core).filter((item) => item.deploy));
    }
    async deployActions() {
        if (!this.config)
            throw new Error('No config set');
        await this.instantiateContracts(Object.values(this.config.mpa.actions).filter((item) => item.address !== '' && !item.deploy));
        await this.deployContracts(Object.values(this.config.mpa.actions).filter((item) => item.deploy));
    }
    async deployAll() {
        await this.deployCore();
        await this.deployActions();
    }
    async addCommonEntries() {
        if (!this.config)
            throw new Error('No config set');
        await this.addRegistryEntries(Object.values(this.config.common).filter((item) => item.address !== '' && item.serviceRegistryName));
    }
    async addAaveEntries() {
        if (!this.config)
            throw new Error('No config set');
        await this.addRegistryEntries(Object.values(this.config.aave.v2 || {}).filter((item) => item.address !== '' && item.serviceRegistryName));
        await this.addRegistryEntries(Object.values(this.config.aave.v3 || {}).filter((item) => item.address !== '' && item.serviceRegistryName));
    }
    async addMakerEntries() {
        if (!this.config)
            throw new Error('No config set');
        await this.addRegistryEntries(Object.values(this.config.maker.common).filter((item) => item.address !== '' && item.serviceRegistryName));
    }
    async addOperationEntries() {
        if (!this.signer)
            throw new Error('No signer set');
        if (!this.deployedSystem.OperationsRegistry)
            throw new Error('No OperationsRegistry deployed');
        const operationsRegistry = new wrappers_1.OperationsRegistry(this.deployedSystem.OperationsRegistry.contract.address, this.signer);
        await operationsRegistry.addOp(operation_definitions_1.aaveOpenV2OperationDefinition.name, operation_definitions_1.aaveOpenV2OperationDefinition.actions);
        await operationsRegistry.addOp(operation_definitions_1.aaveCloseV2OperationDefinition.name, operation_definitions_1.aaveCloseV2OperationDefinition.actions);
        await operationsRegistry.addOp(operation_definitions_1.aaveOpenV3OperationDefinition.name, operation_definitions_1.aaveOpenV3OperationDefinition.actions);
        await operationsRegistry.addOp(operation_definitions_1.aaveCloseV3OperationDefinition.name, operation_definitions_1.aaveCloseV3OperationDefinition.actions);
    }
    async addAllEntries() {
        await this.addCommonEntries();
        await this.addAaveEntries();
        await this.addMakerEntries();
        await this.addOperationEntries();
    }
    // TODO unify resetNode and resetNodeToLatestBlock into one function
    async resetNode(blockNumber) {
        if (!this.provider)
            throw new Error('No provider set');
        console.log(`\x1b[90mResetting fork to block number: ${blockNumber}\x1b[0m`);
        await this.provider.send('hardhat_reset', [
            {
                forking: {
                    jsonRpcUrl: this.rpcUrl,
                    blockNumber,
                },
            },
        ]);
    }
    async resetNodeToLatestBlock() {
        if (!this.provider)
            throw new Error('No provider set');
        await this.provider.send('hardhat_reset', [
            {
                forking: {
                    jsonRpcUrl: this.rpcUrl,
                },
            },
        ]);
    }
    getSystem() {
        if (!this.serviceRegistryHelper)
            throw new Error('No service registry helper set');
        if (!this.config)
            throw new Error('No config set');
        return {
            system: this.deployedSystem,
            registry: this.serviceRegistryHelper,
            config: this.config,
        };
    }
}
exports.DeploymentSystem = DeploymentSystem;
