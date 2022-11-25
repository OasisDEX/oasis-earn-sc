import { Signer, utils } from 'ethers'

export class OperationsRegistry {
  address: string
  signer: Signer

  constructor(address: string, signer: Signer) {
    this.address = address
    this.signer = signer
  }

  async addOp(
    label: string,
    actionHashes: string[],
    optionals: boolean[],
    debug = false,
  ): Promise<string> {
    if (actionHashes.length !== optionals.length) {
      throw new Error('Actions and optionals arrays lenght missmatch')
    }
    const ethers = (await import('hardhat')).ethers
    const entryHash = utils.keccak256(utils.toUtf8Bytes(label))
    const registry = await ethers.getContractAt('OperationsRegistry', this.address, this.signer)
    await registry.addOperation(label, actionHashes, optionals)

    if (debug) {
      console.log(`DEBUG: Service '${label}' has been added with hash: ${entryHash}`)
    }

    return entryHash
  }

  async getOp(label: string): Promise<[string[], boolean[]]> {
    const ethers = (await import('hardhat')).ethers
    const registry = await ethers.getContractAt('OperationsRegistry', this.address, this.signer)

    return registry.getOperation(label)
  }
}
