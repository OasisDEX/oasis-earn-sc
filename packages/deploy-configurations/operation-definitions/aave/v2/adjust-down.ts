import { CONTRACT_NAMES, OPERATION_NAMES } from '@deploy-configurations/constants'
import { getActionHash } from '@deploy-configurations/utils/action-hash'

export const aaveAdjustDownV2OperationDefinition = {
  name: OPERATION_NAMES.aave.v2.DECREASE_POSITION,
  actions: [
    {
      hash: getActionHash(CONTRACT_NAMES.common.TAKE_A_FLASHLOAN),
      optional: false,
    },
    {
      hash: getActionHash(CONTRACT_NAMES.common.SET_APPROVAL),
      optional: false,
    },
    {
      hash: getActionHash(CONTRACT_NAMES.aave.v2.DEPOSIT),
      optional: false,
    },
    {
      hash: getActionHash(CONTRACT_NAMES.aave.v2.WITHDRAW),
      optional: false,
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
      hash: getActionHash(CONTRACT_NAMES.aave.v2.PAYBACK),
      optional: false,
    },
    {
      hash: getActionHash(CONTRACT_NAMES.aave.v2.WITHDRAW),
      optional: false,
    },
  ],
}
