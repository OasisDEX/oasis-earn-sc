import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { BigNumber, Signer } from "ethers";
import hre, { ethers } from "hardhat";

import { bn } from "../scripts/common";
import {
  deployApa,
  deployGuard,
  deployLibraries,
  deployPool,
  deployPoolFactory,
  deployRewardsContracts,
  deployTokens,
} from "../scripts/common/deployment.utils";
import { HardhatUtils } from "../scripts/common/hardhat.utils";
import { createDPMProxy } from "../scripts/prepare-env";
import { AjnaProxyActions, DSToken, ERC20Pool, IAccountImplementation, PoolInfoUtils } from "../typechain-types";
import { ERC20 } from "../typechain-types/@openzeppelin/contracts/token/ERC20/";
import { WETH as WETHContract } from "../typechain-types/contracts";

const utils = new HardhatUtils(hre);
const addresses: { [key: string]: string } = {};

describe("AjnaProxyActions", function () {
  async function deploy() {
    await hre.network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: process.env.ALCHEMY_NODE_GOERLI!,
            blockNumber: 8351852,
          },
        },
      ],
    });
    const [deployer, lender, borrower, bidder] = await hre.ethers.getSigners();

    const { usdc, wbtc, ajna, weth } = await deployTokens(deployer.address);

    const { poolCommons, auctionsInstance, actionsInstance, borrowerActionsInstance, positionNFTSVGInstance } =
      await deployLibraries();

    const { dmpGuardContract, guardDeployerSigner, dmpFactory } = await deployGuard();

    const { erc20PoolFactory, erc721PoolFactory } = await deployPoolFactory(
      poolCommons,
      auctionsInstance,
      actionsInstance,
      borrowerActionsInstance,
      ajna.address
    );
    const [poolContract, poolContractWeth] = await Promise.all([
      deployPool(erc20PoolFactory, wbtc.address, usdc.address),
      deployPool(erc20PoolFactory, weth.address, usdc.address),
    ]);
    const { rewardsManagerContract, positionManagerContract } = await deployRewardsContracts(
      positionNFTSVGInstance,
      erc20PoolFactory,
      erc721PoolFactory,
      ajna
    );
    const { ajnaProxyActionsContract, poolInfoContract, ajnaRewardsClaimerContract } = await deployApa(
      poolCommons,
      rewardsManagerContract,
      positionManagerContract,
      dmpGuardContract,
      guardDeployerSigner,
      weth,
      ajna
    );

    await dmpGuardContract.connect(guardDeployerSigner).setWhitelist(ajnaProxyActionsContract.address, true);
    await dmpGuardContract.connect(guardDeployerSigner).setWhitelist(rewardsManagerContract.address, true);
    await dmpGuardContract.connect(guardDeployerSigner).setWhitelistSend(rewardsManagerContract.address, true);
    const borrowerProxy = await createDPMProxy(dmpFactory, borrower);
    const lenderProxy = await createDPMProxy(dmpFactory, lender);
    const lenderProxy2 = await createDPMProxy(dmpFactory, lender);

    addresses.deployerAddress = await deployer.getAddress();
    addresses.lenderAddress = await lender.getAddress();
    addresses.borrowerAddress = await borrower.getAddress();
    addresses.bidderAddress = await bidder.getAddress();
    addresses.rewardsManager = rewardsManagerContract.address;
    addresses.positionManager = positionManagerContract.address;
    addresses.poolInfoAddress = poolInfoContract.address;

    for (const address in addresses) {
      [usdc, wbtc, ajna, weth].map(async token => {
        await utils.sendLotsOfMoney(addresses[address], token);
      });
    }
    addresses.lenderProxyAddress = lenderProxy.address;
    addresses.lenderProxyAddress2 = lenderProxy2.address;
    addresses.borrowerProxyAddress = borrowerProxy.address;
    addresses.poolAddress = poolContract.address;
    addresses.poolAddressWeth = poolContractWeth.address;
    addresses.weth = weth.address;
    addresses.ajnaProxyActionsContract = ajnaProxyActionsContract.address;
    console.table(addresses);
    await provideLiquidity(usdc, poolContract, poolContractWeth, lender);
    return {
      deployer,
      lender,
      borrower,
      borrowerProxy,
      lenderProxy,
      lenderProxy2,
      poolContract,
      usdc,
      wbtc,
      ajnaProxyActionsContract,
      poolInfoContract,
      bidder,
      rewardsManagerContract,
      positionManagerContract,
      ajna,
      poolContractWeth,
      weth,
      dmpGuardContract,
      ajnaRewardsClaimerContract,
    };
  }

  describe("DPM - borrower - AjnaProxyActions - WETH", function () {
    it("should depositCollateral", async () => {
      const { weth, borrowerProxy, poolContract, ajnaProxyActionsContract, borrower, poolContractWeth } =
        await loadFixture(deploy);
      const balancesCollateralBefore = {
        borrower: await hre.ethers.provider.getBalance(borrower.address),
        pool: await hre.ethers.provider.getBalance(poolContract.address),
      };

      const gas = await depositCollateral(
        ajnaProxyActionsContract,
        poolContractWeth,
        borrower,
        borrowerProxy,
        bn.eighteen.ONE,
        ethers.utils.parseUnits("11821.273", 18),
        weth,
        true
      );

      const balancesCollateralAfter = {
        borrower: await hre.ethers.provider.getBalance(borrower.address),
        pool: await hre.ethers.provider.getBalance(poolContractWeth.address),
      };
      console.table(balancesCollateralBefore);
      console.table(balancesCollateralAfter);
      expect(balancesCollateralAfter.borrower).to.be.equal(
        balancesCollateralBefore.borrower.sub(bn.eighteen.ONE).sub(gas)
      );
    });
    it("should depositCollateral and withdrawCollateral", async () => {
      const { weth, borrowerProxy, poolContractWeth, ajnaProxyActionsContract, borrower } = await loadFixture(deploy);
      const balancesCollateralBefore = {
        borrower: await hre.ethers.provider.getBalance(borrower.address),
        pool: await hre.ethers.provider.getBalance(poolContractWeth.address),
      };
      const price = bn.eighteen.TEST_PRICE_3;
      const gas = await depositCollateral(
        ajnaProxyActionsContract,
        poolContractWeth,
        borrower,
        borrowerProxy,
        bn.eighteen.ONE,
        price,
        weth,
        true
      );

      const gas2 = await withdrawCollateral(
        ajnaProxyActionsContract,
        poolContractWeth,
        weth,
        borrower,
        borrowerProxy,
        bn.eighteen.ONE
      );

      const balancesCollateralAfter = {
        borrower: await hre.ethers.provider.getBalance(borrower.address),
        pool: await hre.ethers.provider.getBalance(poolContractWeth.address),
      };

      expect(balancesCollateralAfter.borrower).to.be.equal(balancesCollateralBefore.borrower.sub(gas).sub(gas2));
    });
    it("should openAndDraw", async () => {
      const { weth, borrowerProxy, poolContractWeth, ajnaProxyActionsContract, borrower, usdc } = await loadFixture(
        deploy
      );
      const balancesQuoteBefore = {
        borrower: await usdc.balanceOf(borrower.address),
        pool: await usdc.balanceOf(poolContractWeth.address),
      };
      const balancesCollateralBefore = {
        borrower: await hre.ethers.provider.getBalance(borrower.address),
        pool: await hre.ethers.provider.getBalance(poolContractWeth.address),
      };
      const price = bn.eighteen.TEST_PRICE_3;

      const gas = await depositAndDrawDebt(
        ajnaProxyActionsContract,
        poolContractWeth,
        price,
        weth,
        borrower,
        borrowerProxy,
        bn.six.HUNDRED,
        bn.eighteen.TEN,
        true
      );

      const balancesQuoteAfter = {
        borrower: await usdc.balanceOf(borrower.address),
        pool: await usdc.balanceOf(poolContractWeth.address),
      };
      const balancesCollateralAfter = {
        borrower: await hre.ethers.provider.getBalance(borrower.address),
        pool: await hre.ethers.provider.getBalance(poolContractWeth.address),
      };

      expect(balancesQuoteAfter.borrower).to.be.eq(balancesQuoteBefore.borrower.add(bn.six.HUNDRED));
      expect(balancesCollateralAfter.borrower).to.be.equal(
        balancesCollateralBefore.borrower.sub(bn.eighteen.TEN).sub(gas)
      );
    });

    it("should openAndDraw and repayDebt", async () => {
      const { weth, borrowerProxy, poolContractWeth, ajnaProxyActionsContract, borrower, usdc, poolInfoContract } =
        await loadFixture(deploy);
      const balancesQuoteBefore = {
        borrower: await usdc.balanceOf(borrower.address),
        pool: await usdc.balanceOf(poolContractWeth.address),
      };
      const balancesCollateralBefore = {
        borrower: await hre.ethers.provider.getBalance(borrower.address),
        pool: await hre.ethers.provider.getBalance(poolContractWeth.address),
      };
      const price = bn.eighteen.TEST_PRICE_3;

      const gas = await depositAndDrawDebt(
        ajnaProxyActionsContract,
        poolContractWeth,
        price,
        weth,
        borrower,
        borrowerProxy,
        bn.six.HUNDRED,
        bn.eighteen.TEN,
        true
      );

      let borrowerInfo = await poolInfoContract.borrowerInfo(poolContractWeth.address, borrowerProxy.address);

      const gas2 = await repayDebt(
        ajnaProxyActionsContract,
        poolContractWeth,
        usdc,
        borrower,
        borrowerProxy,
        poolInfoContract
      );

      const balancesQuoteAfter = {
        borrower: await usdc.balanceOf(borrower.address),
        pool: await usdc.balanceOf(poolContractWeth.address),
      };
      const balancesCollateralAfter = {
        borrower: await hre.ethers.provider.getBalance(borrower.address),
        pool: await hre.ethers.provider.getBalance(poolContractWeth.address),
      };
      borrowerInfo = await poolInfoContract.borrowerInfo(poolContractWeth.address, borrower.address);

      expect(balancesQuoteAfter.borrower).to.be.lt(balancesQuoteBefore.borrower);
      expect(balancesCollateralAfter.borrower).to.be.equal(
        balancesCollateralBefore.borrower.sub(bn.eighteen.TEN).sub(gas).sub(gas2)
      );
      expect(borrowerInfo.debt_).to.be.eq(0);
    });

    it("should openAndDraw and repayAndClose", async () => {
      const { weth, borrowerProxy, poolContractWeth, ajnaProxyActionsContract, borrower, usdc } = await loadFixture(
        deploy
      );
      const balancesQuoteBefore = {
        borrower: await usdc.balanceOf(borrower.address),
        pool: await usdc.balanceOf(poolContractWeth.address),
      };
      const balancesCollateralBefore = {
        borrower: await hre.ethers.provider.getBalance(borrower.address),
        pool: await hre.ethers.provider.getBalance(poolContractWeth.address),
      };
      const price = bn.eighteen.TEST_PRICE_3;
      const gas = await depositAndDrawDebt(
        ajnaProxyActionsContract,
        poolContractWeth,
        price,
        weth,
        borrower,
        borrowerProxy,
        bn.six.THOUSAND,
        bn.eighteen.TEN,
        true
      );
      const balancesQuoteAfterDraw = {
        borrower: await usdc.balanceOf(borrower.address),
        pool: await usdc.balanceOf(poolContractWeth.address),
      };
      await hre.network.provider.send("evm_increaseTime", ["0x127501"]);

      const gas2 = await repayAndClose(ajnaProxyActionsContract, poolContractWeth, usdc, borrower, borrowerProxy);

      const balancesQuoteAfter = {
        borrower: await usdc.balanceOf(borrower.address),
        pool: await usdc.balanceOf(poolContractWeth.address),
      };
      const balancesCollateralAfter = {
        borrower: await hre.ethers.provider.getBalance(borrower.address),
        pool: await hre.ethers.provider.getBalance(poolContractWeth.address),
      };

      expect(balancesQuoteAfter.borrower).to.be.lt(balancesQuoteBefore.borrower);
      expect(balancesQuoteBefore.borrower).to.be.eq(balancesQuoteAfterDraw.borrower.sub(bn.six.THOUSAND));
      expect(balancesCollateralAfter.borrower).to.be.equal(balancesCollateralBefore.borrower.sub(gas).sub(gas2));
    });

    it("should drawDebt", async () => {
      const { weth, borrowerProxy, poolContractWeth, ajnaProxyActionsContract, borrower, usdc } = await loadFixture(
        deploy
      );
      const balancesQuoteBefore = {
        borrower: await usdc.balanceOf(borrower.address),
        pool: await usdc.balanceOf(poolContractWeth.address),
      };
      const balancesCollateralBefore = {
        borrower: await hre.ethers.provider.getBalance(borrower.address),
        pool: await hre.ethers.provider.getBalance(poolContractWeth.address),
      };

      const price = bn.eighteen.TEST_PRICE_3;
      const gas1 = await depositCollateral(
        ajnaProxyActionsContract,
        poolContractWeth,
        borrower,
        borrowerProxy,
        bn.eighteen.TEN,
        price,
        weth,
        true
      );
      const gas2 = await drawDebt(
        ajnaProxyActionsContract,
        poolContractWeth,
        borrowerProxy,
        borrower,
        bn.six.HUNDRED,
        price
      );

      const balancesQuoteAfter = {
        borrower: await usdc.balanceOf(borrower.address),
        pool: await usdc.balanceOf(poolContractWeth.address),
      };
      const balancesCollateralAfter = {
        borrower: await hre.ethers.provider.getBalance(borrower.address),
        pool: await hre.ethers.provider.getBalance(poolContractWeth.address),
      };
      expect(balancesCollateralAfter.borrower).to.be.eq(
        balancesCollateralBefore.borrower.sub(bn.eighteen.TEN).sub(gas1).sub(gas2)
      );
      expect(balancesQuoteAfter.borrower).to.be.eq(balancesQuoteBefore.borrower.add(bn.six.HUNDRED));
    });
  });
  describe("DPM - borrower - AjnaProxyActions", function () {
    it("should depositCollateral", async () => {
      const { wbtc, borrowerProxy, poolContract, ajnaProxyActionsContract, borrower } = await loadFixture(deploy);
      const balancesCollateralBefore = {
        borrower: await wbtc.balanceOf(borrower.address),
        pool: await wbtc.balanceOf(poolContract.address),
      };
      await depositCollateral(
        ajnaProxyActionsContract,
        poolContract,
        borrower,
        borrowerProxy,
        bn.eight.ONE,
        bn.eighteen.TEST_PRICE_3,
        wbtc
      );
      const balancesCollateralAfter = {
        borrower: await wbtc.balanceOf(borrower.address),
        pool: await wbtc.balanceOf(poolContract.address),
      };

      expect(balancesCollateralAfter.borrower).to.be.equal(balancesCollateralBefore.borrower.sub(bn.eight.ONE));
    });
    it("should depositCollateral and withdrawCollateral", async () => {
      const { wbtc, borrowerProxy, poolContract, ajnaProxyActionsContract, borrower } = await loadFixture(deploy);
      const balancesCollateralBefore = {
        borrower: await wbtc.balanceOf(borrower.address),
        pool: await wbtc.balanceOf(poolContract.address),
      };
      const price = bn.eighteen.TEST_PRICE_3;
      await depositCollateral(
        ajnaProxyActionsContract,
        poolContract,
        borrower,
        borrowerProxy,
        bn.eight.ONE,
        price,
        wbtc
      );

      await withdrawCollateral(ajnaProxyActionsContract, poolContract, wbtc, borrower, borrowerProxy, bn.eight.ONE);

      const balancesCollateralAfter = {
        borrower: await wbtc.balanceOf(borrower.address),
        pool: await wbtc.balanceOf(poolContract.address),
      };

      expect(balancesCollateralAfter.borrower).to.be.equal(balancesCollateralBefore.borrower);
    });
    it("should openAndDraw", async () => {
      const { wbtc, borrowerProxy, poolContract, ajnaProxyActionsContract, borrower, usdc } = await loadFixture(deploy);
      const balancesQuoteBefore = {
        borrower: await usdc.balanceOf(borrower.address),
        pool: await usdc.balanceOf(poolContract.address),
      };
      const balancesCollateralBefore = {
        borrower: await wbtc.balanceOf(borrower.address),
        pool: await wbtc.balanceOf(poolContract.address),
      };
      const price = bn.eighteen.TEST_PRICE_3;

      await depositAndDrawDebt(
        ajnaProxyActionsContract,
        poolContract,
        price,
        wbtc,
        borrower,
        borrowerProxy,
        bn.six.HUNDRED,
        bn.eight.TEN
      );

      const balancesQuoteAfter = {
        borrower: await usdc.balanceOf(borrower.address),
        pool: await usdc.balanceOf(poolContract.address),
      };
      const balancesCollateralAfter = {
        borrower: await wbtc.balanceOf(borrower.address),
        pool: await wbtc.balanceOf(poolContract.address),
      };

      expect(balancesQuoteAfter.borrower).to.be.eq(balancesQuoteBefore.borrower.add(bn.six.HUNDRED));
      expect(balancesCollateralAfter.borrower).to.be.equal(balancesCollateralBefore.borrower.sub(bn.eight.TEN));
    });

    it("should openAndDraw and repayDebt", async () => {
      const { wbtc, borrowerProxy, poolContract, ajnaProxyActionsContract, borrower, usdc, poolInfoContract } =
        await loadFixture(deploy);
      const balancesQuoteBefore = {
        borrower: await usdc.balanceOf(borrower.address),
        pool: await usdc.balanceOf(poolContract.address),
      };
      const balancesCollateralBefore = {
        borrower: await wbtc.balanceOf(borrower.address),
        pool: await wbtc.balanceOf(poolContract.address),
      };
      const price = bn.eighteen.TEST_PRICE_3;

      await depositAndDrawDebt(
        ajnaProxyActionsContract,
        poolContract,
        price,
        wbtc,
        borrower,
        borrowerProxy,
        bn.six.HUNDRED,
        bn.eight.TEN
      );

      let borrowerInfo = await poolInfoContract.borrowerInfo(poolContract.address, borrowerProxy.address);

      await repayDebt(ajnaProxyActionsContract, poolContract, usdc, borrower, borrowerProxy, poolInfoContract);

      const balancesQuoteAfter = {
        borrower: await usdc.balanceOf(borrower.address),
        pool: await usdc.balanceOf(poolContract.address),
      };
      const balancesCollateralAfter = {
        borrower: await wbtc.balanceOf(borrower.address),
        pool: await wbtc.balanceOf(poolContract.address),
      };
      borrowerInfo = await poolInfoContract.borrowerInfo(poolContract.address, borrower.address);

      expect(balancesQuoteAfter.borrower).to.be.lt(balancesQuoteBefore.borrower);
      expect(balancesCollateralAfter.borrower).to.be.equal(balancesCollateralBefore.borrower.sub(bn.eight.TEN));
      expect(borrowerInfo.debt_).to.be.eq(0);
    });

    it("should openAndDraw and repayAndClose", async () => {
      const { wbtc, borrowerProxy, poolContract, ajnaProxyActionsContract, borrower, usdc } = await loadFixture(deploy);
      const balancesQuoteBefore = {
        borrower: await usdc.balanceOf(borrower.address),
        pool: await usdc.balanceOf(poolContract.address),
      };
      const balancesCollateralBefore = {
        borrower: await wbtc.balanceOf(borrower.address),
        pool: await wbtc.balanceOf(poolContract.address),
      };
      const price = bn.eighteen.TEST_PRICE_3;
      await depositAndDrawDebt(
        ajnaProxyActionsContract,
        poolContract,
        price,
        wbtc,
        borrower,
        borrowerProxy,
        bn.six.THOUSAND,
        bn.eight.TEN
      );
      await depositAndDrawDebt(
        ajnaProxyActionsContract,
        poolContract,
        price,
        wbtc,
        borrower,
        borrowerProxy,
        bn.six.THOUSAND,
        bn.eight.TEN
      );
      const balancesQuoteAfterDraw = {
        borrower: await usdc.balanceOf(borrower.address),
        pool: await usdc.balanceOf(poolContract.address),
      };
      await hre.network.provider.send("evm_increaseTime", ["0x127501"]);

      await repayAndClose(ajnaProxyActionsContract, poolContract, usdc, borrower, borrowerProxy);

      const balancesQuoteAfter = {
        borrower: await usdc.balanceOf(borrower.address),
        pool: await usdc.balanceOf(poolContract.address),
      };
      const balancesCollateralAfter = {
        borrower: await wbtc.balanceOf(borrower.address),
        pool: await wbtc.balanceOf(poolContract.address),
      };

      expect(balancesQuoteAfter.borrower).to.be.lt(balancesQuoteBefore.borrower);
      expect(balancesQuoteBefore.borrower).to.be.eq(balancesQuoteAfterDraw.borrower.sub(bn.six.THOUSAND.mul(2)));
      expect(balancesCollateralAfter.borrower).to.be.equal(balancesCollateralBefore.borrower);
    });

    it("should drawDebt", async () => {
      const { wbtc, borrowerProxy, poolContract, ajnaProxyActionsContract, borrower, usdc } = await loadFixture(deploy);
      const balancesQuoteBefore = {
        borrower: await usdc.balanceOf(borrower.address),
        pool: await usdc.balanceOf(poolContract.address),
      };
      const balancesCollateralBefore = {
        borrower: await wbtc.balanceOf(borrower.address),
        pool: await wbtc.balanceOf(poolContract.address),
      };

      const price = bn.eighteen.TEST_PRICE_3;
      await depositCollateral(
        ajnaProxyActionsContract,
        poolContract,
        borrower,
        borrowerProxy,
        bn.eight.TEN,
        price,
        wbtc
      );

      await drawDebt(ajnaProxyActionsContract, poolContract, borrowerProxy, borrower, bn.six.HUNDRED, price);

      const balancesQuoteAfter = {
        borrower: await usdc.balanceOf(borrower.address),
        pool: await usdc.balanceOf(poolContract.address),
      };
      const balancesCollateralAfter = {
        borrower: await wbtc.balanceOf(borrower.address),
        pool: await wbtc.balanceOf(poolContract.address),
      };
      expect(balancesCollateralAfter.borrower).to.be.eq(balancesCollateralBefore.borrower.sub(bn.eight.TEN));
      expect(balancesQuoteAfter.borrower).to.be.eq(balancesQuoteBefore.borrower.add(bn.six.HUNDRED));
    });
  });
  describe("DPM - lender - AjnaProxyActions", function () {
    it("should supplyQuote", async () => {
      const { lenderProxy, poolContract, ajnaProxyActionsContract, lender, usdc, poolInfoContract } = await loadFixture(
        deploy
      );
      const balancesQuoteBefore = {
        lender: await usdc.balanceOf(lender.address),
        pool: await usdc.balanceOf(poolContract.address),
      };

      const price = bn.eighteen.TEST_PRICE_3;
      const index = await ajnaProxyActionsContract.convertPriceToIndex(price);
      await supplyQuote(ajnaProxyActionsContract, poolContract, usdc, lender, lenderProxy, bn.six.THOUSAND, price);

      const balancesQuoteAfter = {
        lender: await usdc.balanceOf(lender.address),
        pool: await usdc.balanceOf(poolContract.address),
      };
      const { lpBalance_ } = await poolContract.lenderInfo(index, lenderProxy.address);
      const depositedQuoteAmount = await poolInfoContract.lpsToQuoteTokens(poolContract.address, lpBalance_, index);
      expect(depositedQuoteAmount).to.be.equal(bn.eighteen.THOUSAND);
      expect(balancesQuoteAfter.lender).to.be.equal(balancesQuoteBefore.lender.sub(bn.six.THOUSAND));
    });
    it("should supplyQuote --> moveQuote", async () => {
      const { lenderProxy, poolContract, ajnaProxyActionsContract, lender, usdc, poolInfoContract } = await loadFixture(
        deploy
      );
      const balancesQuoteBefore = {
        lender: await usdc.balanceOf(lender.address),
        pool: await usdc.balanceOf(poolContract.address),
      };

      const price = bn.eighteen.TEST_PRICE_3;
      const index = await ajnaProxyActionsContract.convertPriceToIndex(price);
      await supplyQuote(
        ajnaProxyActionsContract,
        poolContract,
        usdc,
        lender,
        lenderProxy,
        bn.six.HUNDRED_THOUSAND,
        price
      );
      await moveQuote(
        ajnaProxyActionsContract,
        poolContract,
        usdc,
        lender,
        lenderProxy,
        price,
        price.add(bn.eighteen.THOUSAND)
      );

      const balancesQuoteAfter = {
        lender: await usdc.balanceOf(lender.address),
        pool: await usdc.balanceOf(poolContract.address),
      };
      const oldBalance = await poolContract.lenderInfo(index, lenderProxy.address);
      const depositedQuoteAmount = await poolInfoContract.lpsToQuoteTokens(
        poolContract.address,
        oldBalance.lpBalance_,
        index
      );
      expect(depositedQuoteAmount).to.be.equal(0);
      const newIndex = await ajnaProxyActionsContract.convertPriceToIndex(price.add(bn.eighteen.THOUSAND));
      const newBalance = await poolContract.lenderInfo(newIndex, lenderProxy.address);
      const newDepositedQuoteAmount = await poolInfoContract.lpsToQuoteTokens(
        poolContract.address,
        newBalance.lpBalance_,
        newIndex
      );
      expect(newDepositedQuoteAmount).to.be.equal(bn.eighteen.HUNDRED_THOUSAND);
      expect(balancesQuoteAfter.lender).to.be.equal(balancesQuoteBefore.lender.sub(bn.six.HUNDRED_THOUSAND));
    });
    it("should supplyAndMoveQuote", async () => {
      const { lenderProxy, poolContract, ajnaProxyActionsContract, lender, usdc, poolInfoContract } = await loadFixture(
        deploy
      );
      const balancesQuoteBefore = {
        lender: await usdc.balanceOf(lender.address),
        pool: await usdc.balanceOf(poolContract.address),
      };

      const price = bn.eighteen.TEST_PRICE_3;
      const index = await ajnaProxyActionsContract.convertPriceToIndex(price);
      await supplyQuote(
        ajnaProxyActionsContract,
        poolContract,
        usdc,
        lender,
        lenderProxy,
        bn.six.HUNDRED_THOUSAND,
        price
      );
      await supplyAndMoveQuote(
        ajnaProxyActionsContract,
        poolContract,
        usdc,
        lender,
        lenderProxy,
        bn.six.HUNDRED_THOUSAND,
        price,
        price.add(bn.eighteen.THOUSAND)
      );

      const balancesQuoteAfter = {
        lender: await usdc.balanceOf(lender.address),
        pool: await usdc.balanceOf(poolContract.address),
      };
      const oldBalance = await poolContract.lenderInfo(index, lenderProxy.address);
      const depositedQuoteAmount = await poolInfoContract.lpsToQuoteTokens(
        poolContract.address,
        oldBalance.lpBalance_,
        index
      );
      expect(depositedQuoteAmount).to.be.equal(0);
      const newIndex = await ajnaProxyActionsContract.convertPriceToIndex(price.add(bn.eighteen.THOUSAND));
      const newBalance = await poolContract.lenderInfo(newIndex, lenderProxy.address);
      const newDepositedQuoteAmount = await poolInfoContract.lpsToQuoteTokens(
        poolContract.address,
        newBalance.lpBalance_,
        newIndex
      );
      expect(newDepositedQuoteAmount).to.be.equal(bn.eighteen.HUNDRED_THOUSAND.mul(2));
      expect(balancesQuoteAfter.lender).to.be.equal(balancesQuoteBefore.lender.sub(bn.six.HUNDRED_THOUSAND.mul(2)));
    });
    it("should withdrawAndMoveQuote", async () => {
      const { lenderProxy, poolContract, ajnaProxyActionsContract, lender, usdc, poolInfoContract } = await loadFixture(
        deploy
      );
      const balancesQuoteBefore = {
        lender: await usdc.balanceOf(lender.address),
        pool: await usdc.balanceOf(poolContract.address),
      };

      const price = bn.eighteen.TEST_PRICE_3;
      const index = await ajnaProxyActionsContract.convertPriceToIndex(price);
      const lendAmount = bn.six.HUNDRED_THOUSAND;
      const withdrawAmount = bn.six.TEN_THOUSAND;
      await supplyQuote(ajnaProxyActionsContract, poolContract, usdc, lender, lenderProxy, lendAmount, price);
      await hre.network.provider.send("evm_increaseTime", ["0x127501"]);
      await withdrawAndMoveQuote(
        ajnaProxyActionsContract,
        poolContract,
        usdc,
        lender,
        lenderProxy,
        withdrawAmount,
        price,
        price.add(bn.eighteen.THOUSAND)
      );

      const balancesQuoteAfter = {
        lender: await usdc.balanceOf(lender.address),
        pool: await usdc.balanceOf(poolContract.address),
      };
      const oldBalance = await poolContract.lenderInfo(index, lenderProxy.address);
      const depositedQuoteAmount = await poolInfoContract.lpsToQuoteTokens(
        poolContract.address,
        oldBalance.lpBalance_,
        index
      );
      expect(depositedQuoteAmount).to.be.equal(0);
      const newIndex = await ajnaProxyActionsContract.convertPriceToIndex(price.add(bn.eighteen.THOUSAND));
      const newBalance = await poolContract.lenderInfo(newIndex, lenderProxy.address);
      const newDepositedQuoteAmount = await poolInfoContract.lpsToQuoteTokens(
        poolContract.address,
        newBalance.lpBalance_,
        newIndex
      );
      expect(newDepositedQuoteAmount).to.be.equal(bn.eighteen.TEN_THOUSAND.mul(9));
      expect(balancesQuoteAfter.lender).to.be.equal(balancesQuoteBefore.lender.sub(lendAmount).add(withdrawAmount));
    });
    it("should supplyQuote and withdrawQuote", async () => {
      const { lenderProxy, poolContract, ajnaProxyActionsContract, lender, usdc } = await loadFixture(deploy);
      const balancesQuoteBefore = {
        lender: await usdc.balanceOf(lender.address),
        pool: await usdc.balanceOf(poolContract.address),
      };

      const price = bn.eighteen.TEST_PRICE_3;
      const lendAmount = bn.six.THOUSAND;
      const withdrawAmount = bn.six.THOUSAND.mul(2);

      await supplyQuote(ajnaProxyActionsContract, poolContract, usdc, lender, lenderProxy, lendAmount, price);
      // increase the time of the next block
      await hre.network.provider.send("evm_increaseTime", ["0x127501"]);
      await withdrawQuote(ajnaProxyActionsContract, poolContract, usdc, lender, lenderProxy, withdrawAmount, price);

      const balancesQuoteAfter = {
        lender: await usdc.balanceOf(lender.address),
        pool: await usdc.balanceOf(poolContract.address),
      };
      // there are no borrowers hence the depoisit is not earning
      expect(balancesQuoteAfter.lender).to.be.equal(balancesQuoteBefore.lender);
    });
    it("should supplyQuote and withdrawQuote and accrue interest", async () => {
      const { wbtc, lenderProxy, poolContract, ajnaProxyActionsContract, lender, usdc, borrower, borrowerProxy } =
        await loadFixture(deploy);
      const balancesQuoteBefore = {
        lender: await usdc.balanceOf(lender.address),
        pool: await usdc.balanceOf(poolContract.address),
      };
      const lendAmount = bn.six.MILLION;
      const borrowAmount = bn.six.MILLION;
      const depositAmount = bn.eight.HUNDRED_THOUSAND;
      const price = bn.eighteen.TEST_PRICE_3;

      await supplyQuote(ajnaProxyActionsContract, poolContract, usdc, lender, lenderProxy, lendAmount, price);
      // increase the time of the next block
      await depositAndDrawDebt(
        ajnaProxyActionsContract,
        poolContract,
        price,
        wbtc,
        borrower,
        borrowerProxy,
        borrowAmount,
        depositAmount
      );
      await hre.network.provider.send("evm_increaseTime", ["0x127501"]);
      await repayAndClose(ajnaProxyActionsContract, poolContract, usdc, borrower, borrowerProxy);
      await withdrawQuote(
        ajnaProxyActionsContract,
        poolContract,
        usdc,
        lender,
        lenderProxy,
        lendAmount.mul(101).div(100),
        price
      );

      const balancesQuoteAfter = {
        lender: await usdc.balanceOf(lender.address),
        pool: await usdc.balanceOf(poolContract.address),
      };
      // expected that the lender will get more quote tokens due to interest
      expect(balancesQuoteAfter.lender).to.be.gt(balancesQuoteBefore.lender);
    });
  });
  describe("DPM - lender - AjnaProxyActions - NFT", function () {
    it("should claim multiple rewards from multiple proxies - same owner - called by the owner", async () => {
      const {
        wbtc,
        lenderProxy,
        lenderProxy2,
        poolContract,
        ajnaProxyActionsContract,
        lender,
        usdc,
        ajna,
        borrower,
        borrowerProxy,
        poolInfoContract,
        bidder,
        rewardsManagerContract,
        ajnaRewardsClaimerContract,
      } = await loadFixture(deploy);

      const price = bn.eighteen.TEST_PRICE_4;
      const lendAmount = bn.six.MILLION;
      const borrowAmount = bn.six.TEN_THOUSAND;

      await supplyQuote(ajnaProxyActionsContract, poolContract, usdc, lender, lenderProxy, bn.six.MILLION, price);
      await mintAndStakeNft(ajnaProxyActionsContract, poolContract, lenderProxy, lender, price);
      await supplyQuoteMintNftAndStake(
        ajnaProxyActionsContract,
        poolContract,
        lenderProxy2,
        lender,
        lendAmount,
        price,
        usdc
      );

      await depositAndDrawDebt(
        ajnaProxyActionsContract,
        poolContract,
        price,
        wbtc,
        borrower,
        borrowerProxy,
        borrowAmount,
        bn.eight.TEN
      );

      await depositAndDrawDebt(
        ajnaProxyActionsContract,
        poolContract,
        price,
        wbtc,
        borrower,
        borrowerProxy,
        borrowAmount,
        bn.eight.TEN
      );

      await hre.network.provider.send("evm_increaseTime", ["0x11C60"]);

      await repayDebt(ajnaProxyActionsContract, poolContract, usdc, borrower, borrowerProxy, poolInfoContract);

      await poolContract.connect(bidder).startClaimableReserveAuction();

      await hre.network.provider.send("evm_increaseTime", ["0x15180"]);

      await ajna.connect(bidder).approve(poolContract.address, ethers.constants.MaxUint256);
      await poolContract.connect(bidder).takeReserves(1);

      await rewardsManagerContract
        .connect(lender)
        .updateBucketExchangeRatesAndClaim(poolContract.address, [5541, 2000]);

      await hre.network.provider.send("evm_increaseTime", ["0x172800"]);
      const epoch = await poolContract.currentBurnEpoch();
      const rewardsToClaim = [
        await rewardsManagerContract.calculateRewards(1, epoch),
        await rewardsManagerContract.calculateRewards(2, epoch),
      ];
      const ajnaBalanceBefore = await ajna.balanceOf(lender.address);
      await ajnaRewardsClaimerContract.connect(lender).claimRewardsAndSendToOwner([1, 2]);
      expect((await ajna.balanceOf(lender.address)).sub(ajnaBalanceBefore)).to.be.equal(
        rewardsToClaim[0].add(rewardsToClaim[1])
      );
    });
    it("should NOT claim multiple rewards from multiple proxies - same owner - while called not by the owner", async () => {
      const {
        wbtc,
        lenderProxy,
        lenderProxy2,
        poolContract,
        ajnaProxyActionsContract,
        lender,
        usdc,
        ajna,
        borrower,
        borrowerProxy,
        poolInfoContract,
        bidder,
        rewardsManagerContract,
        ajnaRewardsClaimerContract,
      } = await loadFixture(deploy);

      const price = bn.eighteen.TEST_PRICE_4;
      const lendAmount = bn.six.MILLION;
      const borrowAmount = bn.six.TEN_THOUSAND;

      await supplyQuote(ajnaProxyActionsContract, poolContract, usdc, lender, lenderProxy, bn.six.MILLION, price);
      await mintAndStakeNft(ajnaProxyActionsContract, poolContract, lenderProxy, lender, price);
      await supplyQuoteMintNftAndStake(
        ajnaProxyActionsContract,
        poolContract,
        lenderProxy2,
        lender,
        lendAmount,
        price,
        usdc
      );

      await depositAndDrawDebt(
        ajnaProxyActionsContract,
        poolContract,
        price,
        wbtc,
        borrower,
        borrowerProxy,
        borrowAmount,
        bn.eight.TEN
      );

      await depositAndDrawDebt(
        ajnaProxyActionsContract,
        poolContract,
        price,
        wbtc,
        borrower,
        borrowerProxy,
        borrowAmount,
        bn.eight.TEN
      );

      await hre.network.provider.send("evm_increaseTime", ["0x11C60"]);

      await repayDebt(ajnaProxyActionsContract, poolContract, usdc, borrower, borrowerProxy, poolInfoContract);

      await poolContract.connect(bidder).startClaimableReserveAuction();

      await hre.network.provider.send("evm_increaseTime", ["0x15180"]);

      await ajna.connect(bidder).approve(poolContract.address, ethers.constants.MaxUint256);
      await poolContract.connect(bidder).takeReserves(1);

      await rewardsManagerContract
        .connect(lender)
        .updateBucketExchangeRatesAndClaim(poolContract.address, [5541, 2000]);

      await hre.network.provider.send("evm_increaseTime", ["0x172800"]);

      const tx = ajnaRewardsClaimerContract.connect(borrower).claimRewardsAndSendToOwner([1, 2]);
      await expect(tx).to.be.revertedWithCustomError(ajnaRewardsClaimerContract, "CallerNotProxyOwner");
    });
    it("should NOT claim multiple rewards from multiple proxies - different owners - while called by one of the owners", async () => {
      const {
        wbtc,
        lenderProxy,
        poolContract,
        ajnaProxyActionsContract,
        lender,
        usdc,
        ajna,
        borrower,
        borrowerProxy,
        poolInfoContract,
        bidder,
        rewardsManagerContract,
        ajnaRewardsClaimerContract,
      } = await loadFixture(deploy);

      const price = bn.eighteen.TEST_PRICE_4;
      const lendAmount = bn.six.MILLION;
      const borrowAmount = bn.six.TEN_THOUSAND;

      await supplyQuote(ajnaProxyActionsContract, poolContract, usdc, lender, lenderProxy, bn.six.MILLION, price);
      await mintAndStakeNft(ajnaProxyActionsContract, poolContract, lenderProxy, lender, price);
      await supplyQuoteMintNftAndStake(
        ajnaProxyActionsContract,
        poolContract,
        borrowerProxy,
        borrower,
        lendAmount,
        price,
        usdc
      );

      await depositAndDrawDebt(
        ajnaProxyActionsContract,
        poolContract,
        price,
        wbtc,
        borrower,
        borrowerProxy,
        borrowAmount,
        bn.eight.TEN
      );

      await depositAndDrawDebt(
        ajnaProxyActionsContract,
        poolContract,
        price,
        wbtc,
        borrower,
        borrowerProxy,
        borrowAmount,
        bn.eight.TEN
      );

      await hre.network.provider.send("evm_increaseTime", ["0x11C60"]);

      await repayDebt(ajnaProxyActionsContract, poolContract, usdc, borrower, borrowerProxy, poolInfoContract);

      await poolContract.connect(bidder).startClaimableReserveAuction();

      await hre.network.provider.send("evm_increaseTime", ["0x15180"]);

      await ajna.connect(bidder).approve(poolContract.address, ethers.constants.MaxUint256);
      await poolContract.connect(bidder).takeReserves(1);

      await rewardsManagerContract
        .connect(lender)
        .updateBucketExchangeRatesAndClaim(poolContract.address, [5541, 2000]);

      await hre.network.provider.send("evm_increaseTime", ["0x172800"]);

      const tx = ajnaRewardsClaimerContract.connect(borrower).claimRewardsAndSendToOwner([1, 2]);
      await expect(tx).to.be.revertedWithCustomError(ajnaRewardsClaimerContract, "CallerNotProxyOwner");
    });
    it("should supplyQuoteMintNftAndStake - open with NFT", async () => {
      const { lenderProxy, poolContract, ajnaProxyActionsContract, lender, usdc } = await loadFixture(deploy);

      const price = bn.eighteen.TEST_PRICE_1;
      const lendAmount = bn.six.MILLION;

      await supplyQuoteMintNftAndStake(
        ajnaProxyActionsContract,
        poolContract,
        lenderProxy,
        lender,
        lendAmount,
        price,
        usdc
      );
    });
    it("should supplyQuoteMintNftAndStake --> supplyAndMoveQuoteNft", async () => {
      const { lenderProxy, poolContract, ajnaProxyActionsContract, lender, usdc } = await loadFixture(deploy);

      const price = bn.eighteen.TEST_PRICE_1;
      const newPrice = bn.eighteen.TEST_PRICE_2;
      const lendAmount = bn.six.MILLION;

      await supplyQuoteMintNftAndStake(
        ajnaProxyActionsContract,
        poolContract,
        lenderProxy,
        lender,
        lendAmount,
        price,
        usdc
      );
      await usdc.connect(lender).approve(lenderProxy.address, lendAmount);
      await supplyAndMoveQuoteNft(
        ajnaProxyActionsContract,
        poolContract,
        usdc,
        lenderProxy,
        lender,
        lendAmount,
        price,
        newPrice,
        1
      );
    });
    it("should supplyQuoteMintNftAndStake --> withdrawAndMoveQuoteNft", async () => {
      const { lenderProxy, poolContract, ajnaProxyActionsContract, lender, usdc } = await loadFixture(deploy);

      const price = bn.eighteen.TEST_PRICE_1;
      const newPrice = bn.eighteen.TEST_PRICE_2;
      const lendAmount = bn.six.MILLION;

      await supplyQuoteMintNftAndStake(
        ajnaProxyActionsContract,
        poolContract,
        lenderProxy,
        lender,
        lendAmount,
        price,
        usdc
      );
      await usdc.connect(lender).approve(lenderProxy.address, lendAmount);
      await withdrawAndMoveQuoteNft(
        ajnaProxyActionsContract,
        poolContract,
        usdc,
        lenderProxy,
        lender,
        lendAmount.div(10),
        price,
        newPrice,
        1
      );
    });
    it("should supplyQuoteMintNftAndStake --> supplyQuoteNft", async () => {
      const { lenderProxy, poolContract, ajnaProxyActionsContract, lender, usdc } = await loadFixture(deploy);

      const price = bn.eighteen.TEST_PRICE_1;
      const lendAmount = bn.six.MILLION;

      await supplyQuoteMintNftAndStake(
        ajnaProxyActionsContract,
        poolContract,
        lenderProxy,
        lender,
        lendAmount,
        price,
        usdc
      );
      await usdc.connect(lender).approve(lenderProxy.address, lendAmount);
      await supplyQuoteNft(ajnaProxyActionsContract, poolContract, usdc, lender, lenderProxy, lendAmount, price, 1);
    });
    it("should supplyQuoteMintNftAndStake --> withdrawQuoteNft", async () => {
      const { lenderProxy, poolContract, ajnaProxyActionsContract, lender, usdc } = await loadFixture(deploy);

      const price = bn.eighteen.TEST_PRICE_1;
      const lendAmount = bn.six.MILLION;

      await supplyQuoteMintNftAndStake(
        ajnaProxyActionsContract,
        poolContract,
        lenderProxy,
        lender,
        lendAmount,
        price,
        usdc
      );
      await usdc.connect(lender).approve(lenderProxy.address, lendAmount);
      await withdrawQuoteNft(
        ajnaProxyActionsContract,
        poolContract,
        usdc,
        lender,
        lenderProxy,
        lendAmount.div(2),
        price,
        1
      );
    });
    it("should supplyQuoteMintNftAndStake --> moveQuoteNft ", async () => {
      const { lenderProxy, poolContract, ajnaProxyActionsContract, lender, usdc } = await loadFixture(deploy);

      const price = bn.eighteen.TEST_PRICE_1;
      const newPrice = bn.eighteen.TEST_PRICE_2;
      const lendAmount = bn.six.MILLION;

      await supplyQuoteMintNftAndStake(
        ajnaProxyActionsContract,
        poolContract,
        lenderProxy,
        lender,
        lendAmount,
        price,
        usdc
      );
      await usdc.connect(lender).approve(lenderProxy.address, lendAmount);
      await moveQuoteNft(ajnaProxyActionsContract, poolContract, lenderProxy, lender, price, newPrice, 1);
    });
    it("should supplyQuoteMintNftAndStake --> unstakeNftAndWithdrawQuote - close ", async () => {
      const { lenderProxy, poolContract, ajnaProxyActionsContract, lender, usdc } = await loadFixture(deploy);

      const price = bn.eighteen.TEST_PRICE_1;
      const lendAmount = bn.six.MILLION;

      await supplyQuoteMintNftAndStake(
        ajnaProxyActionsContract,
        poolContract,
        lenderProxy,
        lender,
        lendAmount,
        price,
        usdc
      );
      await usdc.connect(lender).approve(lenderProxy.address, lendAmount);
      await hre.network.provider.send("evm_increaseTime", ["0x127501"]);
      await unstakeNftAndWithdrawQuote(ajnaProxyActionsContract, poolContract, usdc, lender, lenderProxy, price, 1);
    });
  });
});

async function withdrawQuote(
  ajnaProxyActionsContract: AjnaProxyActions,
  poolContract: ERC20Pool,
  usdc: DSToken,
  lender: Signer,
  lenderProxy: IAccountImplementation,
  amountToWithdraw: BigNumber,
  price: BigNumber
) {
  const encodedWithdrawQuoteData = ajnaProxyActionsContract.interface.encodeFunctionData("withdrawQuote", [
    poolContract.address,
    amountToWithdraw,
    price,
  ]);
  await usdc.connect(lender).approve(lenderProxy.address, bn.eighteen.MILLION);
  const txWithdraw = await lenderProxy
    .connect(lender)
    .execute(ajnaProxyActionsContract.address, encodedWithdrawQuoteData, {
      gasLimit: 3000000,
    });
  const receipt = await txWithdraw.wait();
  console.log("withdrawQuote gasUsed", receipt.gasUsed.toString());
  return receipt.gasUsed.mul(receipt.effectiveGasPrice);
}

async function supplyQuote(
  ajnaProxyActionsContract: AjnaProxyActions,
  poolContract: ERC20Pool,
  usdc: DSToken,
  lender: Signer,
  lenderProxy: IAccountImplementation,
  amountToSupply: BigNumber,
  price: BigNumber
) {
  const encodedSupplyQuoteData = ajnaProxyActionsContract.interface.encodeFunctionData("supplyQuote", [
    poolContract.address,
    amountToSupply,
    price,
  ]);
  await usdc.connect(lender).approve(lenderProxy.address, bn.eighteen.MILLION);
  const tx = await lenderProxy.connect(lender).execute(ajnaProxyActionsContract.address, encodedSupplyQuoteData, {
    gasLimit: 3000000,
  });
  const receipt = await tx.wait();
  console.log("supplyQuote gasUsed", receipt.gasUsed.toString());
  return receipt.gasUsed.mul(receipt.effectiveGasPrice);
}
async function moveQuote(
  ajnaProxyActionsContract: AjnaProxyActions,
  poolContract: ERC20Pool,
  usdc: DSToken,
  lender: Signer,
  lenderProxy: IAccountImplementation,
  price: BigNumber,
  newPrice: BigNumber
) {
  const encodedWithdrawQuoteData = ajnaProxyActionsContract.interface.encodeFunctionData("moveQuote", [
    poolContract.address,
    price,
    newPrice,
  ]);
  await usdc.connect(lender).approve(lenderProxy.address, bn.eighteen.MILLION);
  const txWithdraw = await lenderProxy
    .connect(lender)
    .execute(ajnaProxyActionsContract.address, encodedWithdrawQuoteData, {
      gasLimit: 3000000,
    });
  const receipt = await txWithdraw.wait();
  console.log("moveQuote gasUsed", receipt.gasUsed.toString());
  return receipt.gasUsed.mul(receipt.effectiveGasPrice);
}
async function supplyAndMoveQuote(
  ajnaProxyActionsContract: AjnaProxyActions,
  poolContract: ERC20Pool,
  usdc: DSToken,
  lender: Signer,
  lenderProxy: IAccountImplementation,
  amountToMove: BigNumber,
  price: BigNumber,
  newPrice: BigNumber
) {
  const encodedWithdrawQuoteData = ajnaProxyActionsContract.interface.encodeFunctionData("supplyAndMoveQuote", [
    poolContract.address,
    amountToMove,
    price,
    newPrice,
  ]);
  await usdc.connect(lender).approve(lenderProxy.address, bn.eighteen.MILLION);
  const txWithdraw = await lenderProxy
    .connect(lender)
    .execute(ajnaProxyActionsContract.address, encodedWithdrawQuoteData, {
      gasLimit: 3000000,
    });
  const receipt = await txWithdraw.wait();
  console.log("supplyAndMoveQuote gasUsed", receipt.gasUsed.toString());
  return receipt.gasUsed.mul(receipt.effectiveGasPrice);
}
async function withdrawAndMoveQuote(
  ajnaProxyActionsContract: AjnaProxyActions,
  poolContract: ERC20Pool,
  usdc: DSToken,
  lender: Signer,
  lenderProxy: IAccountImplementation,
  amountToWithdraw: BigNumber,
  oldPrice: BigNumber,
  newPrice: BigNumber
) {
  const encodedWithdrawQuoteData = ajnaProxyActionsContract.interface.encodeFunctionData("withdrawAndMoveQuote", [
    poolContract.address,
    amountToWithdraw,
    oldPrice,
    newPrice,
  ]);
  await usdc.connect(lender).approve(lenderProxy.address, bn.eighteen.MILLION);
  const txWithdraw = await lenderProxy
    .connect(lender)
    .execute(ajnaProxyActionsContract.address, encodedWithdrawQuoteData, {
      gasLimit: 3000000,
    });
  const receipt = await txWithdraw.wait();
  console.log("gas used withdrawAndMoveQuote", receipt.gasUsed.toString());
  return receipt.gasUsed.mul(receipt.effectiveGasPrice);
}
async function supplyQuoteNft(
  ajnaProxyActionsContract: AjnaProxyActions,
  poolContract: ERC20Pool,
  usdc: DSToken,
  lender: Signer,
  lenderProxy: IAccountImplementation,
  amountToWithdraw: BigNumber,
  price: BigNumber,
  tokenId: number
) {
  const encodedWithdrawQuoteData = ajnaProxyActionsContract.interface.encodeFunctionData("supplyQuoteNft", [
    poolContract.address,
    amountToWithdraw,
    price,
    tokenId,
  ]);
  await usdc.connect(lender).approve(lenderProxy.address, bn.eighteen.MILLION);
  const txWithdraw = await lenderProxy
    .connect(lender)
    .execute(ajnaProxyActionsContract.address, encodedWithdrawQuoteData, {
      gasLimit: 3000000,
    });
  const receipt = await txWithdraw.wait();
  console.log("gas used supplyQuoteNft", receipt.gasUsed.toString());
  return receipt.gasUsed.mul(receipt.effectiveGasPrice);
}
async function withdrawQuoteNft(
  ajnaProxyActionsContract: AjnaProxyActions,
  poolContract: ERC20Pool,
  usdc: DSToken,
  lender: Signer,
  lenderProxy: IAccountImplementation,
  amountToWithdraw: BigNumber,
  price: BigNumber,
  tokenId: number
) {
  const encodedWithdrawQuoteData = ajnaProxyActionsContract.interface.encodeFunctionData("withdrawQuoteNft", [
    poolContract.address,
    amountToWithdraw,
    price,
    tokenId,
  ]);
  await usdc.connect(lender).approve(lenderProxy.address, bn.eighteen.MILLION);
  const txWithdraw = await lenderProxy
    .connect(lender)
    .execute(ajnaProxyActionsContract.address, encodedWithdrawQuoteData, {
      gasLimit: 3000000,
    });
  const receipt = await txWithdraw.wait();
  console.log("gas used withdrawQuoteNft", receipt.gasUsed.toString());
  return receipt.gasUsed.mul(receipt.effectiveGasPrice);
}
async function unstakeNftAndWithdrawQuote(
  ajnaProxyActionsContract: AjnaProxyActions,
  poolContract: ERC20Pool,
  usdc: DSToken,
  lender: Signer,
  lenderProxy: IAccountImplementation,
  price: BigNumber,
  tokenId: number
) {
  const encodedData = ajnaProxyActionsContract.interface.encodeFunctionData("unstakeNftAndWithdrawQuote", [
    poolContract.address,
    price,
    tokenId,
  ]);
  await usdc.connect(lender).approve(lenderProxy.address, bn.eighteen.MILLION);
  const txWithdraw = await lenderProxy.connect(lender).execute(ajnaProxyActionsContract.address, encodedData, {
    gasLimit: 3000000,
  });
  const receipt = await txWithdraw.wait();
  console.log("gas used unstakeNftAndWithdrawQuote", receipt.gasUsed.toString());
  return receipt.gasUsed.mul(receipt.effectiveGasPrice);
}
async function drawDebt(
  ajnaProxyActionsContract: AjnaProxyActions,
  poolContract: ERC20Pool,
  borrowerProxy: IAccountImplementation,
  borrower: Signer,
  amountToDraw: BigNumber,
  price: BigNumber
) {
  const encodedDrawDebtData = ajnaProxyActionsContract.interface.encodeFunctionData("drawDebt", [
    poolContract.address,
    amountToDraw,
    price,
  ]);

  const tx = await borrowerProxy.connect(borrower).execute(ajnaProxyActionsContract.address, encodedDrawDebtData, {
    gasLimit: 30000000,
  });

  const receipt = await tx.wait();

  return receipt.gasUsed.mul(receipt.effectiveGasPrice);
}

async function withdrawCollateral(
  ajnaProxyActionsContract: AjnaProxyActions,
  poolContract: ERC20Pool,
  wbtc: DSToken,
  borrower: Signer,
  borrowerProxy: IAccountImplementation,
  amountToWithdraw: BigNumber
) {
  const encodedWithdrawCollateralData = ajnaProxyActionsContract.interface.encodeFunctionData("withdrawCollateral", [
    poolContract.address,
    amountToWithdraw,
  ]);
  const approvalTx = await wbtc.connect(borrower).approve(borrowerProxy.address, bn.eighteen.MILLION);
  const receiptApproval = await approvalTx.wait();
  const withdrawCollateralTx = await borrowerProxy
    .connect(borrower)
    .execute(ajnaProxyActionsContract.address, encodedWithdrawCollateralData, {
      gasLimit: 3000000,
    });

  const receipt = await withdrawCollateralTx.wait();

  return receipt.gasUsed
    .mul(receipt.effectiveGasPrice)
    .add(receiptApproval.gasUsed.mul(receiptApproval.effectiveGasPrice));
}

async function depositCollateral(
  ajnaProxyActionsContract: AjnaProxyActions,
  poolContract: ERC20Pool,
  borrower: Signer,
  borrowerProxy: IAccountImplementation,
  amountToDeposit: BigNumber,
  price: BigNumber,
  collateralToken: DSToken | WETHContract,
  isWeth = false
) {
  const encodedAddCollateralData = ajnaProxyActionsContract.interface.encodeFunctionData("depositCollateral", [
    poolContract.address,
    amountToDeposit,
    price,
  ]);
  const approvalTx = await collateralToken.connect(borrower).approve(borrowerProxy.address, bn.eighteen.MILLION);
  const addCollateralTx = await borrowerProxy
    .connect(borrower)
    .execute(ajnaProxyActionsContract.address, encodedAddCollateralData, {
      gasLimit: 3000000,
      value: isWeth ? amountToDeposit : 0,
    });
  const approvalTxReceipt = await approvalTx.wait();
  const receipt = await addCollateralTx.wait();

  return receipt.gasUsed
    .mul(receipt.effectiveGasPrice)
    .add(approvalTxReceipt.gasUsed.mul(approvalTxReceipt.effectiveGasPrice));
}

async function repayAndClose(
  ajnaProxyActionsContract: AjnaProxyActions,
  poolContract: ERC20Pool,
  usdc: DSToken,
  borrower: Signer,
  borrowerProxy: IAccountImplementation
) {
  const encodedRepayData = ajnaProxyActionsContract.interface.encodeFunctionData("repayAndClose", [
    poolContract.address,
  ]);
  const approvalTx = await usdc.connect(borrower).approve(borrowerProxy.address, bn.eighteen.MILLION);
  const approvalTxReceipt = await approvalTx.wait();
  const repayTx = await borrowerProxy.connect(borrower).execute(ajnaProxyActionsContract.address, encodedRepayData, {
    gasLimit: 3000000,
  });

  const receipt = await repayTx.wait();

  return receipt.gasUsed
    .mul(receipt.effectiveGasPrice)
    .add(approvalTxReceipt.gasUsed.mul(approvalTxReceipt.effectiveGasPrice));
}

async function mintAndStakeNft(
  ajnaProxyActionsContract: AjnaProxyActions,
  poolContract: ERC20Pool,
  lenderProxy: IAccountImplementation,
  lender: Signer,
  price: BigNumber
) {
  const mintNftData = ajnaProxyActionsContract.interface.encodeFunctionData("mintAndStakeNft", [
    poolContract.address,
    price,
  ]);
  const mintNftTx = await lenderProxy.connect(lender).execute(ajnaProxyActionsContract.address, mintNftData, {
    gasLimit: 3000000,
  });
  const receipt = await mintNftTx.wait();
  return receipt.gasUsed.mul(receipt.effectiveGasPrice);
}

async function supplyQuoteMintNftAndStake(
  ajnaProxyActionsContract: AjnaProxyActions,
  poolContract: ERC20Pool,
  lenderProxy: IAccountImplementation,
  lender: Signer,
  amount: BigNumber,
  price: BigNumber,
  debt: DSToken
) {
  const mintNftData = ajnaProxyActionsContract.interface.encodeFunctionData("supplyQuoteMintNftAndStake", [
    poolContract.address,
    amount,
    price,
  ]);
  await debt.connect(lender).approve(lenderProxy.address, amount);
  const mintNftTx = await lenderProxy.connect(lender).execute(ajnaProxyActionsContract.address, mintNftData, {
    gasLimit: 3000000,
  });
  const receipt = await mintNftTx.wait();
  console.log("gas used supplyQuoteMintNftAndStake", receipt.gasUsed.toString());
  return receipt.gasUsed.mul(receipt.effectiveGasPrice);
}
async function moveQuoteNft(
  ajnaProxyActionsContract: AjnaProxyActions,
  poolContract: ERC20Pool,
  lenderProxy: IAccountImplementation,
  lender: Signer,
  oldPrice: BigNumber,
  newPrice: BigNumber,
  tokenId: number
) {
  const moveLiquidityData = ajnaProxyActionsContract.interface.encodeFunctionData("moveQuoteNft", [
    poolContract.address,
    oldPrice,
    newPrice,
    tokenId,
  ]);
  const moveLiquidityTx = await lenderProxy
    .connect(lender)
    .execute(ajnaProxyActionsContract.address, moveLiquidityData, {
      gasLimit: 3000000,
    });
  const receipt = await moveLiquidityTx.wait();
  console.log("gas used moveQuoteNft", receipt.gasUsed.toString());
  return receipt.gasUsed.mul(receipt.effectiveGasPrice);
}
async function supplyAndMoveQuoteNft(
  ajnaProxyActionsContract: AjnaProxyActions,
  poolContract: ERC20Pool,
  debt: ERC20 | DSToken,
  lenderProxy: IAccountImplementation,
  lender: Signer,
  amountToAdd: BigNumber,
  oldPrice: BigNumber,
  newPrice: BigNumber,
  tokenId: number
) {
  const mintNftData = ajnaProxyActionsContract.interface.encodeFunctionData("supplyAndMoveQuoteNft", [
    poolContract.address,
    amountToAdd,
    oldPrice,
    newPrice,
    tokenId,
  ]);
  await debt.connect(lender).approve(poolContract.address, bn.eighteen.MILLION);
  const mintNftTx = await lenderProxy.connect(lender).execute(ajnaProxyActionsContract.address, mintNftData, {
    gasLimit: 3000000,
  });
  const receipt = await mintNftTx.wait();
  console.log("gas used supplyAndMoveQuoteNft", receipt.gasUsed.toString());
  return receipt.gasUsed.mul(receipt.effectiveGasPrice);
}
async function withdrawAndMoveQuoteNft(
  ajnaProxyActionsContract: AjnaProxyActions,
  poolContract: ERC20Pool,
  debt: ERC20 | DSToken,
  lenderProxy: IAccountImplementation,
  lender: Signer,
  amountToWithdraw: BigNumber,
  oldPrice: BigNumber,
  newPrice: BigNumber,
  tokenId: number
) {
  const mintNftData = ajnaProxyActionsContract.interface.encodeFunctionData("withdrawAndMoveQuoteNft", [
    poolContract.address,
    amountToWithdraw,
    oldPrice,
    newPrice,
    tokenId,
  ]);
  await debt.connect(lender).approve(poolContract.address, bn.eighteen.MILLION);
  const mintNftTx = await lenderProxy.connect(lender).execute(ajnaProxyActionsContract.address, mintNftData, {
    gasLimit: 3000000,
  });
  const receipt = await mintNftTx.wait();
  console.log("gas used withdrawAndMoveQuoteNft", receipt.gasUsed.toString());
  return receipt.gasUsed.mul(receipt.effectiveGasPrice);
}
async function repayDebt(
  ajnaProxyActionsContract: AjnaProxyActions,
  poolContract: ERC20Pool,
  usdc: DSToken,
  borrower: Signer,
  borrowerProxy: IAccountImplementation,
  poolInfoContract: PoolInfoUtils,
  amountToRepay?: BigNumber
) {
  let encodedRepayData = "";
  if (amountToRepay) {
    encodedRepayData = ajnaProxyActionsContract.interface.encodeFunctionData("repayDebt", [
      poolContract.address,
      amountToRepay,
    ]);
  } else {
    const borrowerInfo = await poolInfoContract.borrowerInfo(poolContract.address, borrowerProxy.address);
    const quoteScale = await poolContract.quoteTokenScale();
    encodedRepayData = ajnaProxyActionsContract.interface.encodeFunctionData("repayDebt", [
      poolContract.address,
      borrowerInfo.debt_.mul(105).div(100).div(quoteScale),
    ]);
  }
  const approvalTx = await usdc.connect(borrower).approve(borrowerProxy.address, bn.eighteen.MILLION);
  const receiptApproval = await approvalTx.wait();
  const repayTx = await borrowerProxy.connect(borrower).execute(ajnaProxyActionsContract.address, encodedRepayData, {
    gasLimit: 3000000,
  });

  const receipt = await repayTx.wait();
  console.log("gas used repayDebt", receipt.gasUsed.toString());
  return receipt.gasUsed
    .mul(receipt.effectiveGasPrice)
    .add(receiptApproval.gasUsed.mul(receiptApproval.effectiveGasPrice));
}

async function depositAndDrawDebt(
  ajnaProxyActionsContract: AjnaProxyActions,
  poolContract: ERC20Pool,
  price: BigNumber,
  collateralToken: DSToken | WETHContract,
  borrower: Signer,
  borrowerProxy: IAccountImplementation,
  amountToDraw: BigNumber,
  amountToDeposit: BigNumber,
  isWeth = false
) {
  const encodedAOpenAndDrawData = ajnaProxyActionsContract.interface.encodeFunctionData("openPosition", [
    poolContract.address,
    amountToDraw,
    amountToDeposit,
    price,
  ]);
  if (!isWeth) {
    await collateralToken.connect(borrower).approve(borrowerProxy.address, bn.eighteen.MILLION);
  }
  const tx2 = await borrowerProxy.connect(borrower).execute(ajnaProxyActionsContract.address, encodedAOpenAndDrawData, {
    gasLimit: 3000000,
    value: isWeth ? amountToDeposit : 0,
  });

  const receipt = await tx2.wait();
  console.log("gas used depositAndDrawDebt", receipt.gasUsed.toString());
  return receipt.gasUsed.mul(receipt.effectiveGasPrice);
}

async function provideLiquidity(usdc: DSToken, poolContract: ERC20Pool, poolContractWeth: ERC20Pool, lender: Signer) {
  await usdc.connect(lender).approve(poolContract.address, bn.eighteen.MILLION);
  await usdc.connect(lender).approve(poolContractWeth.address, bn.eighteen.MILLION);
  const blockNumber = await ethers.provider.getBlockNumber();
  const timestamp = (await ethers.provider.getBlock(blockNumber)).timestamp;
  const tx = await poolContract.connect(lender).addQuoteToken(bn.eighteen.MILLION, 2000, timestamp + 100000);
  const tx2 = await poolContractWeth.connect(lender).addQuoteToken(bn.eighteen.MILLION, 2000, timestamp + 100000);
  await tx.wait();
  await tx2.wait();
}