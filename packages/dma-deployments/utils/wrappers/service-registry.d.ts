import { ContractNames } from '@dma-deployments/constants';
import { Signer } from 'ethers';
export declare class ServiceRegistry {
    address: string;
    signer: Signer;
    constructor(address: string, signer: Signer);
    getContractInstance(): Promise<import("ethers").Contract>;
    addEntry(label: ContractNames, address: string, debug?: boolean): Promise<string>;
    addEntryCalldata(label: ContractNames, address: string, debug?: boolean): Promise<string>;
    removeEntry(label: ContractNames): Promise<void>;
    getEntryHash(label: ContractNames): Promise<string>;
    getServiceAddress(label: ContractNames): Promise<string>;
}
//# sourceMappingURL=service-registry.d.ts.map