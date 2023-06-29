import { AAVEStrategyAddresses } from '@dma-library/operations/aave/v2'
import { AAVEV3StrategyAddresses } from '@dma-library/operations/aave/v3'
import { WithFlashloanToken } from '@dma-library/types'

export interface FlashloanDependencies {
  network: string
  addresses: AAVEV3StrategyAddresses | AAVEStrategyAddresses
}

export function getFlashloanToken({
  network,
  addresses,
}: FlashloanDependencies): WithFlashloanToken {
  const { DAI, USDC } = addresses

  const flashloanToken =
    network === 'mainnet'
      ? { symbol: 'DAI' as const, address: DAI, precision: 18 }
      : { symbol: 'USDC' as const, address: USDC, precision: 6 }

  return {
    flashloanToken,
  }
}
