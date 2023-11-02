import { showConsoleLogs } from '@dma-common/test-utils/console'
import { Snapshot } from '@dma-contracts/utils'
import {
  deployMorphoBlue,
  deployOracles,
  getMorphoDefaultMarketsConfig,
  getMorphoDefaultOraclesConfig,
  MarketSupplyConfig,
  MorphoSystem,
  setupMarkets,
  TokensDeployment,
} from '@morpho-blue'
import { ethers } from 'ethers'

export async function deployMorphoBlueSystem(
  snapshot: Snapshot,
  debug = false,
): Promise<MorphoSystem> {
  const helpers = snapshot.testSystem.helpers
  const signer = snapshot.config.signer
  const signerAddress = snapshot.config.address

  // Deploy Morpho Blue
  const tokensDeployment: TokensDeployment = {
    DAI: {
      contract: helpers.fakeDAI.connect(signer),
    },
    USDT: {
      contract: helpers.fakeUSDT.connect(signer),
    },
    WBTC: {
      contract: helpers.fakeWBTC.connect(signer),
    },
    WETH: {
      contract: helpers.fakeWETH.connect(signer),
    },
    USDC: {
      contract: helpers.fakeUSDC.connect(signer),
    },
    WSTETH: {
      contract: helpers.fakeWSTETH.connect(signer),
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
    DAI: ethers.utils.parseEther('1000000'),
    USDT: ethers.utils.parseEther('1000000'),
    WBTC: ethers.utils.parseEther('1000'),
    WETH: ethers.utils.parseEther('1000'),
    USDC: ethers.utils.parseEther('1000000'),
    WSTETH: ethers.utils.parseEther('1000'),
  }
  await setupMarkets(morphoBlueSystem, supplyConfig, signer, signerAddress)

  showConsoleLogs(true)

  return morphoBlueSystem
}
