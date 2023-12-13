import { ContractNames } from '@deploy-configurations/constants'
import { Contract, Signer, utils } from 'ethers'

export class ServiceRegistry {
  address: string
  signer: Signer
  registry: Contract | undefined

  constructor(address: string, signer: Signer) {
    this.address = address
    this.signer = signer
  }

  private async _getRegistry(): Promise<Contract> {
    if (!this.registry) {
      const ethers = (await import('hardhat')).ethers
      this.registry = await ethers.getContractAt('ServiceRegistry', this.address, this.signer)
    }

    return this.registry
  }

  async getContractInstance() {
    return this._getRegistry()
  }

  async addEntry(label: ContractNames, address: string, debug = false): Promise<string> {
    const entryHash = utils.keccak256(utils.toUtf8Bytes(label))
    const registry = await this._getRegistry()
    await registry.addNamedService(entryHash, address)

    if (debug) {
      console.log(`DEBUG: Service '${label}' has been added with hash: ${entryHash}`)
    }

    return entryHash
  }

  async addEntryCalldata(label: ContractNames, address: string, debug = false): Promise<string> {
    const entryHash = utils.keccak256(utils.toUtf8Bytes(label))
    const registry = await this._getRegistry()

    const encodedData = registry.interface.encodeFunctionData('addNamedService', [
      entryHash,
      address,
    ])

    if (debug) {
      console.log(
        `DEBUG: Calldata for service '${label}' has been prepared for addition with hash: ${entryHash}`,
      )
    }

    return encodedData
  }

  async removeEntry(label: ContractNames) {
    const registry = await this._getRegistry()
    await registry.removeNamedService(await this.getEntryHash(label))
  }

  async getEntryHash(label: ContractNames): Promise<string> {
    const registry = await this._getRegistry()
    return registry.getServiceNameHash(label)
  }

  async getServiceAddress(label: ContractNames): Promise<string> {
    const registry = await this._getRegistry()
    return registry.getRegisteredService(label)
  }
}
