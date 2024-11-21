import { Network } from '@dma-library'
import hre from 'hardhat'

import { DeploymentSystem } from '../utils/deploy'
import { tenderlyDeployInit } from '../utils/tenderlyDeployInit'

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
  await ds.addOperationEntries()
  await ds.addFeeTiersToNewSwapContract()

  if (network === Network.TENDERLY) {
    await tenderlyDeployInit(signer.provider)
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => {
    // success message or other processing
    process.exit()
  })
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
