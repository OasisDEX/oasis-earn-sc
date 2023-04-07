import DS_PROXY_REGISTRY_ABI from '@oasisdex/abis/external/libs/DS/ds-proxy-registry.json'
import { Signer } from 'ethers'
import { ethers } from 'hardhat'

export async function getDsProxyRegistry(signer: Signer, registryAddress: string) {
  const dsProxyRegistry = await ethers.getContractAt(DS_PROXY_REGISTRY_ABI, registryAddress, signer)
  return dsProxyRegistry
}
