import { Contract } from 'ethers'

export async function createDPMAccount(
  accountFactory: Contract,
  owner?: string,
): Promise<[string | undefined, number | undefined]> {
  if (!accountFactory) {
    throw new Error('Account Factory not found')
  }
  if (!owner) {
    const tx = await accountFactory.functions['createAccount()']()
    const receipt = await tx.wait()

    // eslint-disable-next-line
    return [receipt.events![1].args!.proxy, receipt.events![1].args!.vaultId]
  } else if (owner) {
    const tx = await accountFactory.functions['createAccount(address)'](owner)
    const receipt = await tx.wait()

    // eslint-disable-next-line
    return [receipt.events![1].args!.proxy, receipt.events![1].args!.vaultId]
  }
  throw new Error('DPM Account not created')
}
