import { Debug, WithRuntimeConfig } from '@dma-common/types/common';
import { Contract } from '@ethersproject/contracts';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
type DeployOptions = WithRuntimeConfig & Debug;
export type DeployFunction = (contractName: string, params?: any[]) => Promise<[Contract, string]>;
export declare function createDeploy({ config, debug }: DeployOptions, hre?: HardhatRuntimeEnvironment): Promise<DeployFunction>;
export declare function removeVersion(service: string): string;
export {};
//# sourceMappingURL=index.d.ts.map