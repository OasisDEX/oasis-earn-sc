import ABI from '../../../abi/generated/PullToken.json'
import { CONTRACT_NAMES } from '../../constants'
import { Action } from '../Action'

export class PullTokenAction extends Action {
  constructor(args: any) {
    super(CONTRACT_NAMES.common.PULL_TOKEN, args)

    this.paramTypes = this.getParamTypes(ABI)
  }
}
