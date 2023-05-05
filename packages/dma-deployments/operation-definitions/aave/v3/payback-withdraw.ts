import { CONTRACT_NAMES, OPERATION_NAMES } from '@dma-deployments/constants'
import { getActionHash } from '@dma-deployments/utils/action-hash'

export const aavePaybackWithdrawV3OperationDefinition = {
  name: OPERATION_NAMES.aave.v3.PAYBACK_WITHDRAW,
  actions: [
    {
      hash: getActionHash(CONTRACT_NAMES.common.PULL_TOKEN),
      optional: true,
    },
    {
      hash: getActionHash(CONTRACT_NAMES.common.SET_APPROVAL),
      optional: true,
    },
    {
      hash: getActionHash(CONTRACT_NAMES.common.WRAP_ETH),
      optional: true,
    },
    {
      hash: getActionHash(CONTRACT_NAMES.aave.v3.PAYBACK),
      optional: true,
    },
    {
      hash: getActionHash(CONTRACT_NAMES.common.UNWRAP_ETH),
      optional: true,
    },
    {
      hash: getActionHash(CONTRACT_NAMES.common.RETURN_FUNDS),
      optional: true,
    },
    {
      hash: getActionHash(CONTRACT_NAMES.aave.v3.WITHDRAW),
      optional: true,
    },
    {
      hash: getActionHash(CONTRACT_NAMES.common.UNWRAP_ETH),
      optional: true,
    },
    {
      hash: getActionHash(CONTRACT_NAMES.common.RETURN_FUNDS),
      optional: true,
    },
  ],
}
