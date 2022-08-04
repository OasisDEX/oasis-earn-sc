import ABI from "../../../abi/generated/DummySwap.json"
import { CONTRACT_NAMES } from "../../constants";
import { Action } from "../Action";

export class DummySwapAction extends Action {

    constructor(args: any, paramMapping: number[]) {
      super(CONTRACT_NAMES.test.DUMMY_SWAP, args, paramMapping);
      
      this.paramTypes = this.getParamTypes(ABI);
    }
  }