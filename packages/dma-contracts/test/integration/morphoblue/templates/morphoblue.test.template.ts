import { DeployedSystem } from '@deploy-configurations/types/deployed-system'
import { Network } from '@deploy-configurations/types/network'
import { RuntimeConfig } from '@dma-common/types/common'
import { testBlockNumber } from '@dma-contracts/test/config'
import { restoreSnapshot, TestDeploymentSystem, TestHelpers } from '@dma-contracts/utils'
import { Contract } from '@ethersproject/contracts'
import { JsonRpcProvider } from '@ethersproject/providers'
import {
  MarketSupplyConfig,
  MorphoMarketsConfig,
  MorphoSystem,
  OraclesConfig,
  OraclesDeployment,
} from '@morpho-blue'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { AccountImplementation } from '@typechain'
import { Signer } from 'ethers'
import hre from 'hardhat'

import { deployMorphoBlueSystem } from '../utils'

describe.skip('TEST GROUP | MorphoBlue | TEST CATEGORY', async () => {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  let provider: JsonRpcProvider
  let owner: Signer
  let ownerAddress: string
  let user: SignerWithAddress
  let config: RuntimeConfig
  let system: DeployedSystem
  let helpers: TestHelpers

  let WETH: Contract
  let DAI: Contract
  let USDT: Contract
  let WBTC: Contract
  let USDC: Contract
  let WSTETH: Contract

  let testSystem: TestDeploymentSystem
  let marketsConfig: MorphoMarketsConfig
  let oraclesConfig: OraclesConfig
  let oraclesDeployment: OraclesDeployment
  let morphoSystem: MorphoSystem
  let supplyConfig: MarketSupplyConfig
  let userDPMProxy: AccountImplementation
  let network: Network
  /* eslint-enable @typescript-eslint/no-unused-vars */

  beforeEach(async () => {
    const { snapshot } = await restoreSnapshot(
      {
        hre,
        blockNumber: testBlockNumber,
      },
      [deployMorphoBlueSystem],
    )

    provider = snapshot.config.provider
    owner = snapshot.config.signer
    ownerAddress = snapshot.config.address
    config = snapshot.config
    testSystem = snapshot.testSystem
    system = snapshot.testSystem.deployment.system
    helpers = snapshot.testSystem.helpers
    marketsConfig = snapshot.testSystem.extraDeployment.marketsConfig
    oraclesConfig = snapshot.testSystem.extraDeployment.oraclesConfig
    oraclesDeployment = snapshot.testSystem.extraDeployment.oraclesDeployment
    morphoSystem = snapshot.testSystem.extraDeployment.system
    supplyConfig = snapshot.testSystem.extraDeployment.supplyConfig
    userDPMProxy = snapshot.testSystem.helpers.userDPMProxy
    network = hre.network.name as Network

    WETH = helpers.fakeWETH.connect(owner)
    DAI = helpers.fakeDAI.connect(owner)
    USDT = helpers.fakeUSDT.connect(owner)
    WBTC = helpers.fakeWBTC.connect(owner)
    USDC = helpers.fakeUSDC.connect(owner)
    WSTETH = helpers.fakeWSTETH.connect(owner)

    user = helpers.user

    await WETH.connect(user).deposit({ value: hre.ethers.utils.parseUnits('1000000') })
    await DAI.mint(user.address, hre.ethers.utils.parseUnits('100000000'))
    await USDT.mint(user.address, hre.ethers.utils.parseUnits('100000000', 6))
    await WBTC.mint(user.address, hre.ethers.utils.parseUnits('100000000', 8))
    await USDC.mint(user.address, hre.ethers.utils.parseUnits('100000000', 6))
    await WSTETH.mint(user.address, hre.ethers.utils.parseUnits('100000000'))

    // Make user the default signer
    morphoSystem.morpho = morphoSystem.morpho.connect(user)

    // Disable the interest rate model by default
    await morphoSystem.irm.setForcedRate(0)
    await morphoSystem.irm.setForcedRateEnabled(true)
  })

  it('test title in lowercase', async () => {
    // YOUR TEST HERE
    //
    // Also remove the .skip from the describe.skip above
  })
})
