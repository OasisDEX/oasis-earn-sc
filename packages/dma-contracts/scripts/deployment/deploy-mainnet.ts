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
  await ds.addAaveV3Operations(
    'OpenAAVEV3Position_v2',
    'CloseAAVEV3Position_v4',
    'AdjustRiskUpAAVEV3Position_v2',
    'AdjustRiskDownAAVEV3Position_v2',
    'AAVEV3DepositBorrow_v2',
    'AAVEV3OpenDepositBorrow_v2',
    'AAVEV3Borrow_v2',
    'AAVEV3PaybackWithdraw_v2',
    'MigrateAaveV3EOA_v2',
  )
  await ds.addSparkOperations(
    'SparkOpenPosition_v2',
    'SparkClosePosition_v2',
    'SparkAdjustRiskUp_v2',
    'SparkAdjustRiskDown_v2',
    'SparkDepositBorrow_v2',
    'SparkOpenDepositBorrow_v2',
    'SparkBorrow_v2',
    'SparkPaybackWithdraw_v2',
    'MigrateSparkEOA_v2',
  )
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
