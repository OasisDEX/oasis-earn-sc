import { CONTRACT_NAMES } from '@oasisdex/oasis-actions/src/helpers/constants'
import hre from 'hardhat'

import {
  PullToken,
  ReturnFunds,
  SendToken,
  SetApproval,
  SwapAction,
  TakeFlashloan,
  UnwrapEth,
  WrapEth,
} from '../../typechain'
import { HardhatUtils, removeVersion } from '../common'

// TODO: Make this as core deployment script:
// If there is a populated address for the given address, skip deployment
async function main() {
  const utils = new HardhatUtils(hre) // the hardhat network is coalesced to mainnet
  const signer = hre.ethers.provider.getSigner(0)
  const network = hre.network.name || ''
  console.log(`Deployer address: ${await signer.getAddress()}`)
  console.log(`Network: ${network}`)

  const system = await utils.getDefaultSystem()

  system.pullToken = (await utils.deployContract(
    hre.ethers.getContractFactory(removeVersion(CONTRACT_NAMES.common.PULL_TOKEN)),
    [],
  )) as PullToken
  console.log(`pullToken action Deployed: ${system.pullToken.address}`)

  system.sendToken = (await utils.deployContract(
    hre.ethers.getContractFactory(removeVersion(CONTRACT_NAMES.common.SEND_TOKEN)),
    [],
  )) as SendToken
  console.log(`sendToken action Deployed: ${system.sendToken.address}`)

  system.setApproval = (await utils.deployContract(
    hre.ethers.getContractFactory(removeVersion(CONTRACT_NAMES.common.SET_APPROVAL)),
    [system.serviceRegistry.address],
  )) as SetApproval
  console.log(`setApproval action Deployed: ${system.setApproval.address}`)

  system.swapAction = (await utils.deployContract(
    hre.ethers.getContractFactory(removeVersion(CONTRACT_NAMES.common.SWAP_ACTION)),
    [system.serviceRegistry.address],
  )) as SwapAction
  console.log(`swap action Deployed: ${system.swapAction.address}`)

  system.takeFlashloan = (await utils.deployContract(
    hre.ethers.getContractFactory(removeVersion(CONTRACT_NAMES.common.TAKE_A_FLASHLOAN)),
    [system.serviceRegistry.address, utils.addresses.DAI],
  )) as TakeFlashloan
  console.log(`takeFlashloan action Deployed: ${system.takeFlashloan.address}`)

  system.unwrapEth = (await utils.deployContract(
    hre.ethers.getContractFactory(removeVersion(CONTRACT_NAMES.common.UNWRAP_ETH)),
    [system.serviceRegistry.address],
  )) as UnwrapEth
  console.log(`unwrapEth action Deployed: ${system.unwrapEth.address}`)

  system.wrapEth = (await utils.deployContract(
    hre.ethers.getContractFactory(removeVersion(CONTRACT_NAMES.common.WRAP_ETH)),
    [system.serviceRegistry.address],
  )) as WrapEth
  console.log(`wrapEth action Deployed: ${system.wrapEth.address}`)

  system.returnFunds = (await utils.deployContract(
    hre.ethers.getContractFactory(removeVersion(CONTRACT_NAMES.common.RETURN_FUNDS)),
    [],
  )) as ReturnFunds
  console.log(`returnFunds action Deployed: ${system.returnFunds.address}`)
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
