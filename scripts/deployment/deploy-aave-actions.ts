import hre from 'hardhat'
import { AaveBorrow, AaveDeposit, AaveWithdraw} from '../../typechain'
import {  HardhatUtils } from '../common'
import { CONTRACT_NAMES } from '@oasisdex/oasis-actions/src/helpers/constants'
import {  getServiceNameHash } from '../common/utils'

async function main() {
    const utils = new HardhatUtils(hre) // the hardhat network is coalesced to mainnet
    const signer = hre.ethers.provider.getSigner(0)
    const network = hre.network.name || ''
    console.log(`Deployer address: ${await signer.getAddress()}`)
    console.log(`Network: ${network}`)

    const gasSettings = await utils.getGasSettings()
    const system = await utils.getDefaultSystem()

    system.aaveBorrow = (await utils.deployContract(hre.ethers.getContractFactory(CONTRACT_NAMES.aave.BORROW), [
        system.serviceRegistry.address,
    ])) as AaveBorrow
    console.log(`aaveBorrow action Deployed: ${system.aaveBorrow.address}`)

    system.aaveDeposit = (await utils.deployContract(hre.ethers.getContractFactory(CONTRACT_NAMES.aave.DEPOSIT), [
        system.serviceRegistry.address,
    ])) as AaveDeposit
    console.log(`aaveDeposit action Deployed: ${system.aaveDeposit.address}`)

    system.aaveWithdraw = (await utils.deployContract(hre.ethers.getContractFactory(CONTRACT_NAMES.aave.WITHDRAW), [
        system.serviceRegistry.address,
    ])) as AaveWithdraw
    console.log(`aaveWithdraw action Deployed: ${system.aaveWithdraw.address}`)

    console.log(`Adding aaveBorrow action to ServiceRegistry....`)
    await (await system.serviceRegistry.addNamedService(getServiceNameHash(CONTRACT_NAMES.aave.BORROW), system.aaveBorrow.address, gasSettings)).wait()

    console.log(`Adding aaveDeposit action to ServiceRegistry....`)
    await (await system.serviceRegistry.addNamedService(getServiceNameHash(CONTRACT_NAMES.aave.DEPOSIT), system.aaveDeposit.address, gasSettings)).wait()

    console.log(`Adding aaveWithdraw action to ServiceRegistry....`)
    await (await system.serviceRegistry.addNamedService(getServiceNameHash(CONTRACT_NAMES.aave.WITHDRAW), system.aaveWithdraw.address, gasSettings)).wait()

}

main().catch(error => {
    console.error(error)
    process.exitCode = 1
})
