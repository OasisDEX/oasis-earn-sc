import { Address } from '@deploy-configurations/types/address'
import * as AddressesUtils from '@dma-common/utils/addresses/index'

export function getIsSwapNeeded(
  entryTokenAddress: Address,
  depositTokenAddress: Address,
  ETHAddress: Address,
  WETHAddress: Address,
) {
  const sameTokens = AddressesUtils.areAddressesEqual(depositTokenAddress, entryTokenAddress)
  const ethToWeth =
    AddressesUtils.areAddressesEqual(entryTokenAddress, ETHAddress) &&
    AddressesUtils.areAddressesEqual(depositTokenAddress, WETHAddress)

  return !(sameTokens || ethToWeth)
}
