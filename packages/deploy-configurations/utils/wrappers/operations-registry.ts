import { Signer, utils } from 'ethers'

type Action = {
  hash: string
  optional?: boolean
}

export class OperationsRegistry {
  address: string
  signer: Signer

  constructor(address: string, signer: Signer) {
    this.address = address
    this.signer = signer
  }

  calculateActionsHash(actions: Action[]): string {
    const actionHashes = actions.map(a => a.hash)
    const concatenatedHashes = utils.solidityPack(['bytes32[]'], [actionHashes])
    return utils.keccak256(concatenatedHashes)
  }

  async addOp(label: string, actions: Action[], debug = false): Promise<string> {
    const ethers = (await import('hardhat')).ethers
    const entryHash = utils.keccak256(utils.toUtf8Bytes(label))
    const registry = await ethers.getContractAt('OperationsRegistry', this.address, this.signer)
    const operationHash = this.calculateActionsHash(actions)
    const existingOperation = await this.getOpName(operationHash)

    if (existingOperation !== '') {
      await registry.addOperation(label, operationHash)
    } else {
      console.log('Adding an existing operation failed: ' + label)
    }

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

  async getOpName(operationHash: string): Promise<string> {
    const ethers = (await import('hardhat')).ethers
    const registry = await ethers.getContractAt('OperationsRegistry', this.address, this.signer)
    let operationName = ''
    try {
      operationName = await registry.getOperationName(operationHash)
    } catch (error) {
      console.log(error)
    }

    return operationName
  }
}
