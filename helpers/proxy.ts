import { Contract, Signer } from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import DSProxyABI from '../abi/ds-proxy.json'
import { ethers } from 'ethers'

export async function getOrCreateProxy(dsProxyRegistry: Contract, signer: Signer) {
  const address = await signer.getAddress()

  let proxyAddress = await dsProxyRegistry.proxies(address)

  if (proxyAddress === ethers.constants.AddressZero) {
    await (await dsProxyRegistry['build()']()).wait()
    proxyAddress = await dsProxyRegistry.proxies(address)
  }

  return new ethers.Contract(proxyAddress, DSProxyABI, ethers.provider).connect(signer)
}
