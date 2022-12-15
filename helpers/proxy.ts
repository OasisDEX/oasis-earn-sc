import { ADDRESSES } from '@oasisdex/oasis-actions'
import { Signer } from 'ethers'

import DS_PROXY_REGISTRY_ABI from '../abi/ds-proxy-registry.json'
import { HardhatEthers } from './types/common'

export async function getOrCreateProxy(signer: Signer, ethers: HardhatEthers) {
  const address = await signer.getAddress()

  const dsProxyRegistry = await ethers.getContractAt(
    DS_PROXY_REGISTRY_ABI,
    ADDRESSES.main.proxyRegistry,
    signer,
  )

  let proxyAddress = await dsProxyRegistry.proxies(address)

  if (proxyAddress === ethers.constants.AddressZero) {
    await (await dsProxyRegistry['build()']()).wait()
    proxyAddress = await dsProxyRegistry.proxies(address)
  }

  return proxyAddress
}
