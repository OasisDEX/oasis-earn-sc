import { ContractNames } from '@oasisdex/oasis-actions'
import { Signer, utils } from 'ethers'

import { removePatchVersion } from '../scripts/common/utils'

export class ServiceRegistry {
  address: string
  signer: Signer

  constructor(address: string, signer: Signer) {
    this.address = address
    this.signer = signer
  }

  async addEntry(label: ContractNames, address: string, debug = false): Promise<string> {
    const ethers = (await import('hardhat')).ethers
    const entryHash = utils.keccak256(utils.toUtf8Bytes(this._removePatchVersion(label)))
    const registry = await ethers.getContractAt('ServiceRegistry', this.address, this.signer)
    await registry.addNamedService(entryHash, address)

    if (debug) {
      console.log(`DEBUG: Service '${label}' has been added with hash: ${entryHash}`)
    }

    return entryHash
  }

  async getEntryHash(label: ContractNames): Promise<string> {
    const ethers = (await import('hardhat')).ethers
    const registry = await ethers.getContractAt('ServiceRegistry', this.address, this.signer)
    return registry.getServiceNameHash(this._removePatchVersion(label))
  }

  async getServiceAddress(label: ContractNames): Promise<string> {
    const ethers = (await import('hardhat')).ethers
    const registry = await ethers.getContractAt('ServiceRegistry', this.address, this.signer)
    return registry.getRegisteredService(this._removePatchVersion(label))
  }

  private _removePatchVersion(service: string): string {
    return removePatchVersion(service)
  }
}
