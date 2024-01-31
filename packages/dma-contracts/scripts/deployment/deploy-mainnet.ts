import hre from 'hardhat'

import { DeploymentSystem } from './deploy'

async function main() {
  const signer = hre.ethers.provider.getSigner(0)
  const network = hre.network.name || ''
  console.log(`Deployer address: ${await signer.getAddress()}`)
  console.log(`Network: ${network}`)

  const ds = new DeploymentSystem(hre)
  await ds.init()
  await ds.loadConfig()
  await ds.deployCore()
  await ds.deployActions()
  await ds.saveConfig()
  //await ds.addOperationEntries()
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => {
    // success message or other processing
    process.exitCode = 0
    process.exit()
  })
  .catch(error => {
    console.error(error)
    process.exitCode = 1
    process.exit()
  })
