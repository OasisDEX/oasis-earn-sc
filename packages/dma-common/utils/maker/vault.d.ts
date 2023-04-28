import { JsonRpcProvider } from '@ethersproject/providers';
import { BigNumberish, Contract, Signer } from 'ethers';
import { CDPInfo, VaultInfo } from '../../types/maker';
export declare function getLastVault(provider: JsonRpcProvider, signer: Signer, proxyAddress: string): Promise<CDPInfo>;
export declare function getVaultInfo(mcdView: Contract, vaultId: BigNumberish, ilk: string): Promise<VaultInfo>;
//# sourceMappingURL=vault.d.ts.map