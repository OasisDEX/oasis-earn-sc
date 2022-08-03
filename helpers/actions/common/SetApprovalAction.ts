import ABI from '../../../abi/generated/SetApproval.json'
import { CONTRACT_NAMES } from '../../constants'
import { Action } from '../Action'

export class SetApprovalAction extends Action {
  constructor(args: any, paramMapping: number[]) {
    super(CONTRACT_NAMES.common.SET_APPROVAL, args, paramMapping)

    this.paramTypes = this.getParamTypes(ABI)
  }
}
