import { IrmMock, Morpho } from '@typechain'
import { MarketParamsStruct } from '@typechain/contracts/Morpho'
import { BigNumber, Contract, ContractFactory } from 'ethers'

export type Address = string

/**
 * @notice Token deployment configuration for the Morpho protocol
 */
export type TokenConfig = {
  factory: typeof ContractFactory
  contractName: string
}

export type TokensConfig = {
  [key: string]: TokenConfig
}

/**
 * @notice Token deployment result for the Morpho protocol
 */
export type TokensDeployment = {
  [key: string]: {
    contract: Contract
    decimals: number
  }
}

/**
 * @notice Oracle deployment configuration
 */
export type OraclesConfig = {
  [loanToken: string]: {
    [collateralToken: string]: {
      factory: typeof ContractFactory
      contractName: string
      initialPrice: BigNumber
    }
  }
}

/**
 * @notice Oracle deployment result
 */
export type OraclesDeployment = {
  [loanToken: string]: {
    [collateralToken: string]: {
      contract: Contract
    }
  }
}

/**
 * @notice Supply configuration for setting up the markets
 */
export type MarketSupplyConfig = {
  [loanToken: string]: BigNumber
}

/**
 * @notice Morpho markets configuration
 */
export type MorphoMarket = {
  label: string
  loanToken: string
  collateralToken: string
  lltv: string
}

export type MorphoMarketsConfig = {
  markets: MorphoMarket[]
}

/**
 * @notice Morpho created markets info
 */
export type MorphoMarketInfo = MorphoMarket & {
  id: string
  solidityParams: MarketParamsStruct
}

/**
 * @notice Morpho deployment configuration
 */
export type MorphoSystem = {
  marketsInfo: MorphoMarketInfo[]
  tokensDeployment: TokensDeployment
  oraclesDeployment: OraclesDeployment
  morpho: Morpho
  irm: IrmMock
}

/**
 * @notice Morpho test deployment info
 */
export type MorphoTestDeployment = {
  system: MorphoSystem
  supplyConfig: MarketSupplyConfig
}
