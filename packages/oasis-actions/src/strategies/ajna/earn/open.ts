import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

import ajnaProxyActionsAbi from '../../../../../../abi/external/ajna/ajnaProxyActions.json'
import poolInfoAbi from '../../../../../../abi/external/ajna/poolInfoUtils.json'
import { AjnaEarn } from '../../../helpers/ajna/AjnaEarn'
import { Address, Strategy } from '../../../types/common'
import * as views from '../../../views'

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
}

export async function open(args: Args, dependencies: Dependencies): Promise<Strategy<AjnaEarn>> {
  const position = await views.ajna.getEarnPosition(
    {
      proxyAddress: args.dpmProxyAddress,
      poolAddress: args.poolAddress,
    },
    {
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

  console.log(`
    PRICE INDEX: ${priceIndex}
    PRICE ${args.price.toString()}
    ${args.quoteAmount.toString()}
    ${ethers.utils.parseUnits(args.quoteAmount.toString(), args.quoteTokenPrecision).toString()}
  `)

  const data = await ajnaProxyActions.interface.encodeFunctionData(
    args.isStakingNft ? 'supplyQuoteMintNftAndStake' : 'supplyQuote',
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
      targetPosition: new AjnaEarn(
        position.pool,
        args.dpmProxyAddress,
        args.quoteAmount,
        priceIndex,
      ),
      position: new AjnaEarn(position.pool, args.dpmProxyAddress, args.quoteAmount, priceIndex),
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
