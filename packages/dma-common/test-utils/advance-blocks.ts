import { HardhatRuntimeEnvironment } from 'hardhat/types'

/*
 * Advance the block number by `numberOfBlocks` blocks.
 * Artificially advances the block timestamp as well given each operation is somewhat slow
 */
export async function advanceBlocks(
  ethers: HardhatRuntimeEnvironment['ethers'],
  numberOfBlocks: number,
): Promise<void> {
  for (let i = 0; i < numberOfBlocks; i++) {
    await ethers.provider.send('evm_mine', [])
  }
}
