import { CONTRACT_NAMES, OPERATION_NAMES } from '@dma-deployments/constants'
import { getActionHash } from '@dma-deployments/utils/action-hash'

export const aaveCloseV2OperationDefinition = {
  name: OPERATION_NAMES.aave.v2.CLOSE_POSITION,
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
    {
      hash: getActionHash(CONTRACT_NAMES.common.UNWRAP_ETH),
      optional: true,
    },
    {
      hash: getActionHash(CONTRACT_NAMES.common.RETURN_FUNDS),
      optional: false,
    },
    {
      hash: getActionHash(CONTRACT_NAMES.common.RETURN_FUNDS),
      optional: false,
    },
  ],
}
