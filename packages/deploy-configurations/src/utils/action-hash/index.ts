import { ethers } from 'ethers'

export function getActionHash(name: string): string {
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(name))
}
