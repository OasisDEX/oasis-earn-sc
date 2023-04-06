// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import {
  ActionFactory,
  calldataTypes,
  CONTRACT_NAMES,
  OPERATION_NAMES,
} from '@oasisdex/dma-library'
import hre from 'hardhat'

import { HardhatUtils } from '../common'

async function main() {
  const utils = new HardhatUtils(hre) // the hardhat network is coalesced to mainnet
  const signer = hre.ethers.provider.getSigner(0)
  //await utils.cancelTx(80, 10, signer);
  const network = hre.network.name || ''
  console.log(`Deployer address: ${await signer.getAddress()}`)
  console.log(`Network: ${network}`)

  const createAction = ActionFactory.create

  const dsProxy = await utils.getOrCreateProxy(await signer.getAddress(), signer)

  const system = await utils.getDefaultSystem()

  const openVaultAction = createAction(
    await system.serviceRegistry.getServiceNameHash(CONTRACT_NAMES.maker.OPEN_VAULT),
    [calldataTypes.maker.Open, calldataTypes.paramsMap],
    [
      {
        joinAddress: utils.addresses.MCD_JOIN_ETH_A,
      },
      [0],
    ],
  )

  system.serviceRegistry
  const tx = await dsProxy['execute(address,bytes)'](
    system.operationExecutor.address,
    system.operationExecutor.interface.encodeFunctionData('executeOp', [
      [openVaultAction],
      OPERATION_NAMES.common.CUSTOM_OPERATION,
    ]),
    {
      gasLimit: 4000000,
    },
  )

  const result = await tx.wait()

  console.log('txReceipt', result.transactionHash)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
