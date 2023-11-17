export {
  getAvailableRefinanceOperationsNames,
  getRefinanceOperation,
  getRefinanceOperationDefinition,
  getRefinanceOperationName,
} from './refinance.operations'

/**
 * Import all refinance operations here to make them self-register
 */
import './aave/borrow/v3/refinance.aave.flashloan.calls'
import './aave/borrow/v3/refinance.aave.close.calls'
import './aave/borrow/v3/refinance.aave.open-deposit-borrow.calls'
import './common/refinance-swap-close-to-open.calls'
