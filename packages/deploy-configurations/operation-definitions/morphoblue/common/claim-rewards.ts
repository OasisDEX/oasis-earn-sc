import { loadContractNames, OPERATION_NAMES } from '@deploy-configurations/constants'
import { Network } from '@deploy-configurations/types/network'
import { getActionHash } from '@deploy-configurations/utils/action-hash'

export function getMorphoBlueClaimRewardsOperationDefinition(network: Network) {
  const SERVICE_REGISTRY_NAMES = loadContractNames(network)

  return {
    name: OPERATION_NAMES.morphoblue.CLAIM_REWARDS,
    actions: [
      {
        hash: getActionHash(SERVICE_REGISTRY_NAMES.morphoblue.CLAIM_REWARDS),
        optional: false,
      },
      {
        hash: getActionHash(SERVICE_REGISTRY_NAMES.common.RETURN_MULTIPLE_TOKENS),
        optional: false,
      },
    ],
    log: false,
  }
}
