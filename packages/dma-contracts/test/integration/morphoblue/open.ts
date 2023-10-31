import { DeployedSystem } from '@deploy-configurations/types/deployed-system'
import { showConsoleLogs } from '@dma-common/test-utils/console'
import { RuntimeConfig } from '@dma-common/types/common'
import { testBlockNumber } from '@dma-contracts/test/config'
import { restoreSnapshot, Snapshot, TestHelpers } from '@dma-contracts/utils'
import { Contract } from '@ethersproject/contracts'
import { JsonRpcProvider } from '@ethersproject/providers'
import {
  deployMorphoBlue,
  deployOracles,
  getMorphoDefaultMarketsConfig,
  getMorphoDefaultOraclesConfig,
  MorphoMarketsConfig,
  OraclesConfig,
  OraclesDeployment,
  TokensDeployment,
} from '@morpho-blue'
import { Morpho } from '@morpho-blue/typechain'
import { Signer } from 'ethers'
import hre from 'hardhat'

async function deployMorphoBlueSystem(snapshot: Snapshot): Promise<{
  marketsConfig: MorphoMarketsConfig
  oraclesConfig: OraclesConfig
  oraclesDeployment: OraclesDeployment
  morphoBlue: Morpho
}> {
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

  showConsoleLogs(false)
  const oraclesDeployment = await deployOracles(oraclesConfig, marketsConfig, signer)

  const morphoBlue = await deployMorphoBlue(
    marketsConfig,
    tokensDeployment,
    oraclesDeployment,
    signer,
    signerAddress,
  )
  showConsoleLogs(true)

  return {
    marketsConfig,
    oraclesConfig,
    oraclesDeployment,
    morphoBlue,
  }
}
describe('Open | MorphoBlue | INTEGRATION', async () => {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  let provider: JsonRpcProvider
  let signer: Signer
  let signerAddress: string
  let config: RuntimeConfig
  let system: DeployedSystem
  let helpers: TestHelpers

  let WETH: Contract
  let DAI: Contract
  let USDT: Contract
  let WBTC: Contract
  let USDC: Contract
  let WSTETH: Contract

  let marketsConfig: MorphoMarketsConfig
  let oraclesConfig: OraclesConfig
  let oraclesDeployment: OraclesDeployment
  let morphoBlue: Morpho
  /* eslint-enable @typescript-eslint/no-unused-vars */

  beforeEach(async () => {
    const { snapshot } = await restoreSnapshot(
      {
        hre,
        blockNumber: testBlockNumber,
      },
      deployMorphoBlueSystem,
    )

    provider = snapshot.config.provider
    signer = snapshot.config.signer
    signerAddress = snapshot.config.address
    config = snapshot.config
    system = snapshot.testSystem.deployment.system
    helpers = snapshot.testSystem.helpers
    marketsConfig = snapshot.extraDeployment.marketsConfig
    oraclesConfig = snapshot.extraDeployment.oraclesConfig
    oraclesDeployment = snapshot.extraDeployment.oraclesDeployment
    morphoBlue = snapshot.extraDeployment.morphoBlue

    WETH = helpers.fakeWETH.connect(signer)
    DAI = helpers.fakeDAI.connect(signer)
    USDT = helpers.fakeUSDT.connect(signer)
    WBTC = helpers.fakeWBTC.connect(signer)
    USDC = helpers.fakeUSDC.connect(signer)
    WSTETH = helpers.fakeWSTETH.connect(signer)
  })

  afterEach(async () => {
    await restoreSnapshot({ hre, blockNumber: testBlockNumber })
  })

  it('should open a position', async () => {
    console.log(`Morpho blue deployed: ${morphoBlue.address}`)
  })
})
