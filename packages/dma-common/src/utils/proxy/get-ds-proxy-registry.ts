import { DSProxyRegistry__factory } from '@oasisdex/abis'
import { Signer } from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

export async function getDsProxyRegistry(
  signer: Signer,
  registryAddress: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  hre?: HardhatRuntimeEnvironment,
) {
  return DSProxyRegistry__factory.connect(registryAddress, signer)
}
