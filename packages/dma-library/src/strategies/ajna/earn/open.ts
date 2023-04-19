import { AjnaEarnPosition } from '@dma-library/types/ajna'
import { Strategy } from '@dma-library/types/common'
import { resolveAjnaEthAction } from '@dma-library/utils/ajna'
import * as views from '@dma-library/views'
import { GetEarnData } from '@dma-library/views/ajna'
import ajnaProxyActionsAbi from '@oasisdex/abis/external/protocols/ajna/ajnaProxyActions.json'
import poolInfoAbi from '@oasisdex/abis/external/protocols/ajna/poolInfoUtils.json'
import { Address } from '@oasisdex/dma-common/types/address'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

interface Args {
  poolAddress: Address
  dpmProxyAddress: Address
  quoteAmount: BigNumber
  quoteTokenPrecision: number
  price: BigNumber
  isStakingNft: boolean
  collateralPrice: BigNumber
  quotePrice: BigNumber
}

export interface Dependencies {
  poolInfoAddress: Address
  rewardsManagerAddress: Address
  ajnaProxyActions: Address
  provider: ethers.providers.Provider
  WETH: Address
  getEarnData: GetEarnData
  getPoolData: GetPoolData
}

export async function open(
  args: Args,
  dependencies: Dependencies,
): Promise<Strategy<AjnaEarnPosition>> {
  const action = 'open-earn'
  const position = await views.ajna.getEarnPosition(
    {
      collateralPrice: args.collateralPrice,
      quotePrice: args.quotePrice,
      proxyAddress: args.dpmProxyAddress,
      poolAddress: args.poolAddress,
    },
    {
      getEarnData: dependencies.getEarnData,
      poolInfoAddress: dependencies.poolInfoAddress,
      provider: dependencies.provider,
      getPoolData: dependencies.getPoolData,
      rewardsManagerAddress: dependencies.rewardsManagerAddress,
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

  const data = ajnaProxyActions.interface.encodeFunctionData(
    args.isStakingNft ? 'openEarnPositionNft' : 'openEarnPosition',
    [
      args.poolAddress,
      ethers.utils.parseUnits(args.quoteAmount.toString(), args.quoteTokenPrecision).toString(),
      args.price.shiftedBy(18).toString(),
    ],
  )

  const targetPosition = new AjnaEarnPosition(
    position.pool,
    args.dpmProxyAddress,
    args.quoteAmount,
    priceIndex,
    position.nftId,
    args.collateralPrice,
    args.quotePrice,
    position.rewards,
  )

  return getAjnaEarnActionOutput({
    targetPosition,
    data,
    dependencies,
    args: {
      position: targetPosition,
      collateralAmount: new BigNumber(0),
      ...args,
    },
    txValue: resolveAjnaEthAction(isLendingEth, args.quoteAmount),
    action,
  })
}
