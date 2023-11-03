import { DeployedSystem } from '@deploy-configurations/types/deployed-system'
import { RuntimeConfig } from '@dma-common/types/common'
import { testBlockNumber } from '@dma-contracts/test/config'
import { restoreSnapshot, TestHelpers } from '@dma-contracts/utils'
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

  let marketsConfig: MorphoMarketsConfig
  let oraclesConfig: OraclesConfig
  let oraclesDeployment: OraclesDeployment
  let morphoBlue: MorphoSystem
  let supplyConfig: MarketSupplyConfig
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
    owner = snapshot.config.signer
    ownerAddress = snapshot.config.address
    config = snapshot.config
    system = snapshot.testSystem.deployment.system
    helpers = snapshot.testSystem.helpers
    marketsConfig = snapshot.extraDeployment.marketsConfig
    oraclesConfig = snapshot.extraDeployment.oraclesConfig
    oraclesDeployment = snapshot.extraDeployment.oraclesDeployment
    morphoBlue = snapshot.extraDeployment.system
    supplyConfig = snapshot.extraDeployment.supplyConfig

    WETH = helpers.fakeWETH.connect(owner)
    DAI = helpers.fakeDAI.connect(owner)
    USDT = helpers.fakeUSDT.connect(owner)
    WBTC = helpers.fakeWBTC.connect(owner)
    USDC = helpers.fakeUSDC.connect(owner)
    WSTETH = helpers.fakeWSTETH.connect(owner)

    user = (await hre.ethers.getSigners())[1]

    await WETH.connect(user).deposit({ value: hre.ethers.utils.parseUnits('1000000') })
    await DAI.mint(user.address, hre.ethers.utils.parseUnits('100000000'))
    await USDT.mint(user.address, hre.ethers.utils.parseUnits('100000000', 6))
    await WBTC.mint(user.address, hre.ethers.utils.parseUnits('100000000', 8))
    await USDC.mint(user.address, hre.ethers.utils.parseUnits('100000000', 6))
    await WSTETH.mint(user.address, hre.ethers.utils.parseUnits('100000000'))
  })

  it('test title in lowercase', async () => {
    // YOUR TEST HERE
    //
    // Also remove the .skip from the describe.skip above
  })
})
