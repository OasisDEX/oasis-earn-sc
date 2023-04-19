import { CONTRACT_NAMES } from '@dma-deployments/constants/contract-names'
import { OPERATION_NAMES } from '@dma-deployments/constants/operation-names'
import { getActionHash } from '@dma-deployments/utils/action-hash'

export const aaveOpenV2OperationDefinition = {
  name: OPERATION_NAMES.aave.v2.OPEN_POSITION,
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
      hash: getActionHash(CONTRACT_NAMES.common.PULL_TOKEN),
      optional: true,
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
      hash: getActionHash(CONTRACT_NAMES.aave.v2.BORROW),
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
      hash: getActionHash(CONTRACT_NAMES.aave.v2.DEPOSIT),
      optional: false,
    },
    {
      hash: getActionHash(CONTRACT_NAMES.aave.v2.WITHDRAW),
      optional: false,
    },
    { hash: getActionHash(CONTRACT_NAMES.common.POSITION_CREATED), optional: false },
  ],
}
