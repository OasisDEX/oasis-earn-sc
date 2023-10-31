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
 * @notice Morpho markets configuration
 */
export type MorphoMarketsConfig = {
  markets: [
    {
      label: string
      loanToken: string
      collateralToken: string
      lltv: string
    },
  ]
}
