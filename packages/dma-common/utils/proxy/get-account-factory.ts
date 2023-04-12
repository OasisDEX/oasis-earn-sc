import DPM_ACCOUNT_FACTORY_ABI from '@oasisdex/abis/external/libs/DPM/account-factory.json'
import { Signer } from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { Address } from '../../types/address'

export async function getAccountFactory(
  signer: Signer,
  factoryAddress: Address,
  hre?: HardhatRuntimeEnvironment,
) {
  const ethers = hre?.ethers || (await import('hardhat')).ethers
  const dpmAccountFactory = await ethers.getContractAt(
    DPM_ACCOUNT_FACTORY_ABI,
    factoryAddress,
    signer,
  )
  return dpmAccountFactory
}
