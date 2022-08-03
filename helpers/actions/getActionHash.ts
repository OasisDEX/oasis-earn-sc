import { ethers } from 'hardhat';

export function getActionHash(name: string): string {
  return ethers.utils.keccak256(name);
}
