import { Contract } from 'ethers'

export async function createDPMAccount(
  accountFactory: Contract,
): Promise<[string | undefined, number | undefined]> {
  const tx = await accountFactory.functions['createAccount()']()
  const receipt = await tx.wait()

  // eslint-disable-next-line
  return [receipt.events![1].args!.proxy, receipt.events![1].args!.vaultId]
}
