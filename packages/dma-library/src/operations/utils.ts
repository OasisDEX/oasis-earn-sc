import { BasicCall } from '../types/action-call'
import { ethers } from 'ethers'

const utils = ethers.utils

//TODO We must take into consideration if implementing with existing code that the array should be flat
// ie pseudocode: [takeFlashloan, ...takeFlashloan.calls]
export const calculateOperationHash = (actions: BasicCall[]): string => {
  return utils.solidityKeccak256(
    ['bytes'],
    [
      actions
        .map(call => call.targetHash)
        .reduce((all, currentHash) => {
          return utils.solidityPack(['bytes', 'bytes32'], [all, currentHash])
        }, '0x'),
    ],
  )
}