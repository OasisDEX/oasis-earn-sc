import { loadContractNames, OPERATION_NAMES } from '@deploy-configurations/constants'
import { Network } from '@deploy-configurations/types/network'
import { getActionHash } from '@deploy-configurations/utils/action-hash'

export function getMorphoBluePaybackWithdrawOperationDefinition(network: Network) {
  const SERVICE_REGISTRY_NAMES = loadContractNames(network)

  return {
    name: OPERATION_NAMES.morphoblue.PAYBACK_WITHDRAW,
    actions: [
      {
        hash: getActionHash(SERVICE_REGISTRY_NAMES.common.PULL_TOKEN),
        optional: true,
      },
      {
        hash: getActionHash(SERVICE_REGISTRY_NAMES.common.SET_APPROVAL),
        optional: true,
      },
      {
        hash: getActionHash(SERVICE_REGISTRY_NAMES.common.WRAP_ETH),
        optional: true,
      },
      {
        hash: getActionHash(SERVICE_REGISTRY_NAMES.morphoblue.PAYBACK),
        optional: true,
      },
      {
        hash: getActionHash(SERVICE_REGISTRY_NAMES.common.UNWRAP_ETH),
        optional: true,
      },
      {
        hash: getActionHash(SERVICE_REGISTRY_NAMES.common.RETURN_FUNDS),
        optional: true,
      },
      {
        hash: getActionHash(SERVICE_REGISTRY_NAMES.morphoblue.WITHDRAW),
        optional: true,
      },
      {
        hash: getActionHash(SERVICE_REGISTRY_NAMES.common.UNWRAP_ETH),
        optional: true,
      },
      {
        hash: getActionHash(SERVICE_REGISTRY_NAMES.common.RETURN_FUNDS),
        optional: true,
      },
    ],
    log: false,
  }
}
