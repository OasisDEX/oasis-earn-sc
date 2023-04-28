import { Signer } from 'ethers';
type Action = {
    hash: string;
    optional: boolean;
};
export declare class OperationsRegistry {
    address: string;
    signer: Signer;
    constructor(address: string, signer: Signer);
    addOp(label: string, actions: Action[], debug?: boolean): Promise<string>;
    getOp(label: string): Promise<[string[], boolean[]]>;
}
export {};
//# sourceMappingURL=operations-registry.d.ts.map