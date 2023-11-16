import { Address } from '@deploy-configurations/types/address'

/**
 * Returns the token address that should be used as input for the swap
 *
 * @param entryTokenAddress Token address of the user funds that are being used in the operation
 * @param depositTokenAddress Token address of the actual token that can be deposited in the protocol
 * @param ETHAddress Address of the ETH token
 * @param WETHAddress Address of the WETH token
 *
 * @returns The token address that should be used as input for the swap
 */
export function getSwapInputToken(
  entryTokenAddress: Address,
  ETHAddress: Address,
  WETHAddress: Address,
) {
  return entryTokenAddress != ETHAddress ? entryTokenAddress : WETHAddress
}
