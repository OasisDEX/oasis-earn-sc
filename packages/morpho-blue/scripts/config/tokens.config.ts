import {
  FakeDAI__factory,
  FakeUSDC__factory,
  FakeUSDT__factory,
  FakeWBTC__factory,
  FakeWETH__factory,
  FakeWSTETH__factory,
} from '@typechain'

import type { TokensConfig } from '../types'

export const MorphoTokensConfig: TokensConfig = {
  DAI: {
    factory: FakeDAI__factory,
    contractName: 'FakeDAI',
  },
  USDC: {
    factory: FakeUSDC__factory,
    contractName: 'FakeUSDC',
  },
  USDT: {
    factory: FakeUSDT__factory,
    contractName: 'FakeUSDT',
  },
  WBTC: {
    factory: FakeWBTC__factory,
    contractName: 'FakeWBTC',
  },
  WETH: {
    factory: FakeWETH__factory,
    contractName: 'FakeWETH',
  },
  WSTETH: {
    factory: FakeWSTETH__factory,
    contractName: 'FakeWSTETH',
  },
}

export function getMorphoDefaultTokensConfig(): TokensConfig {
  return MorphoTokensConfig
}
