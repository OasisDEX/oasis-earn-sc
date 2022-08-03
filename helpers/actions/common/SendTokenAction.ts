import ABI from '../../../abi/generated/SendToken.json'
import { CONTRACT_NAMES } from '../../constants'
import { Action } from '../Action'

export class SendTokenAction extends Action {
  constructor(args: any) {
    super(CONTRACT_NAMES.common.SEND_TOKEN, args)

    this.paramTypes = this.getParamTypes(ABI)
  }
}
