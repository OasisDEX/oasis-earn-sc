import BigNumber from 'bignumber.js'
import { ethers, providers } from 'ethers'

import aavePriceOracleABI from '../../abi/aavePriceOracle.json'
import aaveProtocolDataProviderABI from '../../abi/aaveProtocolDataProvider.json'
import { amountFromWei } from '../../helpers'
import { ADDRESSES } from '../../helpers/addresses'
import { AAVEV3StrategyAddresses } from '../../operations/aaveV3/addresses'

export type AaveV3OpenProtocolDataArgs = {
  collateralTokenAddress: string
  debtTokenAddress: string
  addresses: AAVEV3StrategyAddresses
  provider: providers.Provider
}

export const getOpenV3ProtocolData = async ({
  collateralTokenAddress,
  debtTokenAddress,
  addresses,
  provider,
}: AaveV3OpenProtocolDataArgs) => {
  const aavePriceOracle = new ethers.Contract(
    addresses.aavePriceOracle,
    aavePriceOracleABI,
    provider,
  )

  const aaveProtocolDataProvider = new ethers.Contract(
    addresses.aaveProtocolDataProvider,
    aaveProtocolDataProviderABI,
    provider,
  )

  const [
    aaveFlashloanDaiPriceInEth,
    aaveDebtTokenPriceInEth,
    aaveCollateralTokenPriceInEth,
    reserveDataForFlashloan,
  ] = await Promise.all([
    aavePriceOracle
      .getAssetPrice(ADDRESSES.main.DAI)
      .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString()))),
    aavePriceOracle
      .getAssetPrice(debtTokenAddress)
      .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString()))),
    aavePriceOracle
      .getAssetPrice(collateralTokenAddress)
      .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString()))),
    aaveProtocolDataProvider.getReserveConfigurationData(ADDRESSES.main.DAI),
  ])

  return {
    aaveFlashloanDaiPriceInEth,
    aaveDebtTokenPriceInEth,
    aaveCollateralTokenPriceInEth,
    reserveDataForFlashloan,
  }
}

export type AaveV3OpenProtocolData = ReturnType<typeof getOpenV3ProtocolData>
