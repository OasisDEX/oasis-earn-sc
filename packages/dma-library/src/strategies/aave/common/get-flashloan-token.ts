import { AaveLikeStrategyAddresses } from '@dma-library/operations/aave-like'
import { WithFlashLoanArgs } from '@dma-library/types'
import { AaveLikeProtocol } from '@dma-library/types/protocol'

export interface FlashloanDependencies {
  protocol: AaveLikeProtocol
  network: string
  addresses: AaveLikeStrategyAddresses
  debt: {
    symbol: string
    address: string
    precision: number
  }
}

export function getFlashloanToken({
  network,
  addresses,
  protocol,
  debt,
}: FlashloanDependencies): WithFlashLoanArgs {
  if (protocol === 'Spark') {
    return {
      flashloan: {
        token: debt,
      },
    }
  }

  const { DAI, USDC } = addresses.tokens

  const flashloanToken =
    network === 'mainnet'
      ? { symbol: 'DAI' as const, address: DAI, precision: 18 }
      : { symbol: 'USDC' as const, address: USDC, precision: 6 }

  return {
    flashloan: {
      token: flashloanToken,
    },
  }
}
