import { AaveLikeStrategyAddresses } from '@dma-library/operations/aave-like'
import { WithFlashloanToken } from '@dma-library/types'

export interface FlashloanDependencies {
  network: string
  addresses: AaveLikeStrategyAddresses
}

export function getFlashloanToken({
  network,
  addresses,
}: FlashloanDependencies): WithFlashloanToken {
  const { DAI, USDC } = addresses.tokens

  const flashloanToken =
    network === 'mainnet'
      ? { symbol: 'DAI' as const, address: DAI, precision: 18 }
      : { symbol: 'USDC' as const, address: USDC, precision: 6 }

  return {
    flashloanToken,
  }
}
