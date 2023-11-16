import { DeployedSystem } from '@deploy-configurations/types/deployed-system'
import { Network } from '@deploy-configurations/types/network'
import { RuntimeConfig } from '@dma-common/types/common'
import { testBlockNumber } from '@dma-contracts/test/config'
import { restoreSnapshot, TestDeploymentSystem, TestHelpers } from '@dma-contracts/utils'
import { getEvents } from '@dma-contracts/utils/deploy-test-system'
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
import { expect } from 'chai'
import { Signer } from 'ethers'
import hre from 'hardhat'

import { deployMorphoBlueSystem } from './utils'
import { expectMarketStatus, expectPosition } from './utils/morpho.direct.utils'
import {
  opMorphoBlueBorrow,
  opMorphoBlueDeposit,
  opMorphoBlueDepositBorrow,
  opMorphoBlueOpenDepositBorrow,
  opMorphoBluePaybackWithdraw,
} from './utils/morpho.operations.borrow.utils'

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

  it('should be able to deposit', async () => {
    for (const market of morphoSystem.marketsInfo) {
      const { success, collateralBalanceBefore, collateralBalanceAfter, collateralAmount } =
        await opMorphoBlueDeposit(testSystem, market, user)

      expect(success).to.be.true

      expect(collateralAmount).to.be.gt(0)
      expect(collateralBalanceBefore).to.be.gte(collateralAmount)
      expect(collateralBalanceAfter).to.be.equal(collateralBalanceBefore.sub(collateralAmount))

      // Check the position
      await expectPosition(morphoSystem, market, userDPMProxy.address, collateralAmount, 0, 0)

      // Check the market
      const marketStatus = await morphoSystem.morpho.market(market.id)
      const totalSupplyAssets = supplyConfig[market.loanToken]

      await expectMarketStatus(
        morphoSystem,
        market,
        totalSupplyAssets,
        marketStatus.totalSupplyShares,
        0,
        0,
        0,
      )
    }
  })

  it('should be able to borrow', async () => {
    for (const market of morphoSystem.marketsInfo) {
      // First supply enough collateral
      const { success: successDeposit, collateralAmount } = await opMorphoBlueDeposit(
        testSystem,
        market,
        user,
      )
      expect(successDeposit).to.be.true

      const {
        success: successBorrow,
        loanTokenBalanceBefore,
        loanTokenBalanceAfter,
        borrowAmount,
        borrowShares,
      } = await opMorphoBlueBorrow(testSystem, market, user)

      expect(successBorrow).to.be.true
      expect(borrowAmount).to.be.gt(0)
      expect(loanTokenBalanceAfter).to.be.equal(loanTokenBalanceBefore.add(borrowAmount))

      // Check the position
      await expectPosition(
        morphoSystem,
        market,
        userDPMProxy.address,
        collateralAmount,
        0,
        borrowShares,
      )

      // Check the market
      const marketStatus = await morphoSystem.morpho.market(market.id)
      const totalSupplyAssets = supplyConfig[market.loanToken]

      await expectMarketStatus(
        morphoSystem,
        market,
        totalSupplyAssets,
        marketStatus.totalSupplyShares,
        borrowAmount,
        borrowShares,
        0,
      )
    }
  })

  it('should be able to deposit + borrow (single op)', async () => {
    for (const market of morphoSystem.marketsInfo) {
      const {
        success,
        collateralBalanceBefore,
        collateralBalanceAfter,
        collateralAmount,
        loanTokenBalanceBefore,
        loanTokenBalanceAfter,
        borrowAmount,
        borrowShares,
      } = await opMorphoBlueDepositBorrow(testSystem, market, user)

      expect(success).to.be.true
      expect(borrowAmount).to.be.gt(0)

      expect(collateralAmount).to.be.gt(0)
      expect(collateralBalanceBefore).to.be.gte(collateralAmount)
      expect(collateralBalanceAfter).to.be.equal(collateralBalanceBefore.sub(collateralAmount))

      expect(loanTokenBalanceAfter).to.be.equal(loanTokenBalanceBefore.add(borrowAmount))

      const marketStatus = await morphoSystem.morpho.market(market.id)
      const totalSupplyAssets = supplyConfig[market.loanToken]

      await expectMarketStatus(
        morphoSystem,
        market,
        totalSupplyAssets,
        marketStatus.totalSupplyShares,
        borrowAmount,
        borrowShares,
        0,
      )

      await expectPosition(
        morphoSystem,
        market,
        userDPMProxy.address,
        collateralAmount,
        0,
        borrowShares,
      )
    }
  })

  it('should be able to open + deposit + borrow (single op)', async () => {
    for (const market of morphoSystem.marketsInfo) {
      const positionType = 'Borrow'
      const {
        success,
        receipt,
        collateralBalanceBefore,
        collateralBalanceAfter,
        collateralAmount,
        loanTokenBalanceBefore,
        loanTokenBalanceAfter,
        borrowAmount,
        borrowShares,
      } = await opMorphoBlueOpenDepositBorrow(testSystem, market, user, positionType)

      expect(success).to.be.true

      const [createPositionEvent] = getEvents(
        hre,
        receipt,
        system.PositionCreated.contract.interface.getEvent('CreatePosition'),
      )

      const collateralToken = morphoSystem.tokensDeployment[market.collateralToken].contract
      const loanToken = morphoSystem.tokensDeployment[market.loanToken].contract

      expect(createPositionEvent.args.proxyAddress).to.be.equal(userDPMProxy.address)
      expect(createPositionEvent.args.protocol).to.be.equal('MorphoBlue')
      expect(createPositionEvent.args.positionType).to.be.equal(positionType)
      expect(createPositionEvent.args.collateralToken).to.be.equal(collateralToken.address)
      expect(createPositionEvent.args.debtToken).to.be.equal(loanToken.address)

      expect(borrowAmount).to.be.gt(0)

      expect(collateralAmount).to.be.gt(0)
      expect(collateralBalanceBefore).to.be.gte(collateralAmount)
      expect(collateralBalanceAfter).to.be.equal(collateralBalanceBefore.sub(collateralAmount))

      expect(loanTokenBalanceAfter).to.be.equal(loanTokenBalanceBefore.add(borrowAmount))

      const marketStatus = await morphoSystem.morpho.market(market.id)
      const totalSupplyAssets = supplyConfig[market.loanToken]

      await expectMarketStatus(
        morphoSystem,
        market,
        totalSupplyAssets,
        marketStatus.totalSupplyShares,
        borrowAmount,
        borrowShares,
        0,
      )

      await expectPosition(
        morphoSystem,
        market,
        userDPMProxy.address,
        collateralAmount,
        0,
        borrowShares,
      )
    }
  })

  it('should be able to payback + withdraw (with loan token)', async () => {
    for (const market of morphoSystem.marketsInfo) {
      const {
        success: successDepositBorrow,
        collateralAmount,
        borrowAmount,
      } = await opMorphoBlueDepositBorrow(testSystem, market, user)

      expect(successDepositBorrow).to.be.true

      const {
        success: successPaybackWithdraw,
        collateralBalanceBefore,
        collateralBalanceAfter,
        loanTokenBalanceBefore,
        loanTokenBalanceAfter,
      } = await opMorphoBluePaybackWithdraw(
        testSystem,
        market,
        user,
        borrowAmount,
        collateralAmount,
      )

      expect(successPaybackWithdraw).to.be.true

      expect(collateralBalanceAfter).to.be.equal(collateralBalanceBefore.add(collateralAmount))
      expect(loanTokenBalanceAfter).to.be.equal(loanTokenBalanceBefore.sub(borrowAmount))
    }
  })
})
