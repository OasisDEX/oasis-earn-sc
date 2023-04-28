import { ContractReceipt, Signer } from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
type Target = {
    address: string;
    calldata: string;
};
export declare function executeThroughProxy(proxyAddress: string, { address, calldata }: Target, signer: Signer, value?: string, hre?: HardhatRuntimeEnvironment): Promise<[boolean, ContractReceipt]>;
export declare function executeThroughDPMProxy(dpmProxyAddress: string, { address, calldata }: Target, signer: Signer, value?: string, hre?: HardhatRuntimeEnvironment): Promise<[boolean, ContractReceipt]>;
export {};
//# sourceMappingURL=index.d.ts.map