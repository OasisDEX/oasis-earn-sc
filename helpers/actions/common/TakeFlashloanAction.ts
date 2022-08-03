import ABI from '../../../abi/generated/TakeFlashloan.json'
import { CONTRACT_NAMES } from '../../constants'
import { Action } from '../Action'

export class TakeFlashloanAction extends Action {
  constructor(args: any) {
    super(CONTRACT_NAMES.common.TAKE_A_FLASHLOAN, args)

    this.paramTypes = this.getParamTypes(ABI)
  }
}
