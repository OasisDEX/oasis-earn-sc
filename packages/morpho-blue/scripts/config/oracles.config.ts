import { OraclesConfig } from '@types'
import { OracleMock__factory } from '@typechain'
import { ethers } from 'hardhat'

export const MorphoPricePrecision = 36

export const DefaultOracleMock = {
  factory: OracleMock__factory,
  contractName: 'OracleMock',
}

const DAIDecimals = 18
const USDCDecimals = 6
const USDTDecimals = 6
const WETHDecimals = 18
const WBTCDecimals = 8
const WSTETHDecimals = 18

export const MorphoOraclesConfig: OraclesConfig = {
  DAI: {
    WBTC: {
      ...DefaultOracleMock,
      initialPrice: ethers.utils.parseUnits(
        '18000.0',
        MorphoPricePrecision + DAIDecimals - WBTCDecimals,
      ),
    },
    USDC: {
      ...DefaultOracleMock,
      initialPrice: ethers.utils.parseUnits(
        '1.0',
        MorphoPricePrecision + DAIDecimals - USDCDecimals,
      ),
    },
  },
  USDC: {
    USDT: {
      ...DefaultOracleMock,
      initialPrice: ethers.utils.parseUnits(
        '1.0',
        MorphoPricePrecision + USDCDecimals - USDTDecimals,
      ),
    },
  },
  WSTETH: {
    WETH: {
      ...DefaultOracleMock,
      initialPrice: ethers.utils.parseUnits(
        '1.0',
        MorphoPricePrecision + WSTETHDecimals - WETHDecimals,
      ),
    },
  },
}

export function getMorphoDefaultOraclesConfig(): OraclesConfig {
  return MorphoOraclesConfig
}
