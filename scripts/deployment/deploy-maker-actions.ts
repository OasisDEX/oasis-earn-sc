import { CONTRACT_NAMES } from '@oasisdex/oasis-actions/src/helpers/constants'
import hre from 'hardhat'

import {
  CdpAllow,
  MakerDeposit,
  MakerGenerate,
  MakerOpenVault,
  MakerPayback,
  MakerWithdraw,
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

  system.cdpAllow = (await utils.deployContract(
    hre.ethers.getContractFactory(CONTRACT_NAMES.maker.CDP_ALLOW),
    [system.serviceRegistry.address],
  )) as CdpAllow
  console.log(`cdpAllow action Deployed: ${system.cdpAllow.address}`)

  system.makerOpenVault = (await utils.deployContract(
    hre.ethers.getContractFactory(CONTRACT_NAMES.maker.OPEN_VAULT),
    [system.serviceRegistry.address],
  )) as MakerOpenVault
  console.log(`makerOpenVault action Deployed: ${system.makerOpenVault.address}`)

  system.makerDeposit = (await utils.deployContract(
    hre.ethers.getContractFactory(CONTRACT_NAMES.maker.DEPOSIT),
    [system.serviceRegistry.address],
  )) as MakerDeposit
  console.log(`makerDeposit action Deployed: ${system.makerDeposit.address}`)

  system.makerGenerate = (await utils.deployContract(
    hre.ethers.getContractFactory(CONTRACT_NAMES.maker.GENERATE),
    [system.serviceRegistry.address],
  )) as MakerGenerate
  console.log(`makerGenerate action Deployed: ${system.makerGenerate.address}`)

  system.makerPayback = (await utils.deployContract(
    hre.ethers.getContractFactory(CONTRACT_NAMES.maker.PAYBACK),
    [system.serviceRegistry.address],
  )) as MakerPayback
  console.log(`makerPayback action Deployed: ${system.makerPayback.address}`)

  system.makerWithdraw = (await utils.deployContract(
    hre.ethers.getContractFactory(CONTRACT_NAMES.maker.WITHDRAW),
    [system.serviceRegistry.address],
  )) as MakerWithdraw
  console.log(`makerWithdraw action Deployed: ${system.makerWithdraw.address}`)

  console.log(`Adding cdpAllow action to ServiceRegistry....`)
  await (
    await system.serviceRegistry.addNamedService(
      getServiceNameHash(CONTRACT_NAMES.maker.CDP_ALLOW),
      system.cdpAllow.address,
      gasSettings,
    )
  ).wait()

  console.log(`Adding makerOpenVault action to ServiceRegistry....`)
  await (
    await system.serviceRegistry.addNamedService(
      getServiceNameHash(CONTRACT_NAMES.maker.OPEN_VAULT),
      system.makerOpenVault.address,
      gasSettings,
    )
  ).wait()

  console.log(`Adding makerDeposit action to ServiceRegistry....`)
  await (
    await system.serviceRegistry.addNamedService(
      getServiceNameHash(CONTRACT_NAMES.maker.DEPOSIT),
      system.makerDeposit.address,
      gasSettings,
    )
  ).wait()

  console.log(`Adding makerGenerate action to ServiceRegistry....`)
  await (
    await system.serviceRegistry.addNamedService(
      getServiceNameHash(CONTRACT_NAMES.maker.GENERATE),
      system.makerGenerate.address,
      gasSettings,
    )
  ).wait()

  console.log(`Adding makerPayback action to ServiceRegistry....`)
  await (
    await system.serviceRegistry.addNamedService(
      getServiceNameHash(CONTRACT_NAMES.maker.PAYBACK),
      system.makerPayback.address,
      gasSettings,
    )
  ).wait()

  console.log(`Adding makerWithdraw action to ServiceRegistry....`)
  await (
    await system.serviceRegistry.addNamedService(
      getServiceNameHash(CONTRACT_NAMES.maker.WITHDRAW),
      system.makerWithdraw.address,
      gasSettings,
    )
  ).wait()
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
