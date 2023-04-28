import { utils } from 'ethers';
export declare function buildBytecode(constructorTypes: (string | utils.ParamType)[], constructorArgs: any[], contractBytecode: string): string;
export declare function buildCreate2Address(factoryAddress: string, salt: string, byteCode: string): string;
export declare function saltToHex(salt: string | number): string;
//# sourceMappingURL=create2.d.ts.map