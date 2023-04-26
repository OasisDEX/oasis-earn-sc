"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OPERATION_NAMES = void 0;
exports.OPERATION_NAMES = {
    aave: {
        v2: {
            OPEN_POSITION: 'OpenAAVEPosition',
            CLOSE_POSITION: 'CloseAAVEPosition_3',
            INCREASE_POSITION: 'IncreaseAAVEPosition',
            DECREASE_POSITION: 'DecreaseAAVEPosition',
            DEPOSIT_BORROW: 'AAVEDepositBorrow',
            OPEN_DEPOSIT_BORROW: 'AAVEOpenDepositBorrow',
            DEPOSIT: 'AAVEDeposit',
            BORROW: 'AAVEBorrow',
            PAYBACK_WITHDRAW: 'AAVEPaybackWithdraw_2',
        },
        v3: {
            OPEN_POSITION: 'OpenAAVEV3Position',
            CLOSE_POSITION: 'CloseAAVEV3Position_2',
            ADJUST_RISK_UP: 'AdjustRiskUpAAVEV3Position',
            ADJUST_RISK_DOWN: 'AdjustRiskDownAAVEV3Position',
            DEPOSIT_BORROW: 'AAVEV3DepositBorrow',
            OPEN_DEPOSIT_BORROW: 'AAVEV3OpenDepositBorrow',
            DEPOSIT: 'AAVEV3Deposit',
            BORROW: 'AAVEV3Borrow',
            PAYBACK_WITHDRAW: 'AAVEV3PaybackWithdraw',
        },
    },
    maker: {
        OPEN_AND_DRAW: 'OpenAndDraw',
        OPEN_DRAW_AND_CLOSE: 'OpenDrawAndClose',
        INCREASE_MULTIPLE: 'IncreaseMultiple',
        INCREASE_MULTIPLE_WITH_DAI_TOP_UP: 'IncreaseMultipleWithDaiTopup',
        INCREASE_MULTIPLE_WITH_COLL_TOP_UP: 'IncreaseMultipleWithCollateralTopup',
        INCREASE_MULTIPLE_WITH_DAI_AND_COLL_TOP_UP: 'IncreaseMultipleWithDaiAndCollTopup',
        INCREASE_MULTIPLE_WITH_FLASHLOAN: 'IncreaseMultipleWithFlashloan',
        INCREASE_MULTIPLE_WITH_FLASHLOAN_AND_DAI_AND_COLL_TOP_UP: 'IncreaseMultipleWithFlashloanWithDaiAndCollTopup',
    },
    common: {
        CUSTOM_OPERATION: 'CustomOperation',
    },
};
