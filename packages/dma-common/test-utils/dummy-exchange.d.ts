import { JsonRpcProvider } from '@ethersproject/providers';
import BigNumber from 'bignumber.js';
import { Contract, Signer } from 'ethers';
export declare const FEE = 20;
export declare const FEE_BASE = 10000;
export interface ERC20TokenData {
    name: string;
    address: string;
    precision: number;
    pip?: string;
}
export declare function getMarketPrice(from: string, to: string, fromPrecision?: number, toPrecision?: number): Promise<BigNumber>;
export declare function loadDummyExchangeFixtures(provider: JsonRpcProvider, signer: Signer, dummyExchangeInstance: Contract, debug: boolean): Promise<void>;
//# sourceMappingURL=dummy-exchange.d.ts.map