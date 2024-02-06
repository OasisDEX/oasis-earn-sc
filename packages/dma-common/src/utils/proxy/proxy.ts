import { DsProxy__factory } from '@oasisdex/abis'
import { Contract, ethers, Signer } from 'ethers'

export async function getOrCreateProxy(
  dsProxyRegistry: Contract,
  signer: Signer,
): Promise<Contract> {
  const address = await signer.getAddress()

  let proxyAddress = await dsProxyRegistry.proxies(address)

  if (proxyAddress === ethers.constants.AddressZero) {
    await (await dsProxyRegistry['build()']()).wait()
    proxyAddress = await dsProxyRegistry.proxies(address)
  }

  return DsProxy__factory.connect(proxyAddress, signer)
}
