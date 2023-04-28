import { ServiceRegistry } from '@dma-deployments/utils/wrappers';
import { providers } from 'ethers';
import { RuntimeConfig } from '../types/common';
import { DeployedSystemInfo } from './deploy-system';
type System = {
    system: DeployedSystemInfo;
    registry: ServiceRegistry;
};
export type Snapshot = {
    id: string;
    deployed: System;
};
export declare function restoreSnapshot(args: {
    config: RuntimeConfig;
    provider: providers.JsonRpcProvider;
    blockNumber: number;
    useFallbackSwap?: boolean;
    debug?: boolean;
}): Promise<{
    snapshot: Snapshot;
    config: RuntimeConfig;
}>;
export {};
//# sourceMappingURL=restore-snapshot.d.ts.map