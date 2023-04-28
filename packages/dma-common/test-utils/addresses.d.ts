import { Network } from '@dma-deployments/types/network';
type NetworkAddressesForNetwork<T extends Network> = T extends Network.MAINNET ? MainnetAddresses : T extends Network.OPTIMISM ? OptMainnetAddresses : never;
export declare function addressesByNetwork<T extends Network>(network: T): NetworkAddressesForNetwork<T>;
declare const testAddresses: {
    mainnet: {
        DAI: string;
        ETH: string;
        WETH: string;
        STETH: string;
        WSTETH: string;
        WBTC: string;
        USDC: string;
        feeRecipient: string;
        chainlinkEthUsdPriceFeed: string;
        priceOracle: string;
        lendingPool: string;
        protocolDataProvider: string;
        aaveOracle: string;
        pool: string;
        poolDataProvider: string;
    };
    optimism: {
        DAI: string;
        ETH: string;
        WETH: string;
        STETH: string;
        WSTETH: string;
        WBTC: string;
        USDC: string;
        feeRecipient: string;
        chainlinkEthUsdPriceFeed: string;
        aaveOracle: string;
        pool: string;
        poolDataProvider: string;
    };
};
export type MainnetAddresses = (typeof testAddresses)[Network.MAINNET];
export type OptMainnetAddresses = (typeof testAddresses)[Network.OPTIMISM];
export type NetworkAddressesForTests = MainnetAddresses | OptMainnetAddresses;
export {};
//# sourceMappingURL=addresses.d.ts.map