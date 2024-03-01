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
  await ds.deployAll()
  await ds.saveConfig()
  // await ds.addAaveV3Entries(
  //   'OpenAAVEV3Position_v2',
  //   'CloseAAVEV3Position_v4',
  //   'AdjustRiskUpAAVEV3Position_v2',
  //   'AdjustRiskDownAAVEV3Position_v2',
  //   'AAVEV3DepositBorrow_v2',
  //   'AAVEV3OpenDepositBorrow_v2',
  //   'AAVEV3Borrow_v2',
  //   'AAVEV3PaybackWithdraw_v2',
  //   'MigrateAaveV3EOA_v2',
  // )

  process.exit()
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error)
  process.exit(1)
})
