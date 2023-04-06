import { CONTRACT_NAMES } from '@oasisdex/dma-library/src/utils/constants'
import { constants } from 'ethers'
import fs from 'fs'
import hre from 'hardhat'

import { getServiceNameHash, HardhatUtils } from '../common'

/**
 * This is a convenience script.
 * It does not add entries to Service registry
 * Rather it prints the values you'll need to add entries to the SR
 * using the Gnosis Safe multisig
 */

type Entry = {
  label: string
  contractName: string
  hash: string
  nameToHash: string
  address: string | undefined
}

async function main() {
  const utils = new HardhatUtils(hre) // the hardhat network is coalesced to mainnet
  const system = await utils.getDefaultSystem()

  const entries = []

  console.log('DEBUG: !REMEMBER!')
  console.log(
    'Double check the contract names versions used in Action events \n and deployed contract names align used in SR hashes align \n',
  )

  entries.push(
    createEntry(`PullToken action`, CONTRACT_NAMES.common.PULL_TOKEN, system.pullToken?.address),
  )
  entries.push(
    createEntry(`SendToken action`, CONTRACT_NAMES.common.SEND_TOKEN, system.sendToken?.address),
  )
  entries.push(
    createEntry(
      `SetApproval action`,
      CONTRACT_NAMES.common.SET_APPROVAL,
      system.setApproval?.address,
    ),
  )
  entries.push(
    createEntry(
      `TakeFlashloanAction action`,
      CONTRACT_NAMES.common.TAKE_A_FLASHLOAN,
      system.takeFlashloan?.address,
    ),
  )
  entries.push(
    createEntry(`WrapEth action`, CONTRACT_NAMES.common.WRAP_ETH, system.wrapEth?.address),
  )
  entries.push(
    createEntry(`UnwrapEth action`, CONTRACT_NAMES.common.UNWRAP_ETH, system.unwrapEth?.address),
  )
  entries.push(
    createEntry(
      `ReturnFunds action`,
      CONTRACT_NAMES.common.RETURN_FUNDS,
      system.returnFunds?.address,
    ),
  )
  entries.push(
    createEntry(`AaveBorrow action`, CONTRACT_NAMES.aave.BORROW, system.aaveBorrow?.address),
  )
  entries.push(
    createEntry(`AaveDeposit action`, CONTRACT_NAMES.aave.DEPOSIT, system.aaveDeposit?.address),
  )
  entries.push(
    createEntry(`AaveWithdraw action`, CONTRACT_NAMES.aave.WITHDRAW, system.aaveWithdraw?.address),
  )
  entries.push(
    createEntry(`AavePayback action`, CONTRACT_NAMES.aave.PAYBACK, system.aavePayback?.address),
  )

  console.log('DEBUG: PRINTING ENTRIES TO CONSOLE')
  printEntries(entries)

  console.log('DEBUG: SAVING ENTRIES TO CONSOLE')
  saveEntriesToFile(entries)
}

function printEntries(entries: Entry[]) {
  entries.forEach(printEntryToConsole)
}

function createEntry(label: string, contractName: string, address: string | undefined): Entry {
  const hash = getServiceNameHash(contractName)

  return { label, contractName, nameToHash: contractName, hash, address }
}

function printEntryToConsole({ label, contractName, nameToHash, hash, address }: Entry) {
  console.log('---')
  console.log(label)
  console.log(`Contract name:`, contractName)
  console.log(`Service name to hash:`, nameToHash)
  console.log(`Service name hash:`, hash)
  console.log(`Service address:`, address === constants.AddressZero ? 'NOT DEPLOYED YET' : address)
}

function saveEntriesToFile(entries: Entry[]) {
  const file = fs.createWriteStream('serviceRegistryEntries.txt')
  file.on('error', function () {
    /* error handling */
    console.log('file: serviceRegistryEntries.txt could not be saved')
  })

  entries.forEach(function (entry) {
    file.write(`${entry.label}` + '\n')
    file.write(`Full contract name: ${entry.contractName}` + '\n')
    file.write(`Service name to hash: ${entry.nameToHash}` + '\n')
    file.write(`Service name hash: ${entry.hash}` + '\n')
    file.write(
      `Service address: ${
        entry.address === constants.AddressZero ? 'NOT DEPLOYED YET' : entry.address
      }` + '\n',
    )
    file.write('\n')
  })
  file.end()
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
