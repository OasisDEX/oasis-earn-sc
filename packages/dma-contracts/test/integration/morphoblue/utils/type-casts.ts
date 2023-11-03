import {
  MorphoBlueStrategyAddresses,
  TokenAddresses,
} from '@dma-library/operations/morphoblue/addresses'
import { MorphoBlueDepositArgs } from '@dma-library/operations/morphoblue/borrow/deposit'
import { MorphoBlueMarket } from '@dma-library/types'
import { MorphoMarketInfo, MorphoSystem, TokensDeployment } from '@morpho-blue'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { default as BN } from 'bignumber.js'
import { BigNumberish } from 'ethers'

export function toMorphoBlueMarket(
  morphoSystem: MorphoSystem,
  market: MorphoMarketInfo,
): MorphoBlueMarket {
  return {
    loanToken: morphoSystem.tokensDeployment[market.loanToken].contract.address,
    collateralToken: morphoSystem.tokensDeployment[market.collateralToken].contract.address,
    oracle:
      morphoSystem.oraclesDeployment[market.loanToken][market.collateralToken].contract.address,
    irm: morphoSystem.irm.address,
    lltv: new BN(market.solidityParams.lltv.toString()),
  }
}

export function toMorphoBlueDepositArgs(
  morphoSystem: MorphoSystem,
  market: MorphoMarketInfo,
  supplyAmount: BigNumberish,
  user: SignerWithAddress,
): MorphoBlueDepositArgs {
  // TODO: Add support for swap args
  const depositArgs: MorphoBlueDepositArgs = {
    morphoBlueMarket: toMorphoBlueMarket(morphoSystem, market),
    userFundsTokenAddress: morphoSystem.tokensDeployment[market.collateralToken].contract.address,
    userFundsTokenAmount: new BN(supplyAmount.toString()),
    depositorAddress: user.address,
  }
  return depositArgs
}

export function toTokenAddresses(tokensDeployment: TokensDeployment): TokenAddresses {
  const tokenAddresses = Object.entries(tokensDeployment).reduce(
    (acc, [tokenName, tokenInfo]) => ({ ...acc, [tokenName]: tokenInfo.contract.address }),
    {},
  ) as TokenAddresses

  tokenAddresses.ETH = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'

  return tokenAddresses
}

export function toMorphoBlueStrategyAddresses(
  morphoSystem: MorphoSystem,
): MorphoBlueStrategyAddresses {
  return {
    morphoblue: morphoSystem.morpho.address,
    tokens: toTokenAddresses(morphoSystem.tokensDeployment),
  }
}
