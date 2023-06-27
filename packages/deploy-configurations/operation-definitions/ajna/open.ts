import { loadContractNames, OPERATION_NAMES } from '@deploy-configurations/constants'
import { Network } from '@deploy-configurations/types/network'
import { getActionHash } from '@deploy-configurations/utils/action-hash'

const SERVICE_REGISTRY_NAMES = loadContractNames(Network.MAINNET)

export const ajnaOpenOperationDefinition = {
  name: OPERATION_NAMES.ajna.OPEN_MULTIPLY_POSITION,
  actions: [
    {
      hash: getActionHash(SERVICE_REGISTRY_NAMES.common.TAKE_A_FLASHLOAN),
      optional: false,
    },
    {
      hash: getActionHash(SERVICE_REGISTRY_NAMES.common.PULL_TOKEN),
      optional: true,
    },
    {
      hash: getActionHash(SERVICE_REGISTRY_NAMES.common.WRAP_ETH),
      optional: true,
    },
    {
      hash: getActionHash(SERVICE_REGISTRY_NAMES.common.SWAP_ACTION),
      optional: false,
    },
    {
      hash: getActionHash(SERVICE_REGISTRY_NAMES.common.SET_APPROVAL),
      optional: false,
    },
    {
      hash: getActionHash(SERVICE_REGISTRY_NAMES.ajna.DEPOSIT_BORROW),
      optional: false,
    },
    {
      hash: getActionHash(SERVICE_REGISTRY_NAMES.common.SEND_TOKEN),
      optional: false,
    },
    { hash: getActionHash(SERVICE_REGISTRY_NAMES.common.POSITION_CREATED), optional: false },
  ],
}
