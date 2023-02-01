import BigNumber from 'bignumber.js'
import * as ethers from 'ethers'

import { RiskRatio } from '../..'
import ajnaProxyActionsAbi from '../../abi/ajna/ajnaProxyActions.json'
import poolInfoAbi from '../../abi/ajna/poolInfoUtils.json'
import { AjnaPosition } from '../../types/ajna'
import { Address, Strategy } from '../../types/common'

interface PaybackWithdrawArgs {
  poolAddress: Address
  dpmProxyAddress: Address
  debtAmount: BigNumber
  collateralAmount: BigNumber
}

interface Dependencies {
  poolInfoAddress: Address
  ajnaProxyActions: Address
  provider: ethers.providers.Provider
}

export async function paybackWithdraw(
  args: PaybackWithdrawArgs,
  dependencies: Dependencies,
): Promise<Strategy<AjnaPosition>> {
  const poolInfo = new ethers.Contract(
    dependencies.poolInfoAddress,
    poolInfoAbi,
    dependencies.provider,
  )
  const apa = new ethers.Contract(
    dependencies.ajnaProxyActions,
    ajnaProxyActionsAbi,
    dependencies.provider,
  )

  // const res = await poolInfo.poolPricesInfo(args.poolAddress)
  // // IAjnaPool pool,
  // // uint256 debtAmount,
  // // uint256 collateralAmount,
  // // uint256 price

  const data = apa.interface.encodeFunctionData('repayWithdraw', [
    args.poolAddress,
    args.debtAmount.toString(),
    args.collateralAmount.toString(),
  ])

  return {
    simulation: {
      swaps: [],
      targetPosition: {
        pool: {
          poolAddress: args.poolAddress,
          quoteToken: 'Address',
          collateralToken: 'Address',
          rate: new BigNumber(0),
        },
        owner: args.dpmProxyAddress,
        collateral: args.collateralAmount,
        debt: args.debtAmount,
        riskRatio: new RiskRatio(new BigNumber(0), RiskRatio.TYPE.COL_RATIO),
      },
    },
    tx: {
      to: dependencies.ajnaProxyActions,
      data,
      value: '0',
    },
  }
}
