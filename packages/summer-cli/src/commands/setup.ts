import {Command, ux } from '@oclif/core'
import { isAddress, ethers } from 'ethers'
import { chainIdToSupportedNetowrk } from '../constants/network';

const Conf = require('conf');
const config = new Conf();

export default class Setup extends Command {
  static description = 'Initial setup of the cli'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  public async run(): Promise<void> {

    const rpcEndpoint = await ux.prompt("Enter your fork url")

    if(rpcEndpoint) {
      const provider = ethers.getDefaultProvider(rpcEndpoint)

      const network = await provider.getNetwork()

      const chain = chainIdToSupportedNetowrk(network.chainId.toString())

      if (!chain) {
        this.error(`Network not supported: ${network.chainId}`)
      } else {
        this.log(`Your current network is: ${chain}`)
        config.set('rpc', rpcEndpoint)
        config.set('chainId', chain)
      }
    }

    this.log(`Your crrent wallet address is: ${config.get('wallet')}`)

    const wantsToSetWallet = await ux.prompt("Do you want to set your wallet address? (y/n)")
    if (wantsToSetWallet === 'y') {
      const walletAddress = await ux.prompt("Enter your wallet address")
  
      if(isAddress(walletAddress)) {
        await this.config.runCommand('conf', ['wallet', walletAddress])
        return
      }
  
      this.error("Parameter is not an Address")
    }
  }
}
