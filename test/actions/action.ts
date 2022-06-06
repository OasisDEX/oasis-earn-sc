import { utils } from "ethers";

export class Action {
  contractAddress: string;
  paramTypes: Array<string>;
  name: string;
  params: Array<any>;
  paramsMapping: Array<any>;

  constructor(name, contractAddress, paramTypes, params, paramsMapping) {
    if (paramTypes.length !== params.length)
      throw new Error("Params/param types length mismatch");

    this.contractAddress = contractAddress;
    this.params = params;
    this.paramTypes = paramTypes;
    this.name = name;
    this.paramsMapping = paramsMapping;
  }

  getId() {
    return utils.keccak256(utils.toUtf8Bytes(this.name));
  }

  getMapping() {
    return this.paramsMapping;
  }

  encodeParams() {
    return this.params.map((param: any, i: number) => {
      return utils.defaultAbiCoder.encode([this.paramTypes[i]], [param]);
    });
  }
}
