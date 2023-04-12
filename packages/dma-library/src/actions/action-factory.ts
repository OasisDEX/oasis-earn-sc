import { ethers } from 'ethers'

import { ActionCall } from '../types'

export class ActionFactory {
  static create(targetHash: string, types: string[], args: any[]): ActionCall {
    const iface = new ethers.utils.Interface([
      ' function execute(bytes calldata data, uint8[] paramsMap) external payable returns (bytes calldata)',
    ])

    const encodedArgs = ethers.utils.defaultAbiCoder.encode(
      types[0] ? [types[0]] : [],
      args[0] ? [args[0]] : [],
    )
    const calldata = iface.encodeFunctionData('execute', [encodedArgs, args[1] ? args[1] : []])

    return {
      targetHash,
      callData: calldata,
      skipped: false,
    }
  }
}
