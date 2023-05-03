import { advanceBlocks, advanceTime } from '@dma-common/test-utils'
import { PositionDetails } from '@dma-contracts/test/fixtures'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const POSITION_RETRIES = 3
const BLOCKS_TO_ADVANCE = 5
const TIME_TO_ADVANCE = 60

export async function createPositionWithRetries<A, P extends PositionDetails | null>(
  ethers: HardhatRuntimeEnvironment['ethers'],
  positionCreationFunction: (args: A) => Promise<P>,
  args: A,
): Promise<P> {
  for (let attempt = 0; attempt < POSITION_RETRIES; attempt++) {
    try {
      const position = await positionCreationFunction(args)
      position &&
        console.info(
          `${position.strategy} Position created after ${attempt + 1} attempt${
            attempt + 1 > 1 ? 's' : ''
          }`,
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
