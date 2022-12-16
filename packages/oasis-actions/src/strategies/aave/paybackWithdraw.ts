import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

import aavePriceOracleABI from '../../abi/aavePriceOracle.json'
import { amountFromWei } from '../../helpers'
import { Position } from '../../helpers/calculations/Position'
import { ZERO } from '../../helpers/constants'
import { getZeroSwap } from '../../helpers/swap/getZeroSwap'
import { AAVEStrategyAddresses } from '../../operations/aave/addresses'
import { AAVETokens } from '../../operations/aave/tokens'
import {
  IBasePositionTransitionArgs,
  IPositionTransitionDependencies,
  WithPaybackDebt,
  WithWithdrawCollateral,
} from '../types/IPositionRepository'
import { IPositionTransition } from '../types/IPositionTransition'
import * as operations from './../../operations'
import { getAAVETokenAddresses } from './getAAVETokenAddresses'
export async function paybackWithdraw(
  args: IBasePositionTransitionArgs<AAVETokens> & WithWithdrawCollateral & WithPaybackDebt,
  dependencies: IPositionTransitionDependencies<AAVEStrategyAddresses>,
): Promise<IPositionTransition> {
  const currentPosition = dependencies.currentPosition

  const { collateralTokenAddress, debtTokenAddress } = getAAVETokenAddresses(
    { debtToken: args.debtToken, collateralToken: args.collateralToken },
    dependencies.addresses,
  )

  const aavePriceOracle = new ethers.Contract(
    dependencies.addresses.aavePriceOracle,
    aavePriceOracleABI,
    dependencies.provider,
  )

  const [aaveCollateralTokenPriceInEth] = await Promise.all([
    aavePriceOracle
      .getAssetPrice(collateralTokenAddress)
      .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString()))),
  ])

  const transaction = await operations.aave.paybackWithdraw({
    amountCollateralToWithdrawInBaseUnit: args.amountCollateralToWithdrawInBaseUnit,
    amountDebtToPaybackInBaseUnit: args.amountDebtToPaybackInBaseUnit,
    collateralTokenAddress: collateralTokenAddress,
    debtTokenAddress: debtTokenAddress,
    collateralIsEth: currentPosition.collateral.symbol === 'ETH',
    debtTokenIsEth: currentPosition.debt.symbol === 'ETH',
    proxy: dependencies.proxy,
    user: dependencies.user,
    addresses: dependencies.addresses,
  })

  const finalPosition = new Position(
    {
      amount: currentPosition.debt.amount.minus(args.amountDebtToPaybackInBaseUnit),
      symbol: currentPosition.debt.symbol,
    },
    {
      amount: currentPosition.collateral.amount.plus(args.amountCollateralToWithdrawInBaseUnit),
      symbol: currentPosition.collateral.symbol,
    },
    aaveCollateralTokenPriceInEth,
    currentPosition.category,
  )

  const flags = {
    requiresFlashloan: false,
    isIncreasingRisk: currentPosition.riskRatio.loanToValue.lt(finalPosition.riskRatio.loanToValue),
  }

  return {
    transaction: transaction,
    simulation: {
      delta: {
        debt: currentPosition.debt.amount.plus(args.amountDebtToPaybackInBaseUnit),
        collateral: currentPosition.collateral.amount.minus(
          args.amountCollateralToWithdrawInBaseUnit,
        ),
        flashloanAmount: ZERO,
      },
      swap: getZeroSwap(args.collateralToken.symbol, args.debtToken.symbol),
      flags: flags,
      position: finalPosition,
      minConfigurableRiskRatio: finalPosition.riskRatio, // TODO: Change to min risk ratio
    },
  }
}
