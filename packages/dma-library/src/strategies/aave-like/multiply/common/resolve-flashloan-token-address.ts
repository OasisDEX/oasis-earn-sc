import { Network } from '@deploy-configurations/types/network'
import * as StrategyParams from '@dma-library/types/strategy-params'

export function resolveFlashloanTokenAddress(
  debtTokenAddress: string,
  dependencies: Omit<StrategyParams.WithAaveLikeMultiplyStrategyDependencies, 'currentPosition'>,
): string {
  const lendingProtocol = dependencies.protocolType
  if (lendingProtocol === 'AAVE' || lendingProtocol === 'AAVE_V3') {
    return dependencies.network === Network.MAINNET
      ? dependencies.addresses.tokens.DAI
      : dependencies.addresses.tokens.USDC
  }
  return debtTokenAddress
}
