import { loadContractNames, OPERATION_NAMES } from '@deploy-configurations/constants'
import { Network } from '@deploy-configurations/types/network'
import { getActionHash } from '@deploy-configurations/utils/action-hash'

export function getMakerToSparkOperationDefinition(network: Network) {
  const SERVICE_REGISTRY_NAMES = loadContractNames(network)

  return {
    name: OPERATION_NAMES.refinance.MAKER_TO_SPARK,
    actions: [
      {
        hash: getActionHash(SERVICE_REGISTRY_NAMES.common.TAKE_A_FLASHLOAN),
        optional: false,
      },
      {
        hash: getActionHash(SERVICE_REGISTRY_NAMES.maker.PAYBACK),
        optional: false,
      },
      {
        hash: getActionHash(SERVICE_REGISTRY_NAMES.maker.WITHDRAW),
        optional: false,
      },
      {
        hash: getActionHash(SERVICE_REGISTRY_NAMES.common.SET_APPROVAL),
        optional: false,
      },
      {
        hash: getActionHash(SERVICE_REGISTRY_NAMES.spark.DEPOSIT),
        optional: false,
      },
      {
        hash: getActionHash(SERVICE_REGISTRY_NAMES.spark.BORROW),
        optional: false,
      },
      {
        hash: getActionHash(SERVICE_REGISTRY_NAMES.common.SEND_TOKEN),
        optional: false,
      },
    ],
  }
}
