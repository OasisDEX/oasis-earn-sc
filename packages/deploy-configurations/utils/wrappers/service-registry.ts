import { ContractNames } from '@deploy-configurations/constants'
import { Signer, utils } from 'ethers'

export class ServiceRegistry {
  address: string
  signer: Signer

  constructor(address: string, signer: Signer) {
    this.address = address
    this.signer = signer
  }

  async getContractInstance() {
    const ethers = (await import('hardhat')).ethers
    return await ethers.getContractAt('ServiceRegistry', this.address, this.signer)
  }

  async addEntry(label: ContractNames, address: string, debug = false): Promise<string> {
    const ethers = (await import('hardhat')).ethers
    const entryHash = utils.keccak256(utils.toUtf8Bytes(label))
    const registry = await ethers.getContractAt('ServiceRegistry', this.address, this.signer)
    await registry.addNamedService(entryHash, address)

    if (debug) {
      console.log(`DEBUG: Service '${label}' has been added with hash: ${entryHash}`)
    }

    return entryHash
  }

  async addEntryCalldata(label: ContractNames, address: string, debug = false): Promise<string> {
    const ethers = (await import('hardhat')).ethers
    const entryHash = utils.keccak256(utils.toUtf8Bytes(label))
    const registry = await ethers.getContractAt('ServiceRegistry', this.address, this.signer)

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
    const ethers = (await import('hardhat')).ethers
    const registry = await ethers.getContractAt('ServiceRegistry', this.address, this.signer)
    await registry.removeNamedService(await this.getEntryHash(label))
  }

  async getEntryHash(label: ContractNames): Promise<string> {
    const ethers = (await import('hardhat')).ethers
    const registry = await ethers.getContractAt('ServiceRegistry', this.address, this.signer)
    return registry.getServiceNameHash(label)
  }

  async getServiceAddress(label: ContractNames): Promise<string> {
    const ethers = (await import('hardhat')).ethers
    const registry = await ethers.getContractAt('ServiceRegistry', this.address, this.signer)
    return registry.getRegisteredService(label)
  }
}
