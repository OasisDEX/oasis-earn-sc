import { ContractReceipt } from '@ethersproject/contracts';
import { BigNumber } from 'bignumber.js';
import { BytesLike, Contract, utils } from 'ethers';
export declare function toRatio(units: BigNumber.Value): number;
export declare function isLocalNetwork(network: string): boolean;
export declare function getServiceNameHash(service: string): string;
export declare function getEvents(receipt: ContractReceipt, eventAbi: utils.EventFragment): {
    topics: string[];
    data: string;
    address: string;
    eventFragment: utils.EventFragment;
    name: string;
    signature: string;
    topic: string;
    args: utils.Result;
}[];
export declare function generateRandomAddress(): string;
export declare function forgeUnoswapCalldata(fromToken: string, fromAmount: string, toAmount: string, toDai?: boolean): string;
export declare function generateTpOrSlExecutionData(mpa: Contract, toCollateral: boolean, cdpData: any, exchangeData: any, serviceRegistry: any): BytesLike;
export declare function bignumberToTopic(id: BigNumber.Value): string;
//# sourceMappingURL=utils.d.ts.map