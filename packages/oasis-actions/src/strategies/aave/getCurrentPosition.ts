import BigNumber from 'bignumber.js'

import { Unbox } from '../../../../../helpers/types/common'
import { AAVEStrategyAddresses } from '../../operations/aave/v2/addresses'
import { AAVEV3StrategyAddresses } from '../../operations/aave/v3/addresses'
import { aaveV2UniqueContractName, aaveV3UniqueContractName } from '../../protocols/aave/config'
import { AaveProtocolData, getAaveProtocolData } from '../../protocols/aave/getAaveProtocolData'
import { IViewPositionDependencies, IViewPositionParams } from '../../types'
import { AavePosition, AAVETokens } from '../../types/aave'
import { getAaveTokenAddresses } from './getAaveTokenAddresses'

export enum AaveVersion {
  v2 = 'v2',
  v3 = 'v3',
}

export type AaveGetCurrentPositionArgs = IViewPositionParams<AAVETokens>
export type AaveV2GetCurrentPositionDependencies =
  IViewPositionDependencies<AAVEStrategyAddresses> & {
    protocolVersion: AaveVersion.v2
  }
export type AaveV3GetCurrentPositionDependencies =
  IViewPositionDependencies<AAVEV3StrategyAddresses> & { protocolVersion: AaveVersion.v3 }

export type AaveGetCurrentPositionDependencies =
  | AaveV2GetCurrentPositionDependencies
  | AaveV3GetCurrentPositionDependencies

export async function getCurrentPosition(
  { collateralToken, debtToken, proxy }: AaveGetCurrentPositionArgs,
  { addresses, provider, protocolVersion }: AaveGetCurrentPositionDependencies,
): Promise<AavePosition> {
  const isV2 = protocolVersion === AaveVersion.v2
  const isV3 = protocolVersion === AaveVersion.v3
  const { collateralTokenAddress, debtTokenAddress } = getAaveTokenAddresses(
    {
      collateralToken,
      debtToken,
    },
    addresses,
  )

  let protocolData: Unbox<AaveProtocolData> | undefined
  if (isV2 && aaveV2UniqueContractName in addresses) {
    protocolData = await getAaveProtocolData({
      collateralTokenAddress,
      debtTokenAddress,
      addresses,
      proxy,
      provider,
      protocolVersion,
    })
  }
  if (isV3 && aaveV3UniqueContractName in addresses) {
    protocolData = await getAaveProtocolData({
      collateralTokenAddress,
      debtTokenAddress,
      addresses,
      proxy,
      provider,
      protocolVersion,
    })
  }

  if (!protocolData) {
    throw new Error('Protocol data not found')
  }

  const {
    reserveDataForCollateral,
    userReserveDataForCollateral,
    userReserveDataForDebtToken,
    aaveCollateralTokenPriceInEth,
    aaveDebtTokenPriceInEth,
  } = protocolData

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
