import { FEE_BASE } from '@dma-common/constants'
import * as StrategyParams from '@dma-library/types/strategy-params'
import { IPositionTransitionParams } from '@domain'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

const abi = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
]

/**
 * TODO: Remove the need for this function
 * Flashloan calculations should not be part of the adjustToTargetRiskRatio logic
 */
export async function buildFlashloanSimArgs(
  flashloanTokenAddress: string,
  dependencies: Omit<StrategyParams.WithAaveLikeMultiplyStrategyDependencies, 'currentPosition'>,
  reserveDataForFlashloan: { ltv: BigNumber },
): Promise<IPositionTransitionParams['flashloan'] | undefined> {
  const lendingProtocol = dependencies.protocolType
  if (lendingProtocol === 'AAVE' || lendingProtocol === 'AAVE_V3') {
    const maxLoanToValueForFL = new BigNumber(reserveDataForFlashloan.ltv.toString()).div(FEE_BASE)

    const erc20 = new ethers.Contract(flashloanTokenAddress, abi, dependencies.provider)
    const decimals = await erc20.decimals()
    const symbol = await erc20.symbol()

    return {
      maxLoanToValueFL: maxLoanToValueForFL,
      token: {
        symbol: symbol,
        precision: decimals,
      },
    }
  }
  return undefined
}
