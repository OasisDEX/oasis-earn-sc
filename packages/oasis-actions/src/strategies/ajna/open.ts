import BigNumber from 'bignumber.js'
import * as ethers from 'ethers'

import ajnaProxyActionsAbi from '../../../../../abi/external/ajna/ajnaProxyActions.json'
import poolInfoAbi from '../../../../../abi/external/ajna/poolInfoUtils.json'
import { prepareAjnaPayload, resolveAjnaEthAction } from '../../helpers/ajna'
import { AjnaPosition } from '../../types/ajna'
import { Address, Strategy } from '../../types/common'
import * as views from '../../views'
import { GetPoolData } from '../../views/ajna'

export interface OpenArgs {
  poolAddress: Address
  dpmProxyAddress: Address
  collateralPrice: BigNumber
  quotePrice: BigNumber
  quoteAmount: BigNumber
  quoteTokenPrecision: number
  collateralAmount: BigNumber
  collateralTokenPrecision: number
}

export interface Dependencies {
  poolInfoAddress: Address
  ajnaProxyActions: Address
  provider: ethers.providers.Provider
  WETH: Address
  getPoolData: GetPoolData
}

export async function open(
  args: OpenArgs,
  dependencies: Dependencies,
): Promise<Strategy<AjnaPosition>> {
  const position = await views.ajna.getPosition(
    {
      collateralPrice: args.collateralPrice,
      quotePrice: args.quotePrice,
      proxyAddress: args.dpmProxyAddress,
      poolAddress: args.poolAddress,
    },
    {
      poolInfoAddress: dependencies.poolInfoAddress,
      provider: dependencies.provider,
      getPoolData: dependencies.getPoolData,
    },
  )

  if (position.collateralAmount.gt(0)) {
    throw new Error('Position already exists')
  }

  const poolInfo = new ethers.Contract(
    dependencies.poolInfoAddress,
    poolInfoAbi,
    dependencies.provider,
  )

  const htp = await poolInfo.htp(args.poolAddress)

  const isDepositingEth =
    position.pool.collateralToken.toLowerCase() === dependencies.WETH.toLowerCase()

  const ajnaProxyActions = new ethers.Contract(
    dependencies.ajnaProxyActions,
    ajnaProxyActionsAbi,
    dependencies.provider,
  )

  const data = ajnaProxyActions.interface.encodeFunctionData('openPosition', [
    args.poolAddress,
    ethers.utils.parseUnits(args.quoteAmount.toString(), args.quoteTokenPrecision).toString(),
    ethers.utils
      .parseUnits(args.collateralAmount.toString(), args.collateralTokenPrecision)
      .toString(),
    htp.toString(),
  ])

  const targetPosition = position.deposit(args.collateralAmount).borrow(args.quoteAmount)

  return prepareAjnaPayload({
    dependencies,
    targetPosition,
    data,
    errors: [],
    warnings: [],
    txValue: resolveAjnaEthAction(isDepositingEth, args.collateralAmount),
  })
}
