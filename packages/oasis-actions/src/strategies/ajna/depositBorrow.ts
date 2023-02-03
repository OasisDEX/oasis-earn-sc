import BigNumber from 'bignumber.js'
import * as ethers from 'ethers'

import { RiskRatio } from '../..'
import ajnaProxyActionsAbi from '../../abi/ajna/ajnaProxyActions.json'
import { AjnaPosition } from '../../types/ajna'
import { Address, Strategy } from '../../types/common'
import * as views from '../../views'

export interface DepositBorrowArgs {
  poolAddress: Address
  dpmProxyAddress: Address
  quoteAmount: BigNumber
  quoteTokenPrecision: number
  collateralAmount: BigNumber
  collateralTokenPrecision: number
  price: BigNumber
}

export interface Dependencies {
  poolInfoAddress: Address
  ajnaProxyActions: Address
  provider: ethers.providers.Provider
  WETH: Address
}

export async function depositBorrow(
  args: DepositBorrowArgs,
  dependencies: Dependencies,
): Promise<Strategy<AjnaPosition>> {
  const position = await views.ajna.getPosition(
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

  const apa = new ethers.Contract(
    dependencies.ajnaProxyActions,
    ajnaProxyActionsAbi,
    dependencies.provider,
  )

  const data = apa.interface.encodeFunctionData('depositAndDraw', [
    args.poolAddress,
    ethers.utils.parseUnits(args.quoteAmount.toString(), args.quoteTokenPrecision).toString(),
    ethers.utils
      .parseUnits(args.collateralAmount.toString(), args.collateralTokenPrecision)
      .toString(),
    args.price.toString(),
  ])

  return {
    simulation: {
      swaps: [],
      targetPosition: {
        pool: position.pool,
        liquidationPrice: new BigNumber(0),
        owner: args.dpmProxyAddress,
        collateralAmount: position.collateralAmount.minus(args.collateralAmount),
        debtAmount: position.collateralAmount.minus(args.quoteAmount),
        riskRatio: new RiskRatio(new BigNumber(0), RiskRatio.TYPE.COL_RATIO),
      },
    },
    tx: {
      to: dependencies.ajnaProxyActions,
      data,
      value: isDepositingEth
        ? ethers.utils.parseUnits(args.collateralAmount.toString(), 18).toString()
        : '0',
    },
  }
}
