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
import { expect } from 'chai'
import { Signer } from 'ethers'
import hre from 'hardhat'

import { deployMorphoBlueSystem } from './utils'
import {
  borrowMaxLoanToken,
  expectMarketStatus,
  expectPosition,
  repayWithLoanToken,
  repayWithShares,
  supplyMaxCollateral,
} from './utils/morpho.direct.utils'

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
      [deployMorphoBlueSystem],
    )

    if (!snapshot.testSystem.extraDeployment) {
      throw new Error('Missing extra deployment for MorphoBlue')
    }
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
      const { collateralBalanceBefore, collateralBalanceAfter, maxCollateral } =
        await supplyMaxCollateral(morphoBlue, market, user)

      expect(collateralBalanceBefore).to.be.gte(maxCollateral)
      expect(collateralBalanceAfter).to.be.equal(collateralBalanceBefore.sub(maxCollateral))
      await expectPosition(morphoBlue, market, user.address, maxCollateral, 0, 0)

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
        0,
      )
    }
  })

  it('should be able to borrow loan token', async () => {
    for (const market of morphoBlue.marketsInfo) {
      const { maxCollateral } = await supplyMaxCollateral(morphoBlue, market, user)

      const { loanTokenBalanceBefore, loanTokenBalanceAfter, borrowAmount, borrowShares } =
        await borrowMaxLoanToken(morphoBlue, market, user)

      await expectPosition(morphoBlue, market, user.address, maxCollateral, 0, borrowShares)

      // Check the balance of the user
      expect(loanTokenBalanceAfter).to.be.equal(loanTokenBalanceBefore.add(borrowAmount))
    }
  })

  it('should be able to repay with loan token (interest rate = 0%)', async () => {
    for (const market of morphoBlue.marketsInfo) {
      const { maxCollateral } = await supplyMaxCollateral(morphoBlue, market, user)
      const { borrowAmount } = await borrowMaxLoanToken(morphoBlue, market, user)

      const { loanTokenBalanceBefore, loanTokenBalanceAfter } = await repayWithLoanToken(
        morphoBlue,
        market,
        user,
        borrowAmount,
      )
      expect(loanTokenBalanceBefore).to.be.gte(borrowAmount)
      expect(loanTokenBalanceAfter).to.be.equal(loanTokenBalanceBefore.sub(borrowAmount))

      await expectPosition(morphoBlue, market, user.address, maxCollateral, 0, 0)
    }
  })

  it('should be able to repay with shares (interest rate = 0%)', async () => {
    for (const market of morphoBlue.marketsInfo) {
      const { maxCollateral } = await supplyMaxCollateral(morphoBlue, market, user)
      const { borrowAmount } = await borrowMaxLoanToken(morphoBlue, market, user)

      const { loanTokenBalanceBefore, loanTokenBalanceAfter, repayAssetsAmount } =
        await repayWithShares(morphoBlue, market, user)

      expect(repayAssetsAmount).to.be.equal(borrowAmount)
      expect(loanTokenBalanceBefore).to.be.gte(borrowAmount)
      expect(loanTokenBalanceAfter).to.be.equal(loanTokenBalanceBefore.sub(borrowAmount))
      await expectPosition(morphoBlue, market, user.address, maxCollateral, 0, 0)
    }
  })

  it('should be able to repay with shares (interest rate = 2%)', async () => {
    await morphoBlue.irm.setForcedRate(hre.ethers.utils.parseUnits('0.02'))
    await morphoBlue.irm.setForcedRateEnabled(true)

    for (const market of morphoBlue.marketsInfo) {
      const { maxCollateral } = await supplyMaxCollateral(morphoBlue, market, user)
      const { borrowAmount } = await borrowMaxLoanToken(morphoBlue, market, user)

      // Add 10 seconds safety margin to the elapsed time
      const now = (await hre.ethers.provider.getBlock('latest')).timestamp
      const expectedExecutionTimestampWithMargin = now + 10

      const { loanTokenBalanceBefore, loanTokenBalanceAfter, repayAssetsAmount } =
        await repayWithShares(morphoBlue, market, user, expectedExecutionTimestampWithMargin)

      expect(repayAssetsAmount).to.be.gte(borrowAmount)
      expect(loanTokenBalanceBefore).to.be.gte(borrowAmount)
      expect(loanTokenBalanceAfter).to.be.gte(loanTokenBalanceBefore.sub(repayAssetsAmount))
      await expectPosition(morphoBlue, market, user.address, maxCollateral, 0, 0)
    }
  })
})
