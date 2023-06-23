import { prepareEnv } from '@ajna-contracts/scripts'
import { updateDmaConfigWithLocalAjnaDeploy } from '@dma-contracts/test/fixtures'
import hre from 'hardhat'

import { DeploymentSystem } from './deploy'

async function main() {
  const signer = hre.ethers.provider.getSigner(0)
  const network = hre.network.name || ''
  console.log(`Deployer address: ${await signer.getAddress()}`)
  console.log(`Network: ${network}`)

  const ajnaEnv = await prepareEnv(hre, true)

  ajnaEnv.printAddresses()

  await ajnaEnv.provideLiquidity(
    ajnaEnv.pools.wbtcUsdcPool,
    hre.ethers.BigNumber.from(1000000),
    await ajnaEnv.poolInfo.priceToIndex(hre.ethers.utils.parseEther('15000')),
  )
  await ajnaEnv.provideLiquidity(
    ajnaEnv.pools.wethUsdcPool,
    hre.ethers.BigNumber.from(100000),
    await ajnaEnv.poolInfo.priceToIndex(hre.ethers.utils.parseEther('1200')),
  )

  let ds = new DeploymentSystem(hre)

  await ds.init()
  await ds.loadConfig('tenderly.conf.ts')
  ds = updateDmaConfigWithLocalAjnaDeploy(ds, ajnaEnv)
  await ds.deployCore()
  await ds.addAjnaEntries()
  await ds.deployActions()
  await ds.saveConfig()
  await ds.addOperationEntries()

  await ds
    .getSystem()
    .system.AccountGuard.contract.setWhitelist(
      ds.getSystem().system.OperationExecutor.contract.address,
      true,
    )

  await ds.getSystem().system.AccountGuard.contract.setWhitelist(
    ajnaEnv.ajnaProxyActionsContract.address,
    true,
  )

  await (await ds.getSystem().system.uSwap.contract.connect(ajnaEnv.deployer).addFeeTier(0)).wait()
  await (await ds.getSystem().system.uSwap.contract.connect(ajnaEnv.deployer).addFeeTier(7)).wait()
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => console.log('SUCCESS'))
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
