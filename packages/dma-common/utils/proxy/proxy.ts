import DSProxyABI from '@abis/external/libs/DS/ds-proxy.json'
import { DSProxy } from '@dma-contracts/typechain'
import { Contract, ethers, Signer } from 'ethers'

export async function getOrCreateProxy(
  dsProxyRegistry: Contract,
  signer: Signer,
): Promise<DSProxy> {
  const address = await signer.getAddress()

  let proxyAddress = await dsProxyRegistry.proxies(address)

  if (proxyAddress === ethers.constants.AddressZero) {
    await (await dsProxyRegistry['build()']()).wait()
    proxyAddress = await dsProxyRegistry.proxies(address)
  }

  const provider = ethers.getDefaultProvider()
  return new ethers.Contract(proxyAddress, DSProxyABI, provider).connect(signer) as DSProxy
}
