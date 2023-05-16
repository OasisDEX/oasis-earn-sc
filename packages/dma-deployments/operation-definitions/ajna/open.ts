import { CONTRACT_NAMES, OPERATION_NAMES } from '@dma-deployments/constants'
import { getActionHash } from '@dma-deployments/utils/action-hash'

export const ajnaOpenOperationDefinition = {
  name: OPERATION_NAMES.ajna.OPEN_MULTIPLY_POSITION,
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
      hash: getActionHash(CONTRACT_NAMES.ajna.DEPOSIT_BORROW),
      optional: false,
    },
    { hash: getActionHash(CONTRACT_NAMES.common.POSITION_CREATED), optional: false },
  ],
}
