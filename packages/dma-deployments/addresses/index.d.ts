import { Address } from '@dma-deployments/types/address';
import { AaveV2Protocol, AaveV3Protocol, Actions, AjnaProtocol, AutomationProtocol, Common, CoreContracts, MakerProtocol, MakerProtocolJoins, MakerProtocolPips, SystemKeys } from '@dma-deployments/types/deployment-config';
import { Network } from '@dma-deployments/types/network';
declare enum MpaKeys {
    CORE = "core",
    ACTIONS = "actions"
}
declare enum AaveKeys {
    V2 = "v2",
    V3 = "v3"
}
type DefaultDeployment = {
    [SystemKeys.MPA]: {
        [MpaKeys.CORE]: Record<CoreContracts, Address>;
        [MpaKeys.ACTIONS]: Record<Actions, Address>;
    };
    [SystemKeys.COMMON]: Record<Common, Address>;
    [SystemKeys.AAVE]: {
        [AaveKeys.V2]: Record<AaveV2Protocol, Address>;
        [AaveKeys.V3]: Record<AaveV3Protocol, Address>;
    };
    [SystemKeys.MAKER]: {
        common: Record<MakerProtocol, Address>;
        joins: Record<MakerProtocolJoins, Address>;
        pips: Record<MakerProtocolPips, Address>;
    };
    [SystemKeys.AUTOMATION]: Record<AutomationProtocol, Address>;
    [SystemKeys.AJNA]: Record<AjnaProtocol, Address>;
};
export type Addresses = {
    [Network.MAINNET]: DefaultDeployment;
    [Network.OPTIMISM]: DefaultDeployment;
    [Network.GOERLI]: DefaultDeployment;
};
export declare const ADDRESSES: Addresses;
export {};
//# sourceMappingURL=index.d.ts.map