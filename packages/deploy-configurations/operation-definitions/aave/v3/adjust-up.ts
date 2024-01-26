import { loadContractNames, OPERATION_NAMES } from '@deploy-configurations/constants'
import { Network } from '@deploy-configurations/types/network'
import { getActionHash } from '@deploy-configurations/utils/action-hash'

export function getAaveAdjustUpV3OperationDefinition(network: Network) {
  console.log('NETWORK', network );
  
  const SERVICE_REGISTRY_NAMES = loadContractNames(network)

  return {
    name: OPERATION_NAMES.aave.v3.ADJUST_RISK_UP,
    actions: [
      {
        hash: getActionHash(SERVICE_REGISTRY_NAMES.common.TAKE_A_FLASHLOAN_BALANCER),
        optional: false,
      },
      // {
      //   hash: getActionHash(SERVICE_REGISTRY_NAMES.common.PULL_TOKEN),
      //   optional: true,
      // },
      {
        hash: getActionHash(SERVICE_REGISTRY_NAMES.common.SET_APPROVAL),
        optional: false,
      },
      {
        hash: getActionHash(SERVICE_REGISTRY_NAMES.aave.v3.DEPOSIT),
        optional: false,
      },
      {
        hash: getActionHash(SERVICE_REGISTRY_NAMES.aave.v3.BORROW),
        optional: false,
      },
      // {
      //   hash: getActionHash(SERVICE_REGISTRY_NAMES.common.WRAP_ETH),
      //   optional: true,
      // },
      {
        hash: getActionHash(SERVICE_REGISTRY_NAMES.common.SWAP_ACTION),
        optional: false,
      },
      {
        hash: getActionHash(SERVICE_REGISTRY_NAMES.common.SET_APPROVAL),
        optional: false,
      },
      {
        hash: getActionHash(SERVICE_REGISTRY_NAMES.aave.v3.DEPOSIT),
        optional: false,
      },
      {
        hash: getActionHash(SERVICE_REGISTRY_NAMES.aave.v3.WITHDRAW_AUTO),
        optional: false,
      },
    ],
  }
}
