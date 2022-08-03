import ABI from '../../../abi/generated/AaveDeposit.json'
import { CONTRACT_NAMES } from '../../constants'
import { Action } from '../Action'

export class AaveDepositAction extends Action {
  constructor(args: any, paramMapping: number[]) {
    super(CONTRACT_NAMES.aave.DEPOSIT, args, paramMapping)

    this.paramTypes = this.getParamTypes(ABI)
  }
}
