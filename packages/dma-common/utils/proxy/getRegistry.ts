import { ethers } from 'hardhat'
import { Signer } from 'ethers'
import DS_PROXY_REGISTRY_ABI from '@oasisdex/dma-contracts/abi/ds-proxy-registry.json'

export async function getDsProxyRegistry(signer: Signer, registryAddress: string) {
  const dsProxyRegistry = await ethers.getContractAt(DS_PROXY_REGISTRY_ABI, registryAddress, signer)
  return dsProxyRegistry
}
