import DS_PROXY_REGISTRY_ABI from '@oasisdex/abis/external/libs/DS/ds-proxy-registry.json'
import { Signer } from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

export async function getDsProxyRegistry(
  signer: Signer,
  registryAddress: string,
  hre?: HardhatRuntimeEnvironment,
) {
  const ethers = hre?.ethers || (await import('hardhat')).ethers
  return await ethers.getContractAt(DS_PROXY_REGISTRY_ABI, registryAddress, signer)
}
