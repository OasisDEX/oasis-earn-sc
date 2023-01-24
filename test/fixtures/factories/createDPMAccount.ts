import { ethers } from 'ethers'

import accountFactoryAbi from '../../../abi/account-factory.json'
import { RuntimeConfig } from '../../../helpers/types/common'

export async function createDPMAccount(
  accountFactoryAddress: string,
  { signer }: RuntimeConfig,
): Promise<[string | undefined, number | undefined]> {
  const accountFactory = new ethers.Contract(accountFactoryAddress, accountFactoryAbi, signer)

  const tx = await accountFactory.functions['createAccount()']()
  const receipt = await tx.wait()

  // eslint-disable-next-line
  return [receipt.events![1].args!.proxy, receipt.events![1].args!.vaultId]
}
