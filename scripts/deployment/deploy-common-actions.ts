import { CONTRACT_NAMES } from '@oasisdex/oasis-actions/src/helpers/constants'
import hre from 'hardhat'

import {
  CdpAllow,
  MakerDeposit,
  MakerGenerate,
  MakerOpenVault,
  MakerPayback,
  MakerWithdraw,
  PullToken,
  SendToken,
  SetApproval,
  SwapAction,
  TakeFlashloan,
} from '../../typechain'
import { HardhatUtils } from '../common'
import { getServiceNameHash } from '../common/utils'

async function main() {
  const utils = new HardhatUtils(hre) // the hardhat network is coalesced to mainnet
  const signer = hre.ethers.provider.getSigner(0)
  const network = hre.network.name || ''
  console.log(`Deployer address: ${await signer.getAddress()}`)
  console.log(`Network: ${network}`)

  const gasSettings = await utils.getGasSettings()
  const system = await utils.getDefaultSystem()

  system.pullToken = (await utils.deployContract(
    hre.ethers.getContractFactory(CONTRACT_NAMES.common.PULL_TOKEN),
    [],
  )) as PullToken
  console.log(`pullToken action Deployed: ${system.pullToken.address}`)

  system.sendToken = (await utils.deployContract(
    hre.ethers.getContractFactory(CONTRACT_NAMES.common.SEND_TOKEN),
    [],
  )) as SendToken
  console.log(`sendToken action Deployed: ${system.sendToken.address}`)

  system.setApproval = (await utils.deployContract(
    hre.ethers.getContractFactory(CONTRACT_NAMES.common.SET_APPROVAL),
    [system.serviceRegistry.address],
  )) as SetApproval
  console.log(`setApproval action Deployed: ${system.setApproval.address}`)

  system.swap = (await utils.deployContract(
    hre.ethers.getContractFactory(CONTRACT_NAMES.common.SWAP_ACTION),
    [system.serviceRegistry.address],
  )) as SwapAction
  console.log(`swap action Deployed: ${system.swap.address}`)

  system.takeFlashloan = (await utils.deployContract(
    hre.ethers.getContractFactory(CONTRACT_NAMES.common.TAKE_A_FLASHLOAN),
    [system.serviceRegistry.address, utils.addresses.DAI],
  )) as TakeFlashloan
  console.log(`takeFlashloan action Deployed: ${system.takeFlashloan.address}`)

  console.log(`Adding pullToken action to ServiceRegistry....`)
  await (
    await system.serviceRegistry.addNamedService(
      getServiceNameHash(CONTRACT_NAMES.common.PULL_TOKEN),
      system.pullToken.address,
      gasSettings,
    )
  ).wait()
  console.log(`Adding sendToken action to ServiceRegistry....`)
  await (
    await system.serviceRegistry.addNamedService(
      getServiceNameHash(CONTRACT_NAMES.common.SEND_TOKEN),
      system.sendToken.address,
      gasSettings,
    )
  ).wait()
  console.log(`Adding setApproval action to ServiceRegistry....`)
  await (
    await system.serviceRegistry.addNamedService(
      getServiceNameHash(CONTRACT_NAMES.common.SET_APPROVAL),
      system.setApproval.address,
      gasSettings,
    )
  ).wait()
  console.log(`Adding swap action to ServiceRegistry....`)
  await (
    await system.serviceRegistry.addNamedService(
      getServiceNameHash(CONTRACT_NAMES.common.SWAP_ACTION),
      system.swap.address,
      gasSettings,
    )
  ).wait()
  console.log(`Adding takeFlashloan action to ServiceRegistry....`)
  await (
    await system.serviceRegistry.addNamedService(
      getServiceNameHash(CONTRACT_NAMES.common.TAKE_A_FLASHLOAN),
      system.takeFlashloan.address,
      gasSettings,
    )
  ).wait()
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
