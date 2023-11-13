import { getConfigByNetwork } from '@deploy-configurations/configs'
import { SystemConfig } from '@deploy-configurations/types/deployment-config'
import { Network } from '@deploy-configurations/types/network'
import { getOperationRegistry } from '@dma-contracts/tasks/common'
import hre from 'hardhat'

async function main() {
  hre.ethers.utils.Logger.setLogLevel(hre.ethers.utils.Logger.levels.ERROR)

  const signer = hre.ethers.getSigner()

  // const signer = hre.ethers.provider.getSigner(0)
  const network = hre.network.name || ''
  if (network !== 'tenderly' && network !== 'local') {
    throw new Error('This script should be run only on tenderly or local network')
  }

  const config: SystemConfig = getConfigByNetwork(network as Network) as SystemConfig

  const operationsRegistry = await getOperationRegistry(hre.ethers.provider, config)
  if (!operationsRegistry) {
    console.log('ServiceRegistry not deployed, cannot fetch values')
    return
  }

  const result = await operationsRegistry.addOperation(
    {
      name: 'custrom_op',
      actions: [],
    },
    {
      from: signer.address,
    },
  )

  await result.wait()

  console.log(`We have Operation Registry!`)

  // await ds
  //   .getSystem()
  //   .system.AccountGuard.contract.setWhitelist(
  //     ds.getSystem().system.OperationExecutor.contract.address,
  //     true,
  //   )
  //
  // await ds
  //   .getSystem()
  //   .system.AccountGuard.contract.setWhitelist(ajnaEnv.ajnaProxyActionsContract.address, true)
  //
  // await (await ds.getSystem().system.Swap.contract.connect(ajnaEnv.deployer).addFeeTier(0)).wait()
  // await (await ds.getSystem().system.Swap.contract.connect(ajnaEnv.deployer).addFeeTier(7)).wait()
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => console.log('SUCCESS'))
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
