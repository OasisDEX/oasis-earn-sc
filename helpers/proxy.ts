import { Contract, ethers, Signer } from 'ethers'

import DSProxyABI from '../abi/ds-proxy.json'

export async function getOrCreateProxy(dsProxyRegistry: Contract, signer: Signer) {
  const address = await signer.getAddress()

  let proxyAddress = await dsProxyRegistry.proxies(address)

  if (proxyAddress === ethers.constants.AddressZero) {
    await (await dsProxyRegistry['build()']()).wait()
    proxyAddress = await dsProxyRegistry.proxies(address)
  }

  const provider = ethers.getDefaultProvider()
  return new ethers.Contract(proxyAddress, DSProxyABI, provider).connect(signer)
}
