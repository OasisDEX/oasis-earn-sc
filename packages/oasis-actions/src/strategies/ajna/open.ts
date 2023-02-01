import BigNumber from 'bignumber.js'
import * as ethers from 'ethers'

import { RiskRatio } from '../..'
import poolERC20Abi from '../../abi/ajna/ajnaPoolERC20.json'
import ajnaProxyActionsAbi from '../../abi/ajna/ajnaProxyActions.json'
import { AjnaPosition } from '../../types/ajna'
import { Address, Strategy } from '../../types/common'

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
  const pool = new ethers.Contract(args.poolAddress, poolERC20Abi, dependencies.provider)

  const collateralAddress = await pool.collateralAddress()
  const quoteTokenAddress = await pool.quoteTokenAddress()
  const isDepositingEth = collateralAddress.toLowerCase() === dependencies.WETH.toLowerCase()

  const apa = new ethers.Contract(
    dependencies.ajnaProxyActions,
    ajnaProxyActionsAbi,
    dependencies.provider,
  )

  const data = apa.interface.encodeFunctionData('depositAndDraw', [
    args.poolAddress,
    args.debtAmount.toString(),
    args.collateralAmount.toString(),
    args.price.toString(),
  ])

  return {
    simulation: {
      swaps: [],
      targetPosition: {
        pool: {
          poolAddress: args.poolAddress,
          quoteToken: quoteTokenAddress,
          collateralToken: collateralAddress,
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
      value: isDepositingEth ? ethers.utils.formatEther(args.collateralAmount.toString()) : '0',
    },
  }
}
