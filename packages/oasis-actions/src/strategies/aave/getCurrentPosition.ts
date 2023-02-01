import BigNumber from 'bignumber.js'

import { AAVEStrategyAddresses } from '../../operations/aave/v2/addresses'
import { AAVEV3StrategyAddresses } from '../../operations/aave/v3/addresses'
import { getAaveProtocolData } from '../../protocols/aave/getAaveProtocolData'
import { IViewPositionDependencies, IViewPositionParams } from '../../types'
import { AavePosition, AAVETokens } from '../../types/aave'
import { getAaveTokenAddresses } from './getAaveTokenAddresses'

export type AAVEGetCurrentPositionArgs = IViewPositionParams<AAVETokens> & {
  protocolVersion: 2 | 3
}
export type AAVEGetCurrentPositionDependencies = IViewPositionDependencies<
  AAVEStrategyAddresses | AAVEV3StrategyAddresses
>

export async function getCurrentPosition(
  { collateralToken, debtToken, proxy, protocolVersion }: AAVEGetCurrentPositionArgs,
  { addresses, provider }: AAVEGetCurrentPositionDependencies,
): Promise<AavePosition> {
  const { collateralTokenAddress, debtTokenAddress } = getAaveTokenAddresses(
    {
      collateralToken,
      debtToken,
    },
    addresses,
  )

  const {
    aaveDebtTokenPriceInEth,
    aaveCollateralTokenPriceInEth,
    userReserveDataForDebtToken,
    userReserveDataForCollateral,
    reserveDataForCollateral,
  } = await getAaveProtocolData({
    collateralTokenAddress,
    debtTokenAddress,
    addresses,
    proxy,
    provider,
    protocolVersion,
  })

  const BASE = new BigNumber(10000)
  const liquidationThreshold = new BigNumber(
    reserveDataForCollateral.liquidationThreshold.toString(),
  ).div(BASE)
  const maxLoanToValue = new BigNumber(reserveDataForCollateral.ltv.toString()).div(BASE)

  const oracle = aaveCollateralTokenPriceInEth.div(aaveDebtTokenPriceInEth)

  return new AavePosition(
    {
      amount: new BigNumber(userReserveDataForDebtToken.currentVariableDebt.toString()),
      symbol: debtToken.symbol,
      precision: debtToken.precision,
      address: debtTokenAddress,
    },
    {
      amount: new BigNumber(userReserveDataForCollateral.currentATokenBalance.toString()),
      symbol: collateralToken.symbol,
      precision: collateralToken.precision,
      address: collateralTokenAddress,
    },
    oracle,
    {
      dustLimit: new BigNumber(0),
      maxLoanToValue: maxLoanToValue,
      liquidationThreshold: liquidationThreshold,
    },
  )
}
