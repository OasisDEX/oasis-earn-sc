import { CONTRACT_NAMES, OPERATION_NAMES } from '@deploy-configurations/constants'
import { getActionHash } from '@deploy-configurations/utils/action-hash'

export const aaveAdjustUpV3OperationDefinition = {
  name: OPERATION_NAMES.aave.v3.ADJUST_RISK_UP,
  actions: [
    {
      hash: getActionHash(CONTRACT_NAMES.common.TAKE_A_FLASHLOAN),
      optional: false,
    },
    {
      hash: getActionHash(CONTRACT_NAMES.common.PULL_TOKEN),
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
    {
      hash: getActionHash(CONTRACT_NAMES.aave.v3.BORROW),
      optional: false,
    },
    {
      hash: getActionHash(CONTRACT_NAMES.common.WRAP_ETH),
      optional: true,
    },
    {
      hash: getActionHash(CONTRACT_NAMES.common.SWAP_ACTION),
      optional: false,
    },
    {
      hash: getActionHash(CONTRACT_NAMES.common.SET_APPROVAL),
      optional: false,
    },
    {
      hash: getActionHash(CONTRACT_NAMES.aave.v3.DEPOSIT),
      optional: false,
    },
    {
      hash: getActionHash(CONTRACT_NAMES.aave.v3.WITHDRAW),
      optional: false,
    },
  ],
}
