import { AjnaError, MorphoBluePosition } from "@dma-library/types";
import BigNumber from "bignumber.js";
import { validateLiquidity } from "./validateLiquidity";

export function validateBorrowUndercollateralized(position: MorphoBluePosition, targetPosition: MorphoBluePosition, borrowAmount: BigNumber): AjnaError[] {
    if (validateLiquidity(position, borrowAmount).length > 0) {
        return []
    }
    
    if (targetPosition.riskRatio.loanToValue.gt(targetPosition.maxRiskRatio.loanToValue)) {
        return [
            {
                name: 'borrow-undercollateralized',
                data: {
                    amount: borrowAmount.toString()
                }
            }
        ]
    }

    return []
}