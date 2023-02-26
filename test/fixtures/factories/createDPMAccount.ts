import { Contract, ethers } from 'ethers'

import accountFactoryAbi from '../../../abi/account-factory.json'
import { RuntimeConfig } from '../../../helpers/types/common'

export async function createDPMAccount(
  accountFactory: Contract,
  { signer }: RuntimeConfig,
): Promise<[string | undefined, number | undefined]> {
  const tx = await accountFactory.functions['createAccount()']()
  const receipt = await tx.wait()
  // eslint-disable-next-line
  return [receipt.events![1].args!.proxy, receipt.events![1].args!.vaultId]
}
