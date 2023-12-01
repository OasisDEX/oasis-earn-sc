import { Network } from '@deploy-configurations/types/network'
import { WrapperOraclesConfig } from '@dma-contracts/../morpho-blue/scripts/types'
import { deployWrapperOracles } from '@dma-contracts/../morpho-blue/scripts/utils/deploy-utils'
import { DeploymentSystem } from '@dma-contracts/scripts/deployment/deploy'
import { deployMorphoBlueSystem } from '@dma-contracts/test/integration/morphoblue/utils'
import { getMorphoDefaultMarketsConfig, MorphoTestDeployment, TokensDeployment } from '@morpho-blue'
import { ERC20__factory } from '@typechain'
import hre from 'hardhat'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

export async function deployMorphoBlue(
  hre: HardhatRuntimeEnvironment,
  ds: DeploymentSystem,
  network: Network,
): Promise<MorphoTestDeployment> {
  const provider = hre.ethers.provider
  const signer = provider.getSigner()

  const oraclesDeploymentConfig: WrapperOraclesConfig = {
    DAI: {
      WBTC: {
        factory: ERC20__factory,
        contractName: 'ERC20',
        loanTokenAggregator: '0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9',
        collateralTokenAggregator: '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c',
      },
      USDC: {
        factory: ERC20__factory,
        contractName: 'ERC20',
        loanTokenAggregator: '0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9',
        collateralTokenAggregator: '0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6',
      },
    },
    USDC: {
      USDT: {
        factory: ERC20__factory,
        contractName: 'ERC20',
        loanTokenAggregator: '0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6',
        collateralTokenAggregator: '0x3E7d1eAB13ad0104d2750B8863b489D65364e32D',
      },
    },
    WSTETH: {
      WETH: {
        factory: ERC20__factory,
        contractName: 'ERC20',
        loanTokenAggregator: '0xCfE54B5cD566aB89272946F602D76Ea879CAb4a8',
        collateralTokenAggregator: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
      },
    },
  }

  const marketsConfig = getMorphoDefaultMarketsConfig()

  const oraclesDeployment = await deployWrapperOracles(
    oraclesDeploymentConfig,
    marketsConfig,
    signer,
  )

  const tokensDeployment: TokensDeployment = {
    DAI: {
      contract: ERC20__factory.connect('0x6B175474E89094C44Da98b954EedeAC495271d0F', signer),
      decimals: 18,
    },
    USDT: {
      contract: ERC20__factory.connect('0xdAC17F958D2ee523a2206206994597C13D831ec7', signer),
      decimals: 6,
    },
    WBTC: {
      contract: ERC20__factory.connect('0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', signer),
      decimals: 8,
    },
    WETH: {
      contract: ERC20__factory.connect('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', signer),
      decimals: 18,
    },
    USDC: {
      contract: ERC20__factory.connect('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', signer),
      decimals: 6,
    },
    WSTETH: {
      contract: ERC20__factory.connect('0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0', signer),
      decimals: 18,
    },
  }

  return deployMorphoBlueSystem(
    hre,
    ds,
    network,
    marketsConfig,
    oraclesDeployment,
    tokensDeployment,
  )
}

async function main() {
  const signer = hre.ethers.provider.getSigner(0)
  const network = hre.network.name as Network

  if (network !== Network.TENDERLY) {
    throw new Error('This script should only be run on Tenderly')
  }

  console.log(`Deployer address: ${await signer.getAddress()}`)
  console.log(`Network: ${network}`)

  const ds = new DeploymentSystem(hre)
  await ds.init()
  await ds.loadConfig('test.conf')
  await ds.deployCore()
  await ds.deployActions()
  await ds.saveConfig()

  await deployMorphoBlue(hre, ds, Network.TEST)

  console.log('\n=========== Adding all entries to system ===========\n')
  await ds.addAllEntries()
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => {
    // success message or other processing
    process.exitCode = 0
    process.exit()
  })
  .catch(error => {
    console.error(error)
    process.exitCode = 1
    process.exit()
  })
