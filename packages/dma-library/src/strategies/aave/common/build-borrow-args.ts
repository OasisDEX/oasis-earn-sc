import { Address } from '@deploy-configurations/types/address'
import { ZERO } from '@dma-common/constants'
import { BorrowArgs } from '@dma-library/operations'
import { AAVEV2StrategyAddresses } from '@dma-library/operations/aave/v2/addresses'
import { AAVEV3StrategyAddresses } from '@dma-library/operations/aave/v3'
import { getAaveTokenAddress } from '@dma-library/strategies'
import { AAVETokens } from '@dma-library/types'
import BigNumber from 'bignumber.js'

export async function buildBorrowArgs(
  borrowAmount: BigNumber,
  debtToken: { symbol: AAVETokens },
  dependencies: {
    user: Address
    proxy: string
    addresses: AAVEV3StrategyAddresses | AAVEV2StrategyAddresses
  },
  alwaysReturnArgs = false,
): Promise<{
  args: BorrowArgs | undefined
  debtDelta: BigNumber
}> {
  if (!alwaysReturnArgs && borrowAmount.lte(ZERO)) {
    return { args: undefined, debtDelta: ZERO }
  }

  const debtTokenAddress = getAaveTokenAddress(debtToken, dependencies.addresses)

  const borrowArgs = {
    account: dependencies.proxy,
    amountInBaseUnit: borrowAmount,
    borrowToken:
      debtTokenAddress === dependencies.addresses.ETH
        ? dependencies.addresses.WETH
        : debtTokenAddress,
    user: dependencies.user,
    isEthToken: debtTokenAddress === dependencies.addresses.ETH,
  }
  const debtDelta = borrowAmount

  return { args: borrowArgs, debtDelta }
}
