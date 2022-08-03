import ABI from '../../../abi/generated/AaveWithdraw.json'
import { CONTRACT_NAMES } from '../../constants'
import { Action } from '../Action'

export class AaveWithdrawAction extends Action {
  constructor(args: any) {
    super(CONTRACT_NAMES.aave.WITHDRAW, args)

    this.paramTypes = this.getParamTypes(ABI)
  }
}
