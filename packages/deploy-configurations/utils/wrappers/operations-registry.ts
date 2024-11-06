import { Signer, utils } from 'ethers'

type Action = {
  hash: string
  optional: boolean
}

export class OperationsRegistry {
  address: string
  signer: Signer
  isTenderly: boolean
  debug: boolean

  constructor(
    address: string,
    signer: Signer,
    { isTenderly, debug }: { isTenderly?: boolean; debug?: boolean } = {},
  ) {
    this.address = address
    this.signer = signer
    this.isTenderly = isTenderly || false
    this.debug = debug || false
  }

  async addOp(label: string, actions: Action[]): Promise<string> {
    const ethers = (await import('hardhat')).ethers
    const entryHash = utils.keccak256(utils.toUtf8Bytes(label))
    const registry = await ethers.getContractAt('OperationsRegistry', this.address, this.signer)
    const actionHashes = actions.map(a => a.hash)
    const optional = actions.map(a => a.optional)

    if (this.isTenderly) {
      const tx = await registry.populateTransaction.addOperation({
        name: label,
        actions: actionHashes,
        optional,
      })
      const provider = new ethers.providers.JsonRpcProvider(process.env.TENDERLY_FORK_URL)
      const txHash = await provider
        ?.send('eth_sendTransaction', [
          {
            ...tx,
            from: process.env.IMPERSONATE_ADDRESS,
          },
        ])
        .catch(e => {
          console.log('Error in the transaction', e)
        })
      await provider?.waitForTransaction(txHash)
    } else {
      await registry.addOperation({ name: label, actions: actionHashes, optional })
    }
    if (this.debug) {
      console.log(`DEBUG: Operation '${label}' has been added with hash: ${entryHash}`)
      console.log('DEBUG: Actions:', actionHashes)
      console.log('DEBUG: Optional:', optional)
    }

    return entryHash
  }

  async getOp(label: string): Promise<[string[], boolean[]]> {
    const ethers = (await import('hardhat')).ethers
    const registry = await ethers.getContractAt('OperationsRegistry', this.address, this.signer)

    return registry.getOperation(label)
  }
}
