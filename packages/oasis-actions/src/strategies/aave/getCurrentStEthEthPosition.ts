import BigNumber from 'bignumber.js'
import { ethers, providers } from 'ethers'

import aaveDataProviderABI from '../../abi/aaveDataProvider.json'
import aaveLendingPoolABI from '../../abi/aaveLendingPool.json'
import aavePriceOracleABI from '../../abi/aavePriceOracle.json'
import { IPosition, Position } from '../../helpers/calculations/Position'

export interface getCurrentStEthEthPositionParams {
  proxyAddress: string
}

export interface getCurrentStEthEthPositionDependencies {
  addresses: {
    stETH: string
    aavePriceOracle: string
    aaveLendingPool: string
    aaveProtocolDataProvider: string
  }
  provider: providers.Provider
}

export async function getCurrentStEthEthPosition(
  { proxyAddress }: getCurrentStEthEthPositionParams,
  { addresses, provider }: getCurrentStEthEthPositionDependencies,
): Promise<IPosition> {
  const aaveLendingPool = new ethers.Contract(
    addresses.aaveLendingPool,
    aaveLendingPoolABI,
    provider,
  )
  const aaveDataProvider = new ethers.Contract(
    addresses.aaveProtocolDataProvider,
    aaveDataProviderABI,
    provider,
  )

  const aavePriceOracle = new ethers.Contract(
    addresses.aavePriceOracle,
    aavePriceOracleABI,
    provider,
  )

  const [userAccountData, sthEthEthUserReverseData, stEthReserveData, aaveStEthPriceInEth]: [
    { totalDebtETH: ethers.BigNumberish },
    { currentATokenBalance: ethers.BigNumberish },
    { liquidationThreshold: ethers.BigNumberish; ltv: ethers.BigNumberish },
    BigNumber,
  ] = await Promise.all([
    aaveLendingPool.getUserAccountData(proxyAddress),
    aaveDataProvider.getUserReserveData(addresses.stETH, proxyAddress),
    aaveDataProvider.getReserveConfigurationData(addresses.stETH),
    aavePriceOracle
      .getAssetPrice(addresses.stETH)
      .then((amount: ethers.BigNumberish) => new BigNumber(amount.toString())),
  ])

  const BASE = new BigNumber(10000)
  const liquidationThreshold = new BigNumber(stEthReserveData.liquidationThreshold.toString()).div(
    BASE,
  )
  const maxLoanToValue = new BigNumber(stEthReserveData.ltv.toString()).div(BASE)

  return new Position(
    {
      amount: new BigNumber(userAccountData.totalDebtETH.toString()),
      denomination: 'ETH',
    },
    {
      amount: new BigNumber(sthEthEthUserReverseData.currentATokenBalance.toString()),
      denomination: 'STETH',
    },
    aaveStEthPriceInEth,
    {
      dustLimit: new BigNumber(0),
      maxLoanToValue: maxLoanToValue,
      liquidationThreshold: liquidationThreshold,
    },
  )
}
