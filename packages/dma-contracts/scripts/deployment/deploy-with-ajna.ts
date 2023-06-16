import hre from 'hardhat'

import { DeploymentSystem } from './deploy'
import { prepareEnv } from '@ajna-contracts/scripts'

async function main() {
  const signer = hre.ethers.provider.getSigner(0)
  const network = hre.network.name || ''
  console.log(`Deployer address: ${await signer.getAddress()}`)
  console.log(`Network: ${network}`)

  // const ajnaEnv = await prepareEnv(hre, true, false)

  const ds = new DeploymentSystem(hre)
  await ds.init()
  await ds.loadConfig('tenderly.conf.ts')
  await ds.deployCore()
  await ds.deployActions()
  await ds.saveConfig()
  await ds.addOperationEntries()
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
