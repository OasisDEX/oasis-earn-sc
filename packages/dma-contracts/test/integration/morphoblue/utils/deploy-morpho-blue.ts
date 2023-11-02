import { showConsoleLogs } from '@dma-common/test-utils/console'
import { Snapshot } from '@dma-contracts/utils'
import {
  deployMorphoBlue,
  deployOracles,
  getMorphoDefaultMarketsConfig,
  getMorphoDefaultOraclesConfig,
  MarketSupplyConfig,
  MorphoTestDeployment,
  setupMarkets,
  TokensDeployment,
} from '@morpho-blue'
import { ethers } from 'ethers'

export async function deployMorphoBlueSystem(
  snapshot: Snapshot,
  debug = false,
): Promise<MorphoTestDeployment> {
  const helpers = snapshot.testSystem.helpers
  const signer = snapshot.config.signer
  const signerAddress = snapshot.config.address

  // Deploy Morpho Blue
  const tokensDeployment: TokensDeployment = {
    DAI: {
      contract: helpers.fakeDAI.connect(signer),
      decimals: 18,
    },
    USDT: {
      contract: helpers.fakeUSDT.connect(signer),
      decimals: 6,
    },
    WBTC: {
      contract: helpers.fakeWBTC.connect(signer),
      decimals: 8,
    },
    WETH: {
      contract: helpers.fakeWETH.connect(signer),
      decimals: 18,
    },
    USDC: {
      contract: helpers.fakeUSDC.connect(signer),
      decimals: 6,
    },
    WSTETH: {
      contract: helpers.fakeWSTETH.connect(signer),
      decimals: 18,
    },
  }

  const marketsConfig = getMorphoDefaultMarketsConfig()
  const oraclesConfig = getMorphoDefaultOraclesConfig()

  showConsoleLogs(debug)

  const oraclesDeployment = await deployOracles(oraclesConfig, marketsConfig, signer)

  const morphoBlueSystem = await deployMorphoBlue(
    marketsConfig,
    tokensDeployment,
    oraclesDeployment,
    signer,
    signerAddress,
  )

  const supplyConfig: MarketSupplyConfig = {
    DAI: ethers.utils.parseUnits('1000000'),
    USDT: ethers.utils.parseUnits('1000000', 6),
    WBTC: ethers.utils.parseUnits('1000', 8),
    WETH: ethers.utils.parseUnits('1000'),
    USDC: ethers.utils.parseUnits('1000000', 6),
    WSTETH: ethers.utils.parseUnits('1000'),
  }

  await setupMarkets(morphoBlueSystem, supplyConfig, signer, signerAddress)

  showConsoleLogs(true)

  return {
    system: morphoBlueSystem,
    supplyConfig: supplyConfig,
  }
}
