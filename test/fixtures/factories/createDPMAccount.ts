import { ethers } from 'ethers'

import accountFactoryAbi from '../../../abi/account-factory.json'
import { RuntimeConfig } from '../../../helpers/types/common'
import { AccountFactory } from '../../../typechain/contracts/test/dpm'

export async function createDPMAccount(
  accountFactoryAddress: string,
  { signer }: RuntimeConfig,
): Promise<string | undefined> {
  const accountFactory = new ethers.Contract(
    accountFactoryAddress,
    accountFactoryAbi,
    signer,
  ) as AccountFactory

  const tx = await accountFactory.functions['createAccount()']()
  const receipt = await tx.wait()

  // const eventSignature = ethers.utils.hexlify(
  //   ethers.utils.keccak256(ethers.utils.toUtf8Bytes('AccountCreated(address,address,uint256)')),
  // )

  // eslint-disable-next-line
  return receipt.events![1].args!.proxy
}
