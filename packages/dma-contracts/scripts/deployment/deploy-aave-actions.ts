import { CONTRACT_NAMES } from '@oasisdex/dma-common/constants'
import { removeVersion } from '@oasisdex/dma-common/utils/deploy'
import { AaveBorrow } from '@typechain/dma-contracts/artifacts/contracts/actions/aave/v2/Borrow.sol'
import { AaveDeposit } from '@typechain/dma-contracts/artifacts/contracts/actions/aave/v2/Deposit.sol'
import { AavePayback } from '@typechain/dma-contracts/artifacts/contracts/actions/aave/v2/Payback.sol'
import { AaveWithdraw } from '@typechain/dma-contracts/artifacts/contracts/actions/aave/v2/Withdraw.sol'
import hre from 'hardhat'

import { HardhatUtils } from '../common'

// TODO: Make this as core deployment script:
// If there is a populated address for the given address, skip deployment
async function main() {
  const utils = new HardhatUtils(hre) // the hardhat network is coalesced to mainnet
  const signer = hre.ethers.provider.getSigner(0)
  const network = hre.network.name || ''
  console.log(`Deployer address: ${await signer.getAddress()}`)
  console.log(`Network: ${network}`)

  const system = await utils.getDefaultSystem()

  system.aaveBorrow = (await utils.deployContract(
    hre.ethers.getContractFactory(removeVersion(CONTRACT_NAMES.aave.v2.BORROW)),
    [system.serviceRegistry.address],
  )) as AaveBorrow
  console.log(`aaveBorrow action Deployed: ${system.aaveBorrow.address}`)

  system.aaveDeposit = (await utils.deployContract(
    hre.ethers.getContractFactory(removeVersion(CONTRACT_NAMES.aave.v2.DEPOSIT)),
    [system.serviceRegistry.address],
  )) as AaveDeposit
  console.log(`aaveDeposit action Deployed: ${system.aaveDeposit.address}`)

  system.aaveWithdraw = (await utils.deployContract(
    hre.ethers.getContractFactory(removeVersion(CONTRACT_NAMES.aave.v2.WITHDRAW)),
    [system.serviceRegistry.address],
  )) as AaveWithdraw
  console.log(`aaveWithdraw action Deployed: ${system.aaveWithdraw.address}`)

  system.aavePayback = (await utils.deployContract(
    hre.ethers.getContractFactory(removeVersion(CONTRACT_NAMES.aave.v2.PAYBACK)),
    [system.serviceRegistry.address],
  )) as AavePayback
  console.log(`aavePayback action Deployed: ${system.aavePayback.address}`)
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
