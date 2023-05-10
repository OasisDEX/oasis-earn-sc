import { HardhatRuntimeEnvironment } from 'hardhat/types'

export async function advanceTime(
  ethers: HardhatRuntimeEnvironment['ethers'],
  seconds: number,
): Promise<void> {
  if (seconds < 0) {
    throw new Error('Cannot advance time by a negative number')
  }

  // Increase the time by the given number of seconds
  await ethers.provider.send('evm_increaseTime', [seconds])

  // Mine a new block to make sure the new time takes effect
  await ethers.provider.send('evm_mine', [])
}
