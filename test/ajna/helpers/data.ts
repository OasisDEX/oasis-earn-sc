import { BigNumber } from 'bignumber.js'
import { ethers } from 'ethers'

import { AjnaPosition } from '../../../packages/oasis-actions/src'
import { AjnaPool } from '../../../packages/oasis-actions/src/types/ajna/AjnaPool'
import { GetPoolData, GetPosition } from '../../../packages/oasis-actions/src/views/ajna'

export async function priceToIndex(price: number): Promise<BigNumber> {
  const WAD = new BigNumber(10).pow(18)
  const provider = ethers.getDefaultProvider('goerli')
  const poolInfo = new ethers.Contract(
    '0xEa36b2a4703182d07df9DdEe46BF97f9979F0cCf',
    [
      {
        inputs: [
          {
            internalType: 'uint256',
            name: 'price_',
            type: 'uint256',
          },
        ],
        name: 'priceToIndex',
        outputs: [
          {
            internalType: 'uint256',
            name: '',
            type: 'uint256',
          },
        ],
        stateMutability: 'pure',
        type: 'function',
      },
    ],
    provider,
  )

  return new BigNumber(
    (await poolInfo.priceToIndex(new BigNumber(price).times(WAD).toString())).toString(),
  )
}

export const getPoolData =
  (partialPool: Partial<AjnaPool> = {}): GetPoolData =>
  async (poolAddress: string) => {
    return {
      poolAddress: poolAddress,
      quoteToken: '0x0000000000000000000000000000000000000000',
      collateralToken: '0xWETH',

      lup: new BigNumber(900),
      lowestUtilizedPrice: new BigNumber(900),
      lowestUtilizedPriceIndex: await priceToIndex(900),

      htp: new BigNumber(500),
      highestThresholdPrice: new BigNumber(500),
      highestThresholdPriceIndex: await priceToIndex(500),

      highestPriceBucket: new BigNumber(500),
      highestPriceBucketIndex: await priceToIndex(500),

      mostOptimisticMatchingPrice: new BigNumber(1200),

      poolMinDebtAmount: new BigNumber(600),
      poolCollateralization: new BigNumber(100),
      poolActualUtilization: new BigNumber(100),
      poolTargetUtilization: new BigNumber(100),

      interestRate: new BigNumber(0.05),
      debt: new BigNumber(80000),
      depositSize: new BigNumber(100000),
      apr30dAverage: new BigNumber(0.04),
      dailyPercentageRate30dAverage: new BigNumber(0.05),
      monthlyPercentageRate30dAverage: new BigNumber(0.03),
      currentBurnEpoch: new BigNumber(100),

      buckets: [
        {
          bucketLPs: new BigNumber(10000),
          collateral: new BigNumber(1000),
          quoteTokens: new BigNumber(10000),
          index: await priceToIndex(1000),
          price: new BigNumber(1000),
        },
        {
          bucketLPs: new BigNumber(10000),
          collateral: new BigNumber(1000),
          quoteTokens: new BigNumber(90000),
          index: await priceToIndex(900),
          price: new BigNumber(900),
        },
        {
          bucketLPs: new BigNumber(10000),
          collateral: new BigNumber(1000),
          quoteTokens: new BigNumber(10000),
          index: await priceToIndex(300),
          price: new BigNumber(300),
        },
      ],
      ...partialPool,
    }
  }

export const getPosition =
  (
    positionState: {
      collateral?: BigNumber
      debt?: BigNumber
      collateralPriceUSD?: BigNumber
      quoteTokenPriceUSD?: BigNumber
    } = {},
    pool: Partial<AjnaPool> = {},
  ): GetPosition =>
  async () => {
    return new AjnaPosition(
      await getPoolData(pool)('0x0000000000000000000000000000000000000000'),
      '0x0000000000000000000000000000000000000000',
      positionState.collateral || new BigNumber(0),
      positionState.debt || new BigNumber(0),
      positionState.collateralPriceUSD || new BigNumber(1700),
      positionState.quoteTokenPriceUSD || new BigNumber(1),
    )
  }
