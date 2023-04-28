import BigNumber from 'bignumber.js';
import { ExchangeData } from '../types/common';
export declare function calculateParamsIncreaseMP({ oraclePrice, marketPrice, oazoFee, flashLoanFee, currentColl, currentDebt, requiredCollRatio, slippage, daiTopUp, collTopUp, debug, }: {
    oraclePrice: BigNumber;
    marketPrice: BigNumber;
    oazoFee: BigNumber;
    flashLoanFee: BigNumber;
    currentColl: BigNumber;
    currentDebt: BigNumber;
    requiredCollRatio: BigNumber;
    daiTopUp?: BigNumber;
    collTopUp?: BigNumber;
    slippage: BigNumber;
    debug?: boolean;
}): [BigNumber, BigNumber, BigNumber] & {
    requiredDebt: BigNumber;
    additionalCollateral: BigNumber;
    preIncreaseMPTopUp: BigNumber;
};
type DesiredCdpState = {
    requiredDebt: BigNumber;
    toBorrowCollateralAmount: BigNumber;
    daiTopUp: BigNumber;
    fromTokenAmount: BigNumber;
    toTokenAmount: BigNumber;
    collTopUp: BigNumber;
};
type ExchangeDataMock = {
    to: string;
    data: number;
};
export declare function prepareMultiplyParameters({ oneInchPayload, desiredCdpState, toDAI, }: {
    oneInchPayload: ExchangeDataMock;
    desiredCdpState: DesiredCdpState;
    fundsReceiver: string;
    toDAI?: boolean;
    cdpId?: number;
    skipFL?: boolean;
}): {
    exchangeData: ExchangeData;
};
export {};
//# sourceMappingURL=param-calculations.d.ts.map