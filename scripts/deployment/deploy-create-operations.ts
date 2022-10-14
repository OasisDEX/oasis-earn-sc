import { OPERATION_NAMES } from '@oasisdex/oasis-actions'
import { CONTRACT_NAMES } from '@oasisdex/oasis-actions/src/helpers/constants'
import { utils } from 'ethers'
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

function operationLabelHash(label: string): string {
  return utils.keccak256(utils.toUtf8Bytes(label))
}
async function main() {
  const utils = new HardhatUtils(hre) // the hardhat network is coalesced to mainnet
  const signer = hre.ethers.provider.getSigner(0)
  const network = hre.network.name || ''
  console.log(`Deployer address: ${await signer.getAddress()}`)
  console.log(`Network: ${network}`)

  const gasSettings = await utils.getGasSettings()
  const system = await utils.getDefaultSystem()

  console.log(`Adding CUSTOM_OPERATION to OperationsRegistry....`)
  await system.operationsRegistry.addOperation(OPERATION_NAMES.common.CUSTOM_OPERATION, [])
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
