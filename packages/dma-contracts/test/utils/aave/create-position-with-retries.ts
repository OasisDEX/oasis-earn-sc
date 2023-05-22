import { advanceBlocks, advanceTime } from '@dma-common/test-utils'
import { BLOCKS_TO_ADVANCE, TIME_TO_ADVANCE } from '@dma-contracts/test/config'
import { PositionDetails } from '@dma-contracts/test/fixtures'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const POSITION_RETRIES = 3

/*
 * Useful for:
 * When block timestamps are close together in testing
 * The timestamp difference between when the reserve liquidity index was last updated can be very small
 * In turn this can lead to precision issues in the linear interest calculation that gives out by 1 errors
 * See https://github.com/aave/protocol-v2/blob/ce53c4a8c8620125063168620eba0a8a92854eb8/contracts/protocol/libraries/logic/ReserveLogic.sol#LL57C1-L57C1
 */
export async function createPositionWithRetries<A, P extends PositionDetails | null>(
  ethers: HardhatRuntimeEnvironment['ethers'],
  positionCreationFunction: (args: A) => Promise<P>,
  args: A,
): Promise<P> {
  for (let attempt = 0; attempt < POSITION_RETRIES; attempt++) {
    try {
      const position = await positionCreationFunction(args)
      position &&
        attempt + 1 > 1 &&
        console.log(
          `\x1b[90m${position.strategy} Position created after ${attempt + 1} attempt${
            attempt + 1 > 1 ? 's' : ''
          }\x1b[0m`,
        )
      return position
    } catch (error) {
      console.warn(`Position creation failed, attempt ${attempt + 1}:`, error)

      // Advance blocks and time before retrying
      await advanceBlocks(ethers, BLOCKS_TO_ADVANCE)
      await advanceTime(ethers, TIME_TO_ADVANCE)
    }
  }

  throw new Error('Position creation failed after all retries')
}
