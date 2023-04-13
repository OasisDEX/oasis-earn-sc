import { Signer, utils } from 'ethers'

type Action = {
  hash: string
  optional: boolean
}

export class OperationsRegistry {
  address: string
  signer: Signer

  constructor(address: string, signer: Signer) {
    this.address = address
    this.signer = signer
  }

  async addOp(label: string, actions: Action[], debug = false): Promise<string> {
    const ethers = (await import('hardhat')).ethers
    const entryHash = utils.keccak256(utils.toUtf8Bytes(label))
    const registry = await ethers.getContractAt('OperationsRegistry', this.address, this.signer)
    const actionHashes = actions.map(a => a.hash)
    const optional = actions.map(a => a.optional)
    await registry.addOperation({ name: label, actions: actionHashes, optional })

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
