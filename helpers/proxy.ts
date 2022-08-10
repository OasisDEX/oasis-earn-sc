import '@nomiclabs/hardhat-ethers'

import { Signer } from 'ethers'
import { ADDRESSES } from 'oasis-actions/src/helpers/addresses'

import DS_PROXY_REGISTRY_ABI from '../abi/ds-proxy-registry.json'

export async function getOrCreateProxy(signer: Signer) {
  const ethers = (await import('hardhat')).ethers
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
