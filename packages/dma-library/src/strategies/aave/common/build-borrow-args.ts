import { Address } from '@deploy-configurations/types/address'
import { ZERO } from '@dma-common/constants'
import { BorrowArgs } from '@dma-library/operations'
import { AaveLikeStrategyAddresses } from '@dma-library/operations/aave-like'
import { getAaveTokenAddress } from '@dma-library/strategies/aave/common'
import { AAVETokens } from '@dma-library/types'
import BigNumber from 'bignumber.js'

export async function buildBorrowArgs(
  borrowAmount: BigNumber,
  debtToken: { symbol: AAVETokens },
  dependencies: {
    user: Address
    proxy: string
    addresses: AaveLikeStrategyAddresses
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

  const borrowArgs: BorrowArgs = {
    account: dependencies.proxy,
    amount: borrowAmount,
    borrowToken:
      debtTokenAddress === dependencies.addresses.tokens.ETH
        ? dependencies.addresses.tokens.WETH
        : debtTokenAddress,
    user: dependencies.user,
    isEthToken: debtTokenAddress === dependencies.addresses.tokens.ETH,
  }
  const debtDelta = borrowAmount

  return { args: borrowArgs, debtDelta }
}
