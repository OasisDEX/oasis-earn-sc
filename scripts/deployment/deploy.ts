// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import hre from 'hardhat'

import { HardhatUtils } from '../common'
import { deploySystem } from '../common/deploy-system'

async function main() {
  const utils = new HardhatUtils(hre) // the hardhat network is coalesced to mainnet
  const signer = hre.ethers.provider.getSigner(0)
  //await utils.cancelTx(80, 10, signer);
  const network = hre.network.name || ''
  console.log(`Deployer address: ${await signer.getAddress()}`)
  console.log(`Network: ${network}`)

  await deploySystem({ utils, logDebug: true })
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
