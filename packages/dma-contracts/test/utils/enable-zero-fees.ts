import { DeploymentSystem } from '@dma-contracts/scripts/deployment/deploy'
import { TestHelpers } from '@dma-contracts/utils'
import { Swap } from '@typechain'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

export async function enableZeroFee(
  hre: HardhatRuntimeEnvironment,
  ds: DeploymentSystem,
  helpers: TestHelpers, // eslint-disable-line @typescript-eslint/no-unused-vars
  extraDeployment: any, // eslint-disable-line @typescript-eslint/no-unused-vars
  useFallbackSwap: boolean, // eslint-disable-line @typescript-eslint/no-unused-vars
) {
  const swap = ds.getSystem().system.Swap.contract as Swap
  await swap.addFeeTier(0)
}
