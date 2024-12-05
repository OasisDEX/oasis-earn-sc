import IBundlerInterface from '@abis/system/contracts/interfaces/morpho-blue/IBundler.sol/IBundler.json'
import { Network } from '@deploy-configurations/types/network'
import { ChainIdByNetwork } from '@deploy-configurations/utils/network'
import { MarketParams } from '@dma-library/types/morphoblue/morphoblue-position'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

const API_URL = 'https://blue-api.morpho.org/graphql'
const BUFFER_FACTOR = new BigNumber(1.001)
/**
 * @notice Structure representing a withdrawal.
 * @param marketParams Market parameters for the withdrawal.
 * @param amount Amount to withdraw in bigint.
 */
interface Withdrawal {
  marketParams: ParsedMarketParams
  amount: bigint
}

/**
 * @notice Structure representing market parameters (as strings).
 * @param loanToken Address of the loan token.
 * @param collateralToken Address of the collateral token.
 * @param oracle Address of the oracle.
 * @param irm Address of the interest rate model (IRM).
 * @param lltv Loan-to-Value ratio as a string.
 */
interface ParsedMarketParams {
  loanToken: string
  collateralToken: string
  oracle: string
  irm: string
  lltv: string
}

// GraphQL Queries
const queries = {
  query1: `
    query PublicAllocators($chainId: Int!) {
      publicAllocators(where: { chainId_in: [$chainId] }) {
        items {
          address
          creationBlockNumber
          morphoBlue {
            address
            chain {
              id
              network
            }
          }
        }
      }
    }
  `,
  query2: `
    query MarketByUniqueKey($uniqueKey: String!, $chainId: Int!) {
      marketByUniqueKey(uniqueKey: $uniqueKey, chainId: $chainId) {
        reallocatableLiquidityAssets
        loanAsset {
          address
          decimals
          priceUsd
        }
        state {
          liquidityAssets
        }
        publicAllocatorSharedLiquidity {
          assets
          vault {
            address
            name
          }
          allocationMarket {
            uniqueKey
            loanAsset {
              address
            }
            collateralAsset {
              address
            }
            irmAddress
            oracle {
              address
            }
            lltv
          }
        }
        collateralAsset {
          address
        }
        oracle {
          address
        }
        irmAddress
        lltv  
      }
    }
  `,
}

/**
 * @notice Helper function to fetch data from the Morpho API.
 * @param query The GraphQL query string.
 * @param variables Optional variables for the query.
 * @return The JSON response from the API.
 */
export const fetchAPI = async (query: string, variables?: any) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })
  return response.json()
}

/**
 * @notice Query the public allocator address for a given chain ID.
 * @param chainId The ID of the blockchain network.
 * @return The address of the public allocator.
 */
export const queryPublicAllocatorAddress = async (chainId: number): Promise<string> => {
  const query = queries.query1
  const data: any = await fetchAPI(query, { chainId })
  const address = data?.data?.publicAllocators?.items?.[0]?.address || ''
  return address
}

interface MarketByUniqueKeyResponse {
  reallocatableLiquidityAssets: number
  loanAsset: {
    address: string
    decimals: number
    priceUsd: number
  }
  state: {
    liquidityAssets: number
  }
  publicAllocatorSharedLiquidity: Array<{
    assets: number
    vault: {
      address: string
      name: string
    }
    allocationMarket: {
      uniqueKey: string
      loanAsset: {
        address: string
      }
      collateralAsset: {
        address: string
      }
      irmAddress: string
      oracle: {
        address: string
      }
      lltv: number
    }
  }>
  collateralAsset: {
    address: string
  }
  oracle: {
    address: string
  }
  irmAddress: string
  lltv: number
}

/**
 * @notice Query market data using a unique key and chain ID.
 * @param uniqueKey The unique key for the market.
 * @param chainId The ID of the blockchain network.
 * @return The market data.
 */
export const queryMarketData = async (
  uniqueKey: string,
  chainId: number,
): Promise<MarketByUniqueKeyResponse> => {
  const query = queries.query2
  const data: any = await fetchAPI(query, { uniqueKey, chainId })
  return data?.data?.marketByUniqueKey || {}
}

/**
 * @notice Extract data from market data for withdrawals and supply market parameters.
 * @param marketData The market data object.
 * @return An object containing withdrawals grouped by vault and supply market parameters.
 */
const extractDataForReallocation = (
  marketData: MarketByUniqueKeyResponse,
  liquidity: BigNumber,
) => {
  const withdrawalsPerVault: { [vaultAddress: string]: Withdrawal[] } = {}
  const availableLiquidity = new BigNumber(marketData.state.liquidityAssets)
  // Subtract the liquidity available in the market from the total liquidity required
  let remainingLiquidity = liquidity.minus(availableLiquidity)
  // Add a buffer factor to the remaining liquidity ( account for constatnt interest accrual, stale calldata etc )
  remainingLiquidity = remainingLiquidity.times(BUFFER_FACTOR)

  // First, group and sum assets by vault
  const vaultTotalAssets = marketData.publicAllocatorSharedLiquidity.reduce(
    (acc: { [key: string]: BigNumber }, item: any) => {
      const vaultAddress = item.vault.address
      acc[vaultAddress] = (acc[vaultAddress] || new BigNumber(0)).plus(item.assets)
      return acc
    },
    {},
  )

  // Sort vaults by total assets (descending)
  const sortedVaults = Object.entries(vaultTotalAssets).sort(([, a], [, b]) =>
    b.minus(a).toNumber(),
  )

  // Process each vault's allocations
  for (const [vaultAddress] of sortedVaults) {
    if (remainingLiquidity.lte(0)) break

    const vaultAllocations = marketData.publicAllocatorSharedLiquidity.filter(
      (item: any) => item.vault.address === vaultAddress,
    )

    for (const item of vaultAllocations) {
      const itemAmount = new BigNumber(item.assets)

      // Skip if we've already collected enough liquidity
      if (remainingLiquidity.lte(0)) break

      // Calculate how much we can take from this allocation
      const amountToTake = BigNumber.minimum(itemAmount, remainingLiquidity)
      remainingLiquidity = remainingLiquidity.minus(amountToTake)

      const withdrawal: Withdrawal = {
        marketParams: {
          loanToken: item.allocationMarket.loanAsset.address,
          collateralToken: item.allocationMarket.collateralAsset?.address ||
            "0x0000000000000000000000000000000000000000",
          oracle: item.allocationMarket.oracle?.address ||
            "0x0000000000000000000000000000000000000000",
          irm: item.allocationMarket.irmAddress,
          lltv: item.allocationMarket.lltv.toString(),
        },
        amount: BigInt(amountToTake.toString()),
      }

      if (!withdrawalsPerVault[vaultAddress]) {
        withdrawalsPerVault[vaultAddress] = []
      }

      withdrawalsPerVault[vaultAddress].push(withdrawal)
    }
  }

  const supplyMarketParams: ParsedMarketParams = {
    loanToken: marketData.loanAsset.address,
    collateralToken: marketData.collateralAsset.address,
    oracle: marketData.oracle.address,
    irm: marketData.irmAddress,
    lltv: marketData.lltv.toString(),
  }

  return { withdrawalsPerVault, supplyMarketParams }
}

/**
 * @notice Encode the market parameters to get a market ID.
 * @param market The market parameters.
 * @return The market ID as a string.
 *
 * @example
 * getReallocateToData(
 *   {
 *     loanToken: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
 *     collateralToken: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
 *     oracle: "0x95DB30fAb9A3754e42423000DF27732CB2396992",
 *     irm: "0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC",
 *     lltv: "860000000000000000"
 *   },
 *   Network.MAINNET,
 *   new BigNumber("193798099400")
 * )
 */
export const getMarketId = (market: MarketParams | ParsedMarketParams) => {
  const abiCoder = new ethers.utils.AbiCoder()
  // Convert lltv to a BigNumber and then to a string to ensure it's an integer
  // https://docs.morpho.org/morpho/contracts/morpho/
  const lltvBigNumber = ethers.utils.parseUnits(market.lltv.toString(), 18)
  console.log(`lltvBigNumber: ${lltvBigNumber.toString()}`)
  const encodedMarket = abiCoder.encode(
    ['address', 'address', 'address', 'address', 'uint256'],
    [market.loanToken, market.collateralToken, market.oracle, market.irm, lltvBigNumber.toString()],
  )
  const keccak256EncodedMarket = ethers.utils.keccak256(encodedMarket)
  console.log(`keccak256EncodedMarket: ${keccak256EncodedMarket}`)
  return keccak256EncodedMarket
}

/**
 * @notice Main function to execute the reallocation process and create transaction JSON.
 * @param market The market parameters.
 * @param network The network.
 * @param liquidity The liquidity to reallocate.
 */
export const getReallocateToData = async (
  market: MarketParams,
  network: Network,
  liquidity: BigNumber,
) => {
  console.log(`
    Starting reallocation process...`)
  const chainId = ChainIdByNetwork[network]
  console.log(`Chain ID: ${chainId}`)
  const marketId = getMarketId(market)
  console.log(`Market ID: ${marketId}`)
  const publicAllocatorAddress = await queryPublicAllocatorAddress(chainId)
  console.log(`Public Allocator Address: ${publicAllocatorAddress}`)
  if (!publicAllocatorAddress) throw new Error(`Public Allocator Address not found.`)

  const marketData = await queryMarketData(marketId, chainId)
  console.log(`Market Data: ${JSON.stringify(marketData)}`)

  if (!marketData) throw new Error('Market data not found.')

  const { withdrawalsPerVault, supplyMarketParams } = extractDataForReallocation(
    marketData,
    liquidity,
  )

  const bundlerInterface = new ethers.utils.Interface(IBundlerInterface)

  const reallocateData = Object.keys(withdrawalsPerVault).map(vaultAddress => {
    const data = bundlerInterface.encodeFunctionData('reallocateTo', [
      vaultAddress,
      withdrawalsPerVault[vaultAddress].sort((a, b) =>
        getMarketId(a.marketParams).localeCompare(getMarketId(b.marketParams)),
      ),
      supplyMarketParams,
    ])
    return data
  })

  console.log(`Reallocate data length: ${reallocateData.length}`)

  return {
    reallocateData,
    reallocatableLiquidityAssets: new BigNumber(marketData.reallocatableLiquidityAssets),
  }
}
