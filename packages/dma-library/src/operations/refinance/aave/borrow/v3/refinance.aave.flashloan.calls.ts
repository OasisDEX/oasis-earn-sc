import { actions } from '@dma-library/actions'
import { registerRefinanceOperation } from '@dma-library/operations/refinance/refinance.operations'
import {
  RefinancePartialOperationGenerator,
  RefinancePartialOperationType,
} from '@dma-library/operations/refinance/types'
import { WithProxy } from '@dma-library/types'
import {
  WithAaveLikeStrategyAddresses,
  WithFlashloanProvider,
  WithNetwork,
  WithOptionalActionCalls,
  WithPositionStatus,
  WithStorageIndex,
} from '@dma-library/types/operations'
import { ActionPathDefinition } from '@dma-library/types/operations-definition'

// Arguments type
type RefinanceCloseV3OperationArgs = WithStorageIndex &
  WithProxy &
  WithFlashloanProvider &
  WithPositionStatus &
  WithAaveLikeStrategyAddresses &
  WithNetwork &
  WithOptionalActionCalls

// Calls generator
const refinanceFlashloan_calls: RefinancePartialOperationGenerator = async _args => {
  const args = _args as RefinanceCloseV3OperationArgs
  const { network, flashloan, position, proxy, lastStorageIndex } = args

  const takeAFlashLoan = actions.common.takeAFlashLoan(network, {
    isDPMProxy: proxy.isDPMProxy,
    asset: position.debt.address,
    flashloanAmount: position.debt.amount,
    isProxyFlashloan: true,
    provider: flashloan.provider,
    calls: args.calls ?? [],
  })

  return {
    calls: [takeAFlashLoan],
    lastStorageIndex,
  }
}

// Operation definition
const refinanceFlashloan_definition: ActionPathDefinition[] = [
  {
    serviceNamePath: 'common.TAKE_A_FLASHLOAN',
    optional: false,
  },
]

registerRefinanceOperation(
  'AAVE_V3',
  RefinancePartialOperationType.Flashloan,
  refinanceFlashloan_calls,
  refinanceFlashloan_definition,
)
