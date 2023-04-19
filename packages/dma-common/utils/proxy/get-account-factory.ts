import DPM_ACCOUNT_FACTORY_ABI from '@oasisdex/abis/external/libs/DPM/account-factory.json'
import { Address } from '@oasisdex/dma-deployments/types/address'
import { Signer } from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

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
