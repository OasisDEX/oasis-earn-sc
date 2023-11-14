import { MAX_UINT } from '@dma-common/constants'
import { actions } from '@dma-library/actions'
import { registerRefinanceOperation } from '@dma-library/operations/refinance/refinance.operations'
import {
  RefinancePartialOperationDefinition,
  RefinancePartialOperationGenerator,
  RefinancePartialOperationType,
} from '@dma-library/operations/refinance/types'
import { WithProxy } from '@dma-library/types'
import {
  WithAaveLikeStrategyAddresses,
  WithFlashloanProvider,
  WithNetwork,
  WithPaybackAll,
  WithPositionStatus,
  WithStorageIndex,
} from '@dma-library/types/operations'
import BigNumber from 'bignumber.js'

// Arguments type
type RefinanceCloseV3OperationArgs = WithStorageIndex &
  WithProxy &
  WithFlashloanProvider &
  WithPositionStatus &
  WithPaybackAll &
  WithAaveLikeStrategyAddresses &
  WithNetwork

// Calls generator
const refinanceClose_calls: RefinancePartialOperationGenerator = async _args => {
  const args = _args as RefinanceCloseV3OperationArgs
  const { network, addresses, flashloan, position, proxy, isPaybackAll } = args

  let lastStorageIndex = args.lastStorageIndex

  const setDebtApprovalOnLendingPool = actions.common.setApproval(network, {
    amount: position.debt.amount,
    asset: position.debt.address,
    delegate: addresses.lendingPool,
    sumAmounts: false,
  })

  const wrapEth = actions.common.wrapEth(network, {
    amount: position.debt.amount,
  })

  // +1 write to storage
  const paybackDebt = actions.aave.v3.aaveV3Payback(args.network, {
    asset: position.debt.address,
    amount: position.debt.amount,
    paybackAll: isPaybackAll,
  })
  lastStorageIndex += 1

  const unwrapEthDebt = actions.common.unwrapEth(network, {
    amount: new BigNumber(MAX_UINT),
  })

  const flashloanCalls = [setDebtApprovalOnLendingPool, wrapEth, paybackDebt, unwrapEthDebt]

  const takeAFlashLoan = actions.common.takeAFlashLoan(network, {
    isDPMProxy: proxy.isDPMProxy,
    asset: position.debt.address,
    flashloanAmount: position.debt.amount,
    isProxyFlashloan: true,
    provider: flashloan.provider,
    calls: flashloanCalls,
  })

  return {
    calls: [takeAFlashLoan],
    lastStorageIndex,
  }
}

// Operation definition
const refinanceClose_definition: RefinancePartialOperationDefinition = [
  {
    serviceNamePath: 'common.TAKE_A_FLASHLOAN',
    optional: false,
  },
  {
    serviceNamePath: 'common.SET_APPROVAL',
    optional: false,
  },
  {
    serviceNamePath: 'common.WRAP_ETH',
    optional: true,
  },
  {
    serviceNamePath: 'aave.v3.PAYBACK',
    optional: false,
  },
  {
    serviceNamePath: 'common.UNWRAP_ETH',
    optional: true,
  },
]

registerRefinanceOperation(
  'AAVE_V3',
  RefinancePartialOperationType.Close,
  refinanceClose_calls,
  refinanceClose_definition,
)
