import { OraclesConfig } from '@types'
import { OracleMock__factory } from '@typechain'
import { ethers } from 'hardhat'

export const MorphoPricePrecision = 36

export const DefaultOracleMock = {
  factory: OracleMock__factory,
  contractName: 'OracleMock',
}

export const MorphoOraclesConfig: OraclesConfig = {
  DAI: {
    WBTC: {
      ...DefaultOracleMock,
      initialPrice: ethers.utils.parseUnits('18000.0', MorphoPricePrecision),
    },
    USDC: {
      ...DefaultOracleMock,
      initialPrice: ethers.utils.parseUnits('1.0', MorphoPricePrecision),
    },
  },
  USDC: {
    USDT: {
      ...DefaultOracleMock,
      initialPrice: ethers.utils.parseUnits('1.0', MorphoPricePrecision),
    },
  },
  WSTETH: {
    WETH: {
      ...DefaultOracleMock,
      initialPrice: ethers.utils.parseUnits('1.0', MorphoPricePrecision),
    },
  },
}

export function getMorphoDefaultOraclesConfig(): OraclesConfig {
  return MorphoOraclesConfig
}
