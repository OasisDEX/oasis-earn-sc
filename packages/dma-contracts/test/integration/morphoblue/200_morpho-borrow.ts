import { DeployedSystem } from '@deploy-configurations/types/deployed-system'
import { Network } from '@deploy-configurations/types/network'
import { RuntimeConfig } from '@dma-common/types/common'
import { testBlockNumber } from '@dma-contracts/test/config'
import { restoreSnapshot, TestHelpers } from '@dma-contracts/utils'
import { deposit } from '@dma-library/operations/morphoblue/borrow/deposit'
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
import { expect } from 'chai'
import { Signer } from 'ethers'
import hre from 'hardhat'

import { deployMorphoBlueSystem } from './utils'
import {
  expectMarketStatus,
  expectPosition,
  getMaxSupplyCollateral,
} from './utils/morpho-test-utils'
import { toMorphoBlueDepositArgs, toMorphoBlueStrategyAddresses } from './utils/type-casts'

describe('Borrow Operations | MorphoBlue | Integration', async () => {
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
    system = snapshot.testSystem.deployment.system
    helpers = snapshot.testSystem.helpers
    marketsConfig = snapshot.testSystem.extraDeployment.marketsConfig
    oraclesConfig = snapshot.testSystem.extraDeployment.oraclesConfig
    oraclesDeployment = snapshot.testSystem.extraDeployment.oraclesDeployment
    morphoBlue = snapshot.testSystem.extraDeployment.system
    supplyConfig = snapshot.testSystem.extraDeployment.supplyConfig
    network = hre.network.name as Network

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

    // Make user the default signer
    morphoBlue.morpho = morphoBlue.morpho.connect(user)

    // Disable the interest rate model by default
    await morphoBlue.irm.setForcedRate(0)
    await morphoBlue.irm.setForcedRateEnabled(true)
  })

  it('should be able to deposit', async () => {
    for (const market of morphoBlue.marketsInfo) {
      const collateralToken = morphoBlue.tokensDeployment[market.collateralToken].contract

      const supplyAmount = await getMaxSupplyCollateral(morphoBlue, market)
      const depositArgs = toMorphoBlueDepositArgs(morphoBlue, market, supplyAmount, user)
      const addresses = toMorphoBlueStrategyAddresses(morphoBlue)

      const collateralBalanceBefore = await collateralToken.balanceOf(user.address)

      const depositCalls = await deposit(depositArgs, addresses, Network.MAINNET)

      await collateralToken
        .connect(user)
        .approve(system.OperationExecutor.contract.address, supplyAmount)
      await system.OperationExecutor.contract
        .connect(user)
        .executeOp(depositCalls.calls, depositCalls.operationName)

      const collateralBalanceAfter = await collateralToken.balanceOf(user.address)

      expect(collateralBalanceBefore).to.be.gte(supplyAmount)
      expect(collateralBalanceAfter).to.be.equal(collateralBalanceBefore.sub(supplyAmount))
      await expectPosition(
        morphoBlue,
        market,
        system.OperationExecutor.contract.address,
        supplyAmount,
        0,
        0,
      )

      // Check the market
      const marketStatus = await morphoBlue.morpho.market(market.id)
      const totalSupplyAssets = supplyConfig[market.loanToken]

      await expectMarketStatus(
        morphoBlue,
        market,
        totalSupplyAssets,
        marketStatus.totalSupplyShares,
        0,
        0,
        marketStatus.lastUpdate, // Last update timestamp is only updated on createMarket, supply and borrow
        0,
      )
    }
  })
})
