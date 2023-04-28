import { OneInchSwapResponse } from '@dma-common/types/common';
import { Network } from '@dma-deployments/types/network';
import BigNumber from 'bignumber.js';
export declare const oneInchCallMock: (marketPrice?: BigNumber, precision?: {
    from: number;
    to: number;
}, debug?: boolean) => (from: string, to: string, amount: BigNumber, slippage: BigNumber) => Promise<{
    fromTokenAddress: string;
    toTokenAddress: string;
    fromTokenAmount: BigNumber;
    toTokenAmount: BigNumber;
    minToTokenAmount: BigNumber;
    exchangeCalldata: number;
}>;
export declare function formatOneInchSwapUrl(fromToken: string, toToken: string, amount: string, slippage: string, recipient: string, protocols?: string[], chainId?: number, version?: string): string;
export declare function exchangeTokens(url: string): Promise<OneInchSwapResponse>;
export declare function swapOneInchTokens(fromTokenAddress: string, toTokenAddress: string, amount: string, recipient: string, slippage: string, protocols?: string[], chainId?: number, version?: string): Promise<OneInchSwapResponse>;
export declare function exchangeFromDAI(toTokenAddress: string, amount: string, slippage: string, recepient: string, protocols?: string[]): Promise<OneInchSwapResponse>;
export declare function exchangeToDAI(fromTokenAddress: string, amount: string, recepient: string, slippage: string, protocols?: string[]): Promise<OneInchSwapResponse>;
type OneInchVersion = 'v4.0' | 'v5.0';
export declare const oneInchVersionMap: Record<Exclude<Network, Network.LOCAL | Network.HARDHAT | Network.GOERLI>, OneInchVersion>;
export declare function resolveOneInchVersion(network: Network): OneInchVersion;
export declare const getOneInchCall: (swapAddress: string, protocols?: string[], chainId?: number, version?: 'v4.0' | 'v5.0', debug?: true) => (from: string, to: string, amount: BigNumber, slippage: BigNumber) => Promise<{
    toTokenAddress: string;
    fromTokenAddress: string;
    minToTokenAmount: BigNumber;
    toTokenAmount: BigNumber;
    fromTokenAmount: BigNumber;
    exchangeCalldata: string;
}>;
export declare const optimismLiquidityProviders: string[];
export {};
//# sourceMappingURL=1inch.d.ts.map