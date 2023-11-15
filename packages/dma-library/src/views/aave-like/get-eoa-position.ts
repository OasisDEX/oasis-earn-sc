import { AaveLikeStrategyAddresses } from '@dma-library/operations/aave-like'
import { BigNumber } from 'bignumber.js'

interface TokenAmount {
  address: string
  amount: BigNumber
}

interface AaveLikeEOWPosition {
  collaterals: TokenAmount[]
  debts: TokenAmount[]
}

interface Args {
  eoa: string
  addresses: AaveLikeStrategyAddresses
}

export const getAaveLikeEoaPosition = async (args: Args): Promise<AaveLikeEOWPosition> => {
  return {
    collaterals: [],
    debts: [],
  }
}
