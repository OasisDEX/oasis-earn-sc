import { ServiceRegistry } from '@dma-deployments/utils/wrappers';
import { RuntimeConfig, Unbox } from '../types/common';
export declare function deploySystem(config: RuntimeConfig, debug?: boolean, useFallbackSwap?: boolean): Promise<{
    system: {
        common: {
            userProxyAddress: string;
            dsProxy: import("ethers").Contract;
            serviceRegistry: import("ethers").Contract;
            operationExecutor: import("ethers").Contract;
            operationStorage: import("ethers").Contract;
            operationRegistry: import("ethers").Contract;
            dummyAutomation: import("ethers").Contract;
            dummyCommmand: import("ethers").Contract;
            exchange: import("ethers").Contract;
            uSwap: import("ethers").Contract;
            swap: import("ethers").Contract;
            swapAction: import("ethers").Contract;
            sendToken: import("ethers").Contract;
            pullToken: import("ethers").Contract;
            takeFlashLoan: import("ethers").Contract;
            setApproval: import("ethers").Contract;
            wrapEth: import("ethers").Contract;
            unwrapEth: import("ethers").Contract;
            returnFunds: import("ethers").Contract;
            positionCreated: import("ethers").Contract;
            accountGuard: import("ethers").Contract;
            accountFactory: import("ethers").Contract;
            dpmProxyAddress: string;
        };
        maker: {
            mcdView: import("ethers").Contract;
            openVault: import("ethers").Contract;
            deposit: import("ethers").Contract;
            payback: import("ethers").Contract;
            withdraw: import("ethers").Contract;
            generate: import("ethers").Contract;
            cdpAllow: import("ethers").Contract;
        };
        aave: {
            v2: {
                deposit: import("ethers").Contract;
                withdraw: import("ethers").Contract;
                borrow: import("ethers").Contract;
                payback: import("ethers").Contract;
            };
            v3: {
                deposit: import("ethers").Contract;
                withdraw: import("ethers").Contract;
                borrow: import("ethers").Contract;
                payback: import("ethers").Contract;
                eMode: import("ethers").Contract;
            };
        };
    };
    registry: ServiceRegistry;
}>;
export type DeployedSystemInfo = Unbox<ReturnType<typeof deploySystem>>['system'];
//# sourceMappingURL=deploy-system.d.ts.map