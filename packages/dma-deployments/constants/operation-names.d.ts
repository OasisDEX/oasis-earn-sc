export declare const OPERATION_NAMES: {
    readonly aave: {
        readonly v2: {
            readonly OPEN_POSITION: "OpenAAVEPosition";
            readonly CLOSE_POSITION: "CloseAAVEPosition_3";
            readonly INCREASE_POSITION: "IncreaseAAVEPosition";
            readonly DECREASE_POSITION: "DecreaseAAVEPosition";
            readonly DEPOSIT_BORROW: "AAVEDepositBorrow";
            readonly OPEN_DEPOSIT_BORROW: "AAVEOpenDepositBorrow";
            readonly DEPOSIT: "AAVEDeposit";
            readonly BORROW: "AAVEBorrow";
            readonly PAYBACK_WITHDRAW: "AAVEPaybackWithdraw_2";
        };
        readonly v3: {
            readonly OPEN_POSITION: "OpenAAVEV3Position";
            readonly CLOSE_POSITION: "CloseAAVEV3Position_2";
            readonly ADJUST_RISK_UP: "AdjustRiskUpAAVEV3Position";
            readonly ADJUST_RISK_DOWN: "AdjustRiskDownAAVEV3Position";
            readonly DEPOSIT_BORROW: "AAVEV3DepositBorrow";
            readonly OPEN_DEPOSIT_BORROW: "AAVEV3OpenDepositBorrow";
            readonly DEPOSIT: "AAVEV3Deposit";
            readonly BORROW: "AAVEV3Borrow";
            readonly PAYBACK_WITHDRAW: "AAVEV3PaybackWithdraw";
        };
    };
    readonly maker: {
        readonly OPEN_AND_DRAW: "OpenAndDraw";
        readonly OPEN_DRAW_AND_CLOSE: "OpenDrawAndClose";
        readonly INCREASE_MULTIPLE: "IncreaseMultiple";
        readonly INCREASE_MULTIPLE_WITH_DAI_TOP_UP: "IncreaseMultipleWithDaiTopup";
        readonly INCREASE_MULTIPLE_WITH_COLL_TOP_UP: "IncreaseMultipleWithCollateralTopup";
        readonly INCREASE_MULTIPLE_WITH_DAI_AND_COLL_TOP_UP: "IncreaseMultipleWithDaiAndCollTopup";
        readonly INCREASE_MULTIPLE_WITH_FLASHLOAN: "IncreaseMultipleWithFlashloan";
        readonly INCREASE_MULTIPLE_WITH_FLASHLOAN_AND_DAI_AND_COLL_TOP_UP: "IncreaseMultipleWithFlashloanWithDaiAndCollTopup";
    };
    readonly common: {
        readonly CUSTOM_OPERATION: "CustomOperation";
    };
};
type ValuesOf<T> = T[keyof T];
type AaveV2Operations = ValuesOf<(typeof OPERATION_NAMES)['aave']['v2']>;
type AaveV3Operations = ValuesOf<(typeof OPERATION_NAMES)['aave']['v3']>;
type MakerOperations = ValuesOf<(typeof OPERATION_NAMES)['maker']>;
type CommonOperations = ValuesOf<(typeof OPERATION_NAMES)['common']>;
export type OperationNames = CommonOperations | AaveV2Operations | AaveV3Operations | MakerOperations;
export {};
//# sourceMappingURL=operation-names.d.ts.map