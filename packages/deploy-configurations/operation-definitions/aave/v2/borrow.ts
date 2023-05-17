import { CONTRACT_NAMES, OPERATION_NAMES } from '@deploy-configurations/constants'
import { getActionHash } from '@deploy-configurations/utils/action-hash'

export const aaveBorrowV2OperationDefinition = {
  name: OPERATION_NAMES.aave.v2.BORROW,
  actions: [
    {
      hash: getActionHash(CONTRACT_NAMES.aave.v2.BORROW),
      optional: false,
    },
    {
      hash: getActionHash(CONTRACT_NAMES.common.UNWRAP_ETH),
      optional: true,
    },
    {
      hash: getActionHash(CONTRACT_NAMES.common.RETURN_FUNDS),
      optional: false,
    },
  ],
}
