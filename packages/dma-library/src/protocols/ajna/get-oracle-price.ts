import { Address } from '@deploy-configurations/types/address'
import { getAbiForContract } from '@dma-library/utils/abis/get-abi-for-contraxt'
import BigNumber from 'bignumber.js'
import { ethers, providers } from 'ethers'

/**
 * Get an oracle price from ChainLink
 *
 * Not used yet, but may be useful in the future
 */

export interface GetOraclePrice {
  (priceFeedAddress: Address, provider: providers.Provider): Promise<BigNumber>
}
export const getOraclePrice: GetOraclePrice = async (
  priceFeedAddress: Address,
  provider: providers.Provider,
): Promise<BigNumber> => {
  const priceFeed = new ethers.Contract(
    priceFeedAddress,
    await getAbiForContract('chainLinkOracle', provider),
    provider,
  )

  const priceData = await priceFeed.latestRoundData()
  return priceData.answer
}
