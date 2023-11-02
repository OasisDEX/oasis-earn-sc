import { DeployedSystem } from '@deploy-configurations/types/deployed-system'
import { RuntimeConfig } from '@dma-common/types/common'
import { testBlockNumber } from '@dma-contracts/test/config'
import { restoreSnapshot, TestHelpers } from '@dma-contracts/utils'
//import { borrow } from '@dma-library/operations/morphoblue/borrow/borrow'
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

import { deployMorphoBlueSystem, getMaxSupplyCollateral } from './utils'
import { calculateShares, getMaxBorrowableAmount } from './utils/morpho-utils'

describe('Basics | MorphoBlue | Integration', async () => {
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

  afterEach(async () => {
    await restoreSnapshot({ hre, blockNumber: testBlockNumber })
  })

  it('should have market liquidity', async () => {
    for (const market of morphoBlue.marketsInfo) {
      const marketStatus = await morphoBlue.morpho.market(market.id)
      const totalSupplyAssets = supplyConfig[market.loanToken]

      expect(marketStatus.totalSupplyAssets).to.be.eq(totalSupplyAssets)
      expect(marketStatus.totalSupplyShares).to.be.gt(0)
      expect(marketStatus.lastUpdate).to.be.gt(0)
    }
  })
  it('should be able to supply collateral', async () => {
    for (const market of morphoBlue.marketsInfo) {
      const marketStatus = await morphoBlue.morpho.market(market.id)
      const maxCollateral = await getMaxSupplyCollateral(morphoBlue, market, marketStatus)
      const collateralToken = morphoBlue.tokensDeployment[market.collateralToken].contract

      const collateralBalanceBefore = await collateralToken.balanceOf(user.address)
      expect(collateralBalanceBefore).to.be.gte(maxCollateral)

      await collateralToken.connect(user).approve(morphoBlue.morpho.address, maxCollateral)
      await morphoBlue.morpho
        .connect(user)
        .supplyCollateral(market.solidityParams, maxCollateral, user.address, [])

      // Check the position
      const position = await morphoBlue.morpho.position(market.id, user.address)
      expect(position.collateral).to.be.equal(maxCollateral)
      expect(position.supplyShares).to.be.equal(0)
      expect(position.borrowShares).to.be.equal(0)

      // Check the market
      const marketStatusAfterSupply = await morphoBlue.morpho.market(market.id)
      const totalSupplyAssets = supplyConfig[market.loanToken]

      expect(marketStatusAfterSupply.totalSupplyAssets).to.be.equal(totalSupplyAssets)
      expect(marketStatusAfterSupply.totalSupplyShares).to.be.equal(marketStatus.totalSupplyShares)
      expect(marketStatusAfterSupply.totalBorrowAssets).to.be.equal(0)
      expect(marketStatusAfterSupply.totalBorrowShares).to.be.equal(0)

      // Last update timestamp is only updated on createMarket, supply and borrow
      expect(marketStatusAfterSupply.lastUpdate).to.be.equal(marketStatus.lastUpdate)
    }
  })
  it('should be able to borrow loan token', async () => {
    for (const market of morphoBlue.marketsInfo) {
      const marketStatus = await morphoBlue.morpho.market(market.id)
      const maxCollateral = await getMaxSupplyCollateral(morphoBlue, market, marketStatus)
      const collateralToken = morphoBlue.tokensDeployment[market.collateralToken].contract
      const loanToken = morphoBlue.tokensDeployment[market.loanToken].contract

      const loanTokenBalanceBefore = await loanToken.balanceOf(user.address)
      const collateralBalanceBefore = await collateralToken.balanceOf(user.address)
      expect(collateralBalanceBefore).to.be.gte(maxCollateral)

      await collateralToken.connect(user).approve(morphoBlue.morpho.address, maxCollateral)

      await morphoBlue.morpho
        .connect(user)
        .supplyCollateral(market.solidityParams, maxCollateral, user.address, [])

      const positionBefore = await morphoBlue.morpho.position(market.id, user.address)
      const borrowAmount = await getMaxBorrowableAmount(morphoBlue, market, positionBefore)

      await morphoBlue.morpho
        .connect(user)
        .borrow(market.solidityParams, borrowAmount, 0, user.address, user.address)

      // Check the position
      const positionAfter = await morphoBlue.morpho.position(market.id, user.address)
      const borrowShares = calculateShares(marketStatus, borrowAmount)

      expect(positionAfter.collateral).to.be.equal(maxCollateral)
      expect(positionAfter.supplyShares).to.be.equal(0)
      expect(positionAfter.borrowShares).to.be.equal(borrowShares)

      // Check the balance of the user
      const loanTokenBalanceAfter = await loanToken.balanceOf(user.address)
      expect(loanTokenBalanceAfter).to.be.equal(loanTokenBalanceBefore.add(borrowAmount))
    }
  })
})
