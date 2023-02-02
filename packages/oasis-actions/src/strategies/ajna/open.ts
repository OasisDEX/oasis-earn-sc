import BigNumber from 'bignumber.js'
import * as ethers from 'ethers'

import { RiskRatio } from '../..'
import ajnaProxyActionsAbi from '../../abi/ajna/ajnaProxyActions.json'
import { AjnaPosition } from '../../types/ajna'
import { Address, Strategy } from '../../types/common'
import { views } from '../../views'

interface OpenArgs {
  poolAddress: Address
  dpmProxyAddress: Address
  debtAmount: BigNumber
  collateralAmount: BigNumber
  price: BigNumber
}

interface Dependencies {
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
      proxy: args.dpmProxyAddress,
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

  const data = apa.interface.encodeFunctionData('openPosition', [
    args.poolAddress,
    args.debtAmount.toString(),
    args.collateralAmount.toString(),
    args.price.toString(),
  ])

  return {
    simulation: {
      swaps: [],
      targetPosition: {
        pool: position.pool,
        liquidationPrice: new BigNumber(0),
        owner: args.dpmProxyAddress,
        collateralAmount: args.collateralAmount,
        debtAmount: args.debtAmount,
        riskRatio: new RiskRatio(new BigNumber(0), RiskRatio.TYPE.COL_RATIO),
      },
    },
    tx: {
      to: dependencies.ajnaProxyActions,
      data,
      value: isDepositingEth ? args.collateralAmount.toString() : '0',
    },
  }
}
