import hre from 'hardhat'

import { DeploymentSystem } from './deploy'

async function main() {
  const signer = hre.ethers.provider.getSigner(0)
  const network = hre.network.name || ''
  console.log(`Deployer address: ${await signer.getAddress()}`)
  console.log(`Network: ${network}`)

  const ds = new DeploymentSystem(hre) // TODO add forked param and in init get chainId and forked Network + set as attribute
  await ds.init()
  await ds.loadConfig('goerli.conf.ts')
  await ds.deployCore()
  // await ds.saveConfig()
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
