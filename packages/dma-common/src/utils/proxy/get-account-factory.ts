import { AccountFactory__factory } from '@oasisdex/abis'
import { Address } from '@oasisdex/deploy-configurations/types'
import { Signer } from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

export async function getAccountFactory(
  signer: Signer,
  factoryAddress: Address,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  hre?: HardhatRuntimeEnvironment,
) {
  return AccountFactory__factory.connect(factoryAddress, signer)
}
