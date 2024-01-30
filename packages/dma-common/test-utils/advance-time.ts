import { HardhatRuntimeEnvironment } from 'hardhat/types'

export const HOUR_IN_SECONDS = 60 * 60
export const DAY_IN_SECONDS = 24 * HOUR_IN_SECONDS
export const WEEK_IN_SECONDS = 7 * DAY_IN_SECONDS
export const YEAR_IN_SECONDS = 365 * DAY_IN_SECONDS
export const LEAP_YEAR_IN_SECONDS = 366 * DAY_IN_SECONDS

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
