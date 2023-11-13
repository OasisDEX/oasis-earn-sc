export {
  getAvailableRefinanceOperationsNames,
  getRefinanceOperation,
  getRefinanceOperationName,
} from './refinance.operations'

import * as AAVEClose from './aave/borrow/v3/refinance.aave.close.calls'
import * as AAVEOpen from './aave/borrow/v3/refinance.aave.open-deposit-borrow.calls'
import * as CommonSwap from './common/refinance-swap.calls'

/**
 * This line forces Typescript to load all the above modules so they can self-register
 */
export const __refinance_operations = [AAVEClose, AAVEOpen, CommonSwap]
