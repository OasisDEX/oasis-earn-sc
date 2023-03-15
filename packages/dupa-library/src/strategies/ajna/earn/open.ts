import ajnaProxyActionsAbi from '@oasisdex/dupa-contracts/abi/external/ajna/ajnaProxyActions.json'
import poolInfoAbi from '@oasisdex/dupa-contracts/abi/external/ajna/poolInfoUtils.json'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

import { AjnaEarnPosition } from '../../../types/ajna'
import { Address, Strategy } from '../../../types/common'
import * as views from '../../../views'
import { GetEarnData } from '../../../views/ajna'

interface Args {
  poolAddress: Address
  dpmProxyAddress: Address
  quoteAmount: BigNumber
  quoteTokenPrecision: number
  price: BigNumber
  isStakingNft: boolean
}

export interface Dependencies {
  poolInfoAddress: Address
  ajnaProxyActions: Address
  provider: ethers.providers.Provider
  WETH: Address
  getEarnData: GetEarnData
}

export async function open(
  args: Args,
  dependencies: Dependencies,
): Promise<Strategy<AjnaEarnPosition>> {
  const position = await views.ajna.getEarnPosition(
    {
      proxyAddress: args.dpmProxyAddress,
      poolAddress: args.poolAddress,
    },
    {
      getEarnData: dependencies.getEarnData,
      poolInfoAddress: dependencies.poolInfoAddress,
      provider: dependencies.provider,
    },
  )

  const isDepositingEth =
    position.pool.collateralToken.toLowerCase() === dependencies.WETH.toLowerCase()

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
    .priceToIndex(ethers.utils.parseUnits(args.price.toString(), 18).toString())
    .then((res: any) => res.toString())
    .then((res: string) => new BigNumber(res))

  const data = await ajnaProxyActions.interface.encodeFunctionData(
    args.isStakingNft ? 'openEarnPositionNft' : 'openEarnPosition',
    [
      args.poolAddress,
      ethers.utils.parseUnits(args.quoteAmount.toString(), args.quoteTokenPrecision).toString(),
      ethers.utils.parseUnits(args.price.toString(), 3).toString(),
    ],
  )

  return {
    simulation: {
      swaps: [],
      errors: [],
      targetPosition: new AjnaEarnPosition(
        position.pool,
        args.dpmProxyAddress,
        args.quoteAmount,
        priceIndex,
      ),
      position: new AjnaEarnPosition(
        position.pool,
        args.dpmProxyAddress,
        args.quoteAmount,
        priceIndex,
      ),
    },
    tx: {
      to: dependencies.ajnaProxyActions,
      data,
      value: isDepositingEth
        ? ethers.utils.parseUnits(args.quoteAmount.toString(), args.quoteTokenPrecision).toString()
        : '0',
    },
  }
}
