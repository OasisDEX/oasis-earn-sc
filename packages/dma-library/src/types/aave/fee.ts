import type { SwapFeeType } from '@dma-common/constants'
import BigNumber from 'bignumber.js'

export type WithFee = { fee: BigNumber; feeType: SwapFeeType }
