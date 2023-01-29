import { ADDRESSES } from '@oasisdex/oasis-actions'
import { Signer } from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import DS_PROXY_REGISTRY_ABI from '../abi/ds-proxy-registry.json'

export async function getOrCreateProxy(signer: Signer, hre?: HardhatRuntimeEnvironment) {
  const ethers = hre ? hre.ethers : (await import('hardhat')).ethers
  const address = await signer.getAddress()
  
  const dsProxyRegistry = await ethers.getContractAt(
    DS_PROXY_REGISTRY_ABI,
    ADDRESSES.goerli.proxyRegistry,
    signer,
  )

  let proxyAddress = await dsProxyRegistry.proxies(address)

  if (proxyAddress === ethers.constants.AddressZero) {
    await (await dsProxyRegistry['build()']()).wait()
    proxyAddress = await dsProxyRegistry.proxies(address)
  }

  return proxyAddress
}
