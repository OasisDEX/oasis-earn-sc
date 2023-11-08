import { loadContractNames } from '@deploy-configurations/constants'
import { Network } from '@deploy-configurations/types/network'
import { DeploymentSystem } from '@dma-contracts/scripts/deployment/deploy'
import { TestHelpers } from '@dma-contracts/utils'
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
import { HardhatRuntimeEnvironment } from 'hardhat/types'

export async function deployMorphoBlueSystem(
  hre: HardhatRuntimeEnvironment,
  ds: DeploymentSystem,
  helpers: TestHelpers,
  extraDeployment: any, // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<MorphoTestDeployment> {
  const provider = hre.ethers.provider
  const signer = provider.getSigner()
  const signerAddress = await signer.getAddress()

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

  // Add MorphoBlue to the service registry
  const SERVICE_REGISTRY_NAMES = loadContractNames(Network.TEST)

  // Override MorphoBlue address in the deployment system config
  ds.addConfigOverrides({
    morphoblue: {
      MorphoBlue: {
        name: 'MorphoBlue',
        address: morphoBlueSystem.morpho.address,
        serviceRegistryName: SERVICE_REGISTRY_NAMES.morphoblue.MORPHO_BLUE,
      },
    },
  })

  return {
    system: morphoBlueSystem,
    supplyConfig: supplyConfig,
  }
}
