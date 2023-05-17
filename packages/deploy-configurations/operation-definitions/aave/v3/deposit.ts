import { CONTRACT_NAMES, OPERATION_NAMES } from '@deploy-configurations/constants'
import { getActionHash } from '@deploy-configurations/utils/action-hash'

export const aaveDepositV3OperationDefinition = {
  name: OPERATION_NAMES.aave.v3.DEPOSIT,
  actions: [
    {
      hash: getActionHash(CONTRACT_NAMES.common.WRAP_ETH),
      optional: true,
    },
    {
      hash: getActionHash(CONTRACT_NAMES.common.PULL_TOKEN),
      optional: true,
    },
    {
      hash: getActionHash(CONTRACT_NAMES.common.SWAP_ACTION),
      optional: true,
    },
    {
      hash: getActionHash(CONTRACT_NAMES.common.SET_APPROVAL),
      optional: false,
    },
    {
      hash: getActionHash(CONTRACT_NAMES.aave.v3.DEPOSIT),
      optional: false,
    },
  ],
}
