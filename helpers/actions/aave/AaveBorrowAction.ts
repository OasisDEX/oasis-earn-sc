import ABI from "../../../abi/generated/AaveBorrow.json"
import { CONTRACT_NAMES } from "../../constants";
import { Action } from "../Action";

export class AaveBorrowAction extends Action {

    constructor(args: any) {
      super(CONTRACT_NAMES.aave.BORROW, args);
      
      this.paramTypes = this.getParamTypes(ABI);
    }
  }