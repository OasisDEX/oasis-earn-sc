import { System, SystemTemplate } from '@dma-deployments/types/deployed-system';
import { DeploymentConfig, SystemConfig, SystemConfigItem } from '@dma-deployments/types/deployment-config';
import { EtherscanGasPrice } from '@dma-deployments/types/etherscan';
import { Network } from '@dma-deployments/types/network';
import { ServiceRegistry } from '@dma-deployments/utils/wrappers';
import { BigNumber as EthersBN, Contract, ContractFactory, ethers, providers, Signer } from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
declare abstract class DeployedSystemHelpers {
    chainId: number;
    network: Network;
    forkedNetwork: Network | undefined;
    rpcUrl: string;
    isRestrictedNetwork: boolean;
    hre: HardhatRuntimeEnvironment | undefined;
    ethers: any;
    provider: providers.JsonRpcProvider | undefined;
    signer: Signer | undefined;
    signerAddress: string | undefined;
    feeRecipient: string | undefined;
    serviceRegistryHelper: ServiceRegistry | undefined;
    getForkedNetworkChainId(provider: providers.JsonRpcProvider): Promise<any>;
    getNetworkFromChainId(chainId: number): Network;
    getRpcUrl(network: Network): string;
    init(): Promise<{
        provider: ethers.providers.JsonRpcProvider;
        signer: ethers.Signer;
        address: string;
    }>;
}
export declare class DeploymentSystem extends DeployedSystemHelpers {
    readonly hre: HardhatRuntimeEnvironment;
    config: SystemConfig | undefined;
    deployedSystem: SystemTemplate;
    private readonly _cache;
    constructor(hre: HardhatRuntimeEnvironment);
    loadConfig(configFileName?: string): Promise<void>;
    extendConfig(configFileName?: string): Promise<void>;
    saveConfig(): Promise<void>;
    getConfigPath(localPath: string): string;
    postInstantiation(configItem: DeploymentConfig, contract: Contract): Promise<void>;
    postRegistryEntry(configItem: DeploymentConfig, address: string): Promise<void>;
    verifyContract(address: string, constructorArguments: any[]): Promise<void>;
    postDeployment(configItem: any, contract: Contract, constructorArguments: any): Promise<void>;
    getRegistryEntryHash(name: string): string;
    addRegistryEntries(addressesConfig: DeploymentConfig[]): Promise<void>;
    addRegistryEntry(configItem: DeploymentConfig, address: string): Promise<void>;
    instantiateContracts(addressesConfig: SystemConfigItem[]): Promise<void>;
    promptBeforeDeployment(): Promise<void>;
    deployContracts(addressesConfig: SystemConfigItem[]): Promise<void>;
    deployContract<F extends ContractFactory, C extends Contract>(_factory: F | Promise<F>, params: Parameters<F['deploy']>): Promise<C>;
    getGasSettings(): Promise<{
        maxFeePerGas?: undefined;
        maxPriorityFeePerGas?: undefined;
    } | {
        maxFeePerGas: EthersBN;
        maxPriorityFeePerGas: EthersBN;
    }>;
    getGasPrice(): Promise<EtherscanGasPrice['result']>;
    deployCore(): Promise<void>;
    deployActions(): Promise<void>;
    deployAll(): Promise<void>;
    addCommonEntries(): Promise<void>;
    addAaveEntries(): Promise<void>;
    addMakerEntries(): Promise<void>;
    addOperationEntries(): Promise<void>;
    addAllEntries(): Promise<void>;
    resetNode(blockNumber: number): Promise<void>;
    resetNodeToLatestBlock(): Promise<void>;
    getSystem(): System;
}
export {};
//# sourceMappingURL=deploy.d.ts.map