import BigNumber from 'bignumber.js';
export declare function toBeEqual(lhs: BigNumber.Value, rhs: BigNumber.Value, precision?: number, message?: string): void;
type ToBeEqualParams = Parameters<typeof toBeEqual>;
export declare function toBe(lhs: BigNumber.Value, comp: 'gt' | 'lt' | 'gte' | 'lte', rhs: BigNumber.Value, message?: string): void;
type ToBeParams = Parameters<typeof toBe>;
export declare function revert(expression: RegExp, tx: Promise<unknown>): Promise<void>;
type RevertParams = Parameters<typeof revert>;
declare class Callable extends Function {
    constructor();
    _call(val: any, message?: string | undefined): Chai.Assertion;
    toBe(...args: ToBeParams): void;
    toBeEqual(...args: ToBeEqualParams): void;
    revert(...args: RevertParams): Promise<void>;
}
declare const expect: Callable;
export { expect };
//# sourceMappingURL=expect.d.ts.map