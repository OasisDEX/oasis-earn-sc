import { loadContractNames, OPERATION_NAMES } from '@deploy-configurations/constants'
import { Network } from '@deploy-configurations/types/network'
import { getActionHash } from '@deploy-configurations/utils/action-hash'

const SERVICE_REGISTRY_NAMES = loadContractNames(Network.MAINNET)

export const ajnaAdjustDownOperationDefinition = {
  name: OPERATION_NAMES.ajna.ADJUST_RISK_DOWN,
  actions: [
    {
      hash: getActionHash(SERVICE_REGISTRY_NAMES.common.TAKE_A_FLASHLOAN),
      optional: false,
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
      hash: getActionHash(SERVICE_REGISTRY_NAMES.ajna.REPAY_WITHDRAW),
      optional: false,
    },
    {
      hash: getActionHash(SERVICE_REGISTRY_NAMES.common.UNWRAP_ETH),
      optional: true,
    },
    {
      hash: getActionHash(SERVICE_REGISTRY_NAMES.common.RETURN_FUNDS),
      optional: false,
    },
    {
      hash: getActionHash(SERVICE_REGISTRY_NAMES.common.RETURN_FUNDS),
      optional: false,
    },
  ],
}
