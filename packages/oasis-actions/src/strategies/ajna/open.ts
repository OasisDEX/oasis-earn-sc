import BigNumber from 'bignumber.js'
import * as ethers from 'ethers'

import ajnaProxyActionsAbi from '../../abi/ajna/ajnaProxyActions.json'
import { AjnaPosition } from '../../types/ajna'
import { Address, Strategy } from '../../types/common'
import * as views from '../../views'

export interface OpenArgs {
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

export async function open(
  args: OpenArgs,
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

  if (position.collateralAmount.gt(0)) {
    throw new Error('Position already exists')
  }

  // const iPosition = new Position(
  //   { amount: position.debtAmount, precision: args.debtTokenPrecision, symbol: 'NONE' },
  //   { amount: position.collateralAmount, precision: args.collateralTokenPrecision, symbol: 'NONE' },
  //   new BigNumber(1),
  //   {
  //     dustLimit: new BigNumber(0),
  //     liquidationThreshold: new BigNumber(100),
  //     maxLoanToValue: new BigNumber(100),
  //   },
  // )

  const isDepositingEth =
    position.pool.collateralToken.toLowerCase() === dependencies.WETH.toLowerCase()

  const apa = new ethers.Contract(
    dependencies.ajnaProxyActions,
    ajnaProxyActionsAbi,
    dependencies.provider,
  )

  const data = apa.interface.encodeFunctionData('openPosition', [
    args.poolAddress,
    ethers.utils.parseUnits(args.quoteAmount.toString(), args.quoteTokenPrecision).toString(),
    ethers.utils
      .parseUnits(args.collateralAmount.toString(), args.collateralTokenPrecision)
      .toString(),
    args.price.toString(),
  ])

  const targetPosition = position.deposit(args.collateralAmount).borrow(args.quoteAmount)

  return {
    simulation: {
      swaps: [],
      targetPosition,
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
