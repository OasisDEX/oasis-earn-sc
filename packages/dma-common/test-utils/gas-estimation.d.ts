import { TransactionReceipt } from '@ethersproject/providers';
/**
 * Returns save() and print() api
 * Save tx details to estimates array
 * Print all gas costs at end of describe block
 * Inside after() call
 */
export type GasEstimateHelper = {
    save: (txReceipt: TransactionReceipt, testName?: string) => void;
    print: () => void;
};
export declare const gasEstimateHelper: () => GasEstimateHelper;
//# sourceMappingURL=gas-estimation.d.ts.map