import { loadContractNames, OPERATION_NAMES } from '@deploy-configurations/constants'
import { Network } from '@deploy-configurations/types/network'
import { getActionHash } from '@deploy-configurations/utils/action-hash'

/**
 * This operation definition has:
 * - no wrapping/unwrapping of WETH/ETHs
 * - uses balancer so flashloan's the precise amount of debt required to achieve the desired risk level
 * - does not support deposits in conjunction with increasing the risk level
 */
export function getAaveAdjustUpV3OperationDefinition(network: Network) {
  const SERVICE_REGISTRY_NAMES = loadContractNames(network)

  return {
    name: OPERATION_NAMES.aave.v3.ADJUST_RISK_UP,
    actions: [
      {
        hash: getActionHash(SERVICE_REGISTRY_NAMES.common.TAKE_A_FLASHLOAN_BALANCER),
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
        hash: getActionHash(SERVICE_REGISTRY_NAMES.aave.v3.BORROW),
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
