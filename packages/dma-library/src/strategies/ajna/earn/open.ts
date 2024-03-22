import ajnaProxyActionsAbi from '@abis/external/protocols/ajna/ajnaProxyActions.json'
import poolInfoAbi from '@abis/external/protocols/ajna/poolInfoUtils.json'
import { ZERO } from '@dma-common/constants'
import { getAjnaEarnActionOutput, resolveTxValue } from '@dma-library/protocols/ajna'
import {
  AjnaEarnPosition,
  AjnaOpenEarnDependencies,
  AjnaOpenEarnPayload,
  SummerStrategy,
} from '@dma-library/types/ajna'
import { views } from '@dma-library/views'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

export type AjnaOpenEarnStrategy = (
  args: AjnaOpenEarnPayload,
  dependencies: AjnaOpenEarnDependencies,
) => Promise<SummerStrategy<AjnaEarnPosition>>

export const open: AjnaOpenEarnStrategy = async (args, dependencies) => {
  const action = 'open-earn'
  const position = await views.ajna.getEarnPosition(
    {
      collateralPrice: args.collateralPrice,
      quotePrice: args.quotePrice,
      proxyAddress: args.dpmProxyAddress,
      poolAddress: args.poolAddress,
      collateralToken: args.collateralToken,
      quoteToken: args.quoteToken,
    },
    {
      getEarnData: dependencies.getEarnData,
      poolInfoAddress: dependencies.poolInfoAddress,
      provider: dependencies.provider,
      getPoolData: dependencies.getPoolData,
    },
  )
  const isLendingEth = position.pool.quoteToken.toLowerCase() === dependencies.WETH.toLowerCase()

  const ajnaProxyActions = new ethers.Contract(
    dependencies.ajnaProxyActions,
    ajnaProxyActionsAbi,
    dependencies.provider,
  )

  const poolInfo = new ethers.Contract(
    dependencies.poolInfoAddress,
    poolInfoAbi,
    dependencies.provider,
  )

  const priceIndex = await poolInfo
    .priceToIndex(args.price.shiftedBy(18).toString())
    .then((res: any) => res.toString())
    .then((res: string) => new BigNumber(res))

  const data = ajnaProxyActions.interface.encodeFunctionData('openEarnPosition', [
    args.poolAddress,
    ethers.utils.parseUnits(args.quoteAmount.toString(), args.quoteTokenPrecision).toString(),
    args.price.shiftedBy(18).toString(),
  ])

  const targetPosition = new AjnaEarnPosition(
    position.pool,
    args.dpmProxyAddress,
    args.quoteAmount,
    ZERO,
    priceIndex,
    args.collateralPrice,
    args.quotePrice,
    position.netValue,
    position.pnl,
    position.totalEarnings,
    false,
    position.historicalApy,
  )

  return getAjnaEarnActionOutput({
    targetPosition,
    data,
    dependencies,
    args: {
      position: targetPosition,
      collateralAmount: ZERO,
      ...args,
    },
    txValue: resolveTxValue(isLendingEth, args.quoteAmount),
    action,
  })
}
