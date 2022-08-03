import ABI from '../../../abi/generated/WrapEth.json'
import { CONTRACT_NAMES } from '../../constants'
import { Action } from '../Action'

export class WrapEthAction extends Action {
  constructor(args: any) {
    super(CONTRACT_NAMES.common.WRAP_ETH, args)

    this.paramTypes = this.getParamTypes(ABI)
  }
}
