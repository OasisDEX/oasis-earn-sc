import { Network } from '@dma-deployments/types/network';
import { providers } from 'ethers';
export declare function isSupportedNetwork(network: string): network is Network;
export declare const getNetwork: (provider: providers.Provider) => Promise<Network>;
export declare const getForkedNetwork: (provider: providers.Provider) => Promise<Exclude<Network, Network.LOCAL | Network.HARDHAT>>;
export declare const ForkedNetworkByChainId: {
    [key: number]: Exclude<Network, Network.LOCAL | Network.HARDHAT>;
};
export declare const NetworkByChainId: {
    [key: number]: Network;
};
export declare const ChainIdByNetwork: Record<Network, number>;
//# sourceMappingURL=index.d.ts.map