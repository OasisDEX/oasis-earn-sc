import { RuntimeConfig } from '@dma-common/types/common';
import { providers } from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
export default function index(hre?: HardhatRuntimeEnvironment, impersonateAccount?: (provider: providers.JsonRpcProvider) => Promise<{
    signer: providers.JsonRpcSigner;
    address: string;
}>): Promise<RuntimeConfig>;
export declare function resetNode(provider: providers.JsonRpcProvider, blockNumber: number): Promise<void>;
export declare function resetNodeToLatestBlock(provider: providers.JsonRpcProvider): Promise<void>;
//# sourceMappingURL=index.d.ts.map