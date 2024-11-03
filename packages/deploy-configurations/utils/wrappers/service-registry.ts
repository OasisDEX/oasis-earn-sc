import { ContractNames } from '@deploy-configurations/constants'
import { Contract, ethers, Signer, utils } from 'ethers'

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

  async addEntry(
    label: ContractNames,
    address: string,
    debug = false,
    { tenderly }: { tenderly: boolean } = { tenderly: false },
  ): Promise<string> {
    const entryHash = utils.keccak256(utils.toUtf8Bytes(label))
    const registry = await this._getRegistry()

    if (tenderly) {
      const tx = await registry.populateTransaction.addNamedService(entryHash, address)
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
      await registry.addNamedService(entryHash, address)
    }

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
