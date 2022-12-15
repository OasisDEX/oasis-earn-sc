import { ContractNames } from '@oasisdex/oasis-actions'
import { Signer, utils } from 'ethers'

import { HardhatEthers } from './types/common'

export class ServiceRegistry {
  address: string
  signer: Signer
  ethers: HardhatEthers

  constructor(address: string, signer: Signer, ethers: HardhatEthers) {
    this.address = address
    this.signer = signer
    this.ethers = ethers
  }

  async addEntry(label: ContractNames, address: string, debug = false): Promise<string> {
    console.log('Add Entry Provider: ', await this.ethers.provider.getNetwork())
    const entryHash = utils.keccak256(utils.toUtf8Bytes(label))
    const registry = await this.ethers.getContractAt('ServiceRegistry', this.address, this.signer)
    await registry.addNamedService(entryHash, address)

    if (debug) {
      console.log(`DEBUG: Service '${label}' has been added with hash: ${entryHash}`)
    }

    return entryHash
  }

  async getEntryHash(label: ContractNames): Promise<string> {
    const registry = await this.ethers.getContractAt('ServiceRegistry', this.address, this.signer)
    return registry.getServiceNameHash(label)
  }

  async getServiceAddress(label: ContractNames): Promise<string> {
    const registry = await this.ethers.getContractAt('ServiceRegistry', this.address, this.signer)
    return registry.getRegisteredService(label)
  }
}
