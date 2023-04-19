import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatUtils } from "../scripts/common/hardhat.utils";
import { BigNumber, Signer } from "ethers";
import {
  Auctions,
  BorrowerActions,
  DSToken,
  IAccountFactory,
  IAccountImplementation,
  LenderActions,
  PoolCommons,
  ERC20Pool,
  ERC20PoolFactory,
  ERC721PoolFactory,
  PositionNFTSVG,
  RewardsManager,
  PositionManager,
  AjnaProxyActions,
  PoolInfoUtils,
  AjnaToken,
  AccountGuard,
  IServiceRegistry,
} from "../typechain-types";
import { WETH } from "../typechain-types/contracts";
import { ERC20 } from "../typechain-types/ext_lib/openzeppelin-contracts/contracts/token/ERC20";

let AJNA = "0x347fcea8b4fd1a46e2c0db8f79e22d293c2f8513";
let WETH = "";
const USDC = "0x6Fb5ef893d44F4f88026430d82d4ef269543cB23";
const WBTC = "0x7ccF0411c7932B99FC3704d68575250F032e3bB7";

const allowance = ethers.utils.parseEther("10000000000000");
const utils = new HardhatUtils(hre);
let hash = "";
let addresses: { [key: string]: string } = {};

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

    const { usdc, wbtc, ajna, weth } = await deployTokens();
    const { poolCommons, auctionsInstance, actionsInstance, borrowerActionsInstance, positionNFTSVGInstance } =
      await deployLibraries();

    const { dmpGuard, guardDeployer, dmpFactory } = await deployGuard();

    const { poolContract, poolContractWeth, erc20PoolFactory, erc721PoolFactory } = await deployPool(
      poolCommons,
      auctionsInstance,
      actionsInstance,
      borrowerActionsInstance
    );
    const { rewardsManagerContract, positionManagerContract } = await deployRewardsContracts(
      positionNFTSVGInstance,
      erc20PoolFactory,
      erc721PoolFactory,
      ajna
    );
    const { serviceRegistryContract } = await deployServiceRegistry();
    const hash = await serviceRegistryContract.getServiceNameHash("DPM_GUARD");
    await serviceRegistryContract.addNamedService(hash, dmpGuard.address);
    const { apa, poolInfoContract, arc } = await deployApa(
      poolCommons,
      rewardsManagerContract,
      positionManagerContract,
      ajna,
      weth,
      dmpGuard,
      serviceRegistryContract
    );

    await dmpGuard.connect(guardDeployer).setWhitelist(apa.address, true);
    await dmpGuard.connect(guardDeployer).setWhitelist(rewardsManagerContract.address, true);
    await dmpGuard.connect(guardDeployer).setWhitelistSend(rewardsManagerContract.address, true);
    const borrowerProxy = await createBorrowerProxy(dmpFactory, borrower);
    const lenderProxy = await createLenderProxy(dmpFactory, lender);
    const lenderProxy2 = await createLenderProxy(dmpFactory, lender);

    addresses.deployerAddress = await deployer.getAddress();
    addresses.lenderAddress = await lender.getAddress();
    addresses.borrowerAddress = await borrower.getAddress();
    addresses.bidderAddress = await bidder.getAddress();
    addresses.rewardsManager = rewardsManagerContract.address;
    addresses.positionManager = positionManagerContract.address;
    addresses.poolInfoAddress = poolInfoContract.address;

    for (const address in addresses) {
      await sendLotsOfMoney(addresses[address]);
    }
    addresses.lenderProxyAddress = lenderProxy.address;
    addresses.lenderProxyAddress2 = lenderProxy2.address;
    addresses.borrowerProxyAddress = borrowerProxy.address;
    addresses.poolAddress = poolContract.address;
    addresses.poolAddressWeth = poolContractWeth.address;
    addresses.weth = weth.address;
    addresses.apa = apa.address;
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
      apa,
      poolInfoContract,
      bidder,
      rewardsManagerContract,
      positionManagerContract,
      ajna,
      poolContractWeth,
      weth,
      dmpGuard,
      arc,
    };
  }

  describe("DPM - borrower - AjnaProxyActions - WETH", function () {
    it("should depositCollateral", async () => {
      const { weth, borrowerProxy, poolContract, apa, borrower, poolContractWeth } = await loadFixture(deploy);
      let balancesCollateralBefore = {
        borrower: await hre.ethers.provider.getBalance(borrower.address),
        pool: await hre.ethers.provider.getBalance(poolContract.address),
      };

      const gas = await depositCollateral(
        apa,
        poolContractWeth,
        borrower,
        borrowerProxy,
        ethers.utils.parseUnits("1", 18),
        ethers.utils.parseUnits("11821.273", 18),
        weth,
        true
      );

      let balancesCollateralAfter = {
        borrower: await hre.ethers.provider.getBalance(borrower.address),
        pool: await hre.ethers.provider.getBalance(poolContractWeth.address),
      };
      console.table(balancesCollateralBefore);
      console.table(balancesCollateralAfter);
      expect(balancesCollateralAfter.borrower).to.be.equal(
        balancesCollateralBefore.borrower.sub(ethers.utils.parseUnits("1", 18)).sub(gas)
      );
    });
    it("should depositCollateral and withdrawCollateral", async () => {
      const { weth, borrowerProxy, poolContractWeth, apa, borrower } = await loadFixture(deploy);
      let balancesCollateralBefore = {
        borrower: await hre.ethers.provider.getBalance(borrower.address),
        pool: await hre.ethers.provider.getBalance(poolContractWeth.address),
      };
      const price = ethers.utils.parseUnits("16821.273", 18);
      const gas = await depositCollateral(
        apa,
        poolContractWeth,
        borrower,
        borrowerProxy,
        ethers.utils.parseUnits("1", 18),
        price,
        weth,
        true
      );

      const gas2 = await withdrawCollateral(
        apa,
        poolContractWeth,
        weth,
        borrower,
        borrowerProxy,
        ethers.utils.parseUnits("1", 18)
      );

      let balancesCollateralAfter = {
        borrower: await hre.ethers.provider.getBalance(borrower.address),
        pool: await hre.ethers.provider.getBalance(poolContractWeth.address),
      };

      expect(balancesCollateralAfter.borrower).to.be.equal(balancesCollateralBefore.borrower.sub(gas).sub(gas2));
    });
    it("should openAndDraw", async () => {
      const { weth, borrowerProxy, poolContractWeth, apa, borrower, usdc } = await loadFixture(deploy);
      let balancesQuoteBefore = {
        borrower: await usdc.balanceOf(borrower.address),
        pool: await usdc.balanceOf(poolContractWeth.address),
      };
      let balancesCollateralBefore = {
        borrower: await hre.ethers.provider.getBalance(borrower.address),
        pool: await hre.ethers.provider.getBalance(poolContractWeth.address),
      };
      const price = ethers.utils.parseUnits("16821.273", 18);

      const gas = await depositAndDrawDebt(
        apa,
        poolContractWeth,
        price,
        weth,
        borrower,
        borrowerProxy,
        ethers.utils.parseUnits("100", 6),
        ethers.utils.parseUnits("10", 18),
        true
      );

      let balancesQuoteAfter = {
        borrower: await usdc.balanceOf(borrower.address),
        pool: await usdc.balanceOf(poolContractWeth.address),
      };
      let balancesCollateralAfter = {
        borrower: await hre.ethers.provider.getBalance(borrower.address),
        pool: await hre.ethers.provider.getBalance(poolContractWeth.address),
      };

      expect(balancesQuoteAfter.borrower).to.be.eq(balancesQuoteBefore.borrower.add(ethers.utils.parseUnits("100", 6)));
      expect(balancesCollateralAfter.borrower).to.be.equal(
        balancesCollateralBefore.borrower.sub(ethers.utils.parseUnits("10", 18)).sub(gas)
      );
    });

    it("should openAndDraw and repayDebt", async () => {
      const { weth, borrowerProxy, poolContractWeth, apa, borrower, usdc, poolInfoContract } = await loadFixture(
        deploy
      );
      let balancesQuoteBefore = {
        borrower: await usdc.balanceOf(borrower.address),
        pool: await usdc.balanceOf(poolContractWeth.address),
      };
      let balancesCollateralBefore = {
        borrower: await hre.ethers.provider.getBalance(borrower.address),
        pool: await hre.ethers.provider.getBalance(poolContractWeth.address),
      };
      const price = ethers.utils.parseUnits("16821.273", 18);

      const gas = await depositAndDrawDebt(
        apa,
        poolContractWeth,
        price,
        weth,
        borrower,
        borrowerProxy,
        ethers.utils.parseUnits("100", 6),
        ethers.utils.parseUnits("10", 18),
        true
      );

      let borrowerInfo = await poolInfoContract.borrowerInfo(poolContractWeth.address, borrowerProxy.address);

      const gas2 = await repayDebt(apa, poolContractWeth, usdc, borrower, borrowerProxy, poolInfoContract);

      let balancesQuoteAfter = {
        borrower: await usdc.balanceOf(borrower.address),
        pool: await usdc.balanceOf(poolContractWeth.address),
      };
      let balancesCollateralAfter = {
        borrower: await hre.ethers.provider.getBalance(borrower.address),
        pool: await hre.ethers.provider.getBalance(poolContractWeth.address),
      };
      borrowerInfo = await poolInfoContract.borrowerInfo(poolContractWeth.address, borrower.address);

      expect(balancesQuoteAfter.borrower).to.be.lt(balancesQuoteBefore.borrower);
      expect(balancesCollateralAfter.borrower).to.be.equal(
        balancesCollateralBefore.borrower.sub(ethers.utils.parseUnits("10", 18)).sub(gas).sub(gas2)
      );
      expect(borrowerInfo.debt_).to.be.eq(0);
    });

    it("should openAndDraw and repayAndClose", async () => {
      const { weth, borrowerProxy, poolContractWeth, apa, borrower, usdc } = await loadFixture(deploy);
      let balancesQuoteBefore = {
        borrower: await usdc.balanceOf(borrower.address),
        pool: await usdc.balanceOf(poolContractWeth.address),
      };
      let balancesCollateralBefore = {
        borrower: await hre.ethers.provider.getBalance(borrower.address),
        pool: await hre.ethers.provider.getBalance(poolContractWeth.address),
      };
      const price = ethers.utils.parseUnits("16821.273", 18);
      const gas = await depositAndDrawDebt(
        apa,
        poolContractWeth,
        price,
        weth,
        borrower,
        borrowerProxy,
        ethers.utils.parseUnits("1000", 6),
        ethers.utils.parseUnits("10", 18),
        true
      );
      let balancesQuoteAfterDraw = {
        borrower: await usdc.balanceOf(borrower.address),
        pool: await usdc.balanceOf(poolContractWeth.address),
      };
      await hre.network.provider.send("evm_increaseTime", ["0x127501"]);

      const gas2 = await repayAndClose(apa, poolContractWeth, usdc, borrower, borrowerProxy);

      let balancesQuoteAfter = {
        borrower: await usdc.balanceOf(borrower.address),
        pool: await usdc.balanceOf(poolContractWeth.address),
      };
      let balancesCollateralAfter = {
        borrower: await hre.ethers.provider.getBalance(borrower.address),
        pool: await hre.ethers.provider.getBalance(poolContractWeth.address),
      };

      expect(balancesQuoteAfter.borrower).to.be.lt(balancesQuoteBefore.borrower);
      expect(balancesQuoteBefore.borrower).to.be.eq(
        balancesQuoteAfterDraw.borrower.sub(ethers.utils.parseUnits("1000", 6))
      );
      expect(balancesCollateralAfter.borrower).to.be.equal(balancesCollateralBefore.borrower.sub(gas).sub(gas2));
    });

    it("should drawDebt", async () => {
      const { weth, borrowerProxy, poolContractWeth, apa, borrower, usdc } = await loadFixture(deploy);
      let balancesQuoteBefore = {
        borrower: await usdc.balanceOf(borrower.address),
        pool: await usdc.balanceOf(poolContractWeth.address),
      };
      let balancesCollateralBefore = {
        borrower: await hre.ethers.provider.getBalance(borrower.address),
        pool: await hre.ethers.provider.getBalance(poolContractWeth.address),
      };

      const price = ethers.utils.parseUnits("16821.273", 18);
      const gas1 = await depositCollateral(
        apa,
        poolContractWeth,
        borrower,
        borrowerProxy,
        ethers.utils.parseUnits("10", 18),
        price,
        weth,
        true
      );
      const gas2 = await drawDebt(
        apa,
        poolContractWeth,
        borrowerProxy,
        borrower,
        ethers.utils.parseUnits("100", 6),
        price
      );

      let balancesQuoteAfter = {
        borrower: await usdc.balanceOf(borrower.address),
        pool: await usdc.balanceOf(poolContractWeth.address),
      };
      let balancesCollateralAfter = {
        borrower: await hre.ethers.provider.getBalance(borrower.address),
        pool: await hre.ethers.provider.getBalance(poolContractWeth.address),
      };
      expect(balancesCollateralAfter.borrower).to.be.eq(
        balancesCollateralBefore.borrower.sub(ethers.utils.parseUnits("10", 18)).sub(gas1).sub(gas2)
      );
      expect(balancesQuoteAfter.borrower).to.be.eq(balancesQuoteBefore.borrower.add(ethers.utils.parseUnits("100", 6)));
    });
  });
  describe("DPM - borrower - AjnaProxyActions", function () {
    it("should depositCollateral", async () => {
      const { wbtc, borrowerProxy, poolContract, apa, borrower } = await loadFixture(deploy);
      let balancesCollateralBefore = {
        borrower: await wbtc.balanceOf(borrower.address),
        pool: await wbtc.balanceOf(poolContract.address),
      };
      const gas = await depositCollateral(
        apa,
        poolContract,
        borrower,
        borrowerProxy,
        ethers.utils.parseUnits("1", 8),
        ethers.utils.parseUnits("16821.273", 18),
        wbtc
      );
      let balancesCollateralAfter = {
        borrower: await wbtc.balanceOf(borrower.address),
        pool: await wbtc.balanceOf(poolContract.address),
      };

      expect(balancesCollateralAfter.borrower).to.be.equal(
        balancesCollateralBefore.borrower.sub(ethers.utils.parseUnits("1", 8))
      );
    });
    it("should depositCollateral and withdrawCollateral", async () => {
      const { wbtc, borrowerProxy, poolContract, apa, borrower } = await loadFixture(deploy);
      let balancesCollateralBefore = {
        borrower: await wbtc.balanceOf(borrower.address),
        pool: await wbtc.balanceOf(poolContract.address),
      };
      const price = ethers.utils.parseUnits("16821.273", 18);
      await depositCollateral(apa, poolContract, borrower, borrowerProxy, ethers.utils.parseUnits("1", 8), price, wbtc);

      await withdrawCollateral(apa, poolContract, wbtc, borrower, borrowerProxy, ethers.utils.parseUnits("1", 8));

      let balancesCollateralAfter = {
        borrower: await wbtc.balanceOf(borrower.address),
        pool: await wbtc.balanceOf(poolContract.address),
      };

      expect(balancesCollateralAfter.borrower).to.be.equal(balancesCollateralBefore.borrower);
    });
    it("should openAndDraw", async () => {
      const { wbtc, borrowerProxy, poolContract, apa, borrower, usdc } = await loadFixture(deploy);
      let balancesQuoteBefore = {
        borrower: await usdc.balanceOf(borrower.address),
        pool: await usdc.balanceOf(poolContract.address),
      };
      let balancesCollateralBefore = {
        borrower: await wbtc.balanceOf(borrower.address),
        pool: await wbtc.balanceOf(poolContract.address),
      };
      const price = ethers.utils.parseUnits("16821.273", 18);

      await depositAndDrawDebt(
        apa,
        poolContract,
        price,
        wbtc,
        borrower,
        borrowerProxy,
        ethers.utils.parseUnits("100", 6),
        ethers.utils.parseUnits("10", 8)
      );

      let balancesQuoteAfter = {
        borrower: await usdc.balanceOf(borrower.address),
        pool: await usdc.balanceOf(poolContract.address),
      };
      let balancesCollateralAfter = {
        borrower: await wbtc.balanceOf(borrower.address),
        pool: await wbtc.balanceOf(poolContract.address),
      };

      expect(balancesQuoteAfter.borrower).to.be.eq(balancesQuoteBefore.borrower.add(ethers.utils.parseUnits("100", 6)));
      expect(balancesCollateralAfter.borrower).to.be.equal(
        balancesCollateralBefore.borrower.sub(ethers.utils.parseUnits("10", 8))
      );
    });

    it("should openAndDraw and repayDebt", async () => {
      const { wbtc, borrowerProxy, poolContract, apa, borrower, usdc, poolInfoContract } = await loadFixture(deploy);
      let balancesQuoteBefore = {
        borrower: await usdc.balanceOf(borrower.address),
        pool: await usdc.balanceOf(poolContract.address),
      };
      let balancesCollateralBefore = {
        borrower: await wbtc.balanceOf(borrower.address),
        pool: await wbtc.balanceOf(poolContract.address),
      };
      const price = ethers.utils.parseUnits("16821.273", 18);

      await depositAndDrawDebt(
        apa,
        poolContract,
        price,
        wbtc,
        borrower,
        borrowerProxy,
        ethers.utils.parseUnits("100", 6),
        ethers.utils.parseUnits("10", 8)
      );

      let borrowerInfo = await poolInfoContract.borrowerInfo(poolContract.address, borrowerProxy.address);

      await repayDebt(apa, poolContract, usdc, borrower, borrowerProxy, poolInfoContract);

      let balancesQuoteAfter = {
        borrower: await usdc.balanceOf(borrower.address),
        pool: await usdc.balanceOf(poolContract.address),
      };
      let balancesCollateralAfter = {
        borrower: await wbtc.balanceOf(borrower.address),
        pool: await wbtc.balanceOf(poolContract.address),
      };
      borrowerInfo = await poolInfoContract.borrowerInfo(poolContract.address, borrower.address);

      expect(balancesQuoteAfter.borrower).to.be.lt(balancesQuoteBefore.borrower);
      expect(balancesCollateralAfter.borrower).to.be.equal(
        balancesCollateralBefore.borrower.sub(ethers.utils.parseUnits("10", 8))
      );
      expect(borrowerInfo.debt_).to.be.eq(0);
    });

    it("should openAndDraw and repayAndClose", async () => {
      const { wbtc, borrowerProxy, poolContract, apa, borrower, usdc, poolInfoContract } = await loadFixture(deploy);
      let balancesQuoteBefore = {
        borrower: await usdc.balanceOf(borrower.address),
        pool: await usdc.balanceOf(poolContract.address),
      };
      let balancesCollateralBefore = {
        borrower: await wbtc.balanceOf(borrower.address),
        pool: await wbtc.balanceOf(poolContract.address),
      };
      const price = ethers.utils.parseUnits("16821.273", 18);
      await depositAndDrawDebt(
        apa,
        poolContract,
        price,
        wbtc,
        borrower,
        borrowerProxy,
        ethers.utils.parseUnits("1000", 6),
        ethers.utils.parseUnits("10", 8)
      );
      await depositAndDrawDebt(
        apa,
        poolContract,
        price,
        wbtc,
        borrower,
        borrowerProxy,
        ethers.utils.parseUnits("1000", 6),
        ethers.utils.parseUnits("10", 8)
      );
      let balancesQuoteAfterDraw = {
        borrower: await usdc.balanceOf(borrower.address),
        pool: await usdc.balanceOf(poolContract.address),
      };
      await hre.network.provider.send("evm_increaseTime", ["0x127501"]);

      await repayAndClose(apa, poolContract, usdc, borrower, borrowerProxy);

      let balancesQuoteAfter = {
        borrower: await usdc.balanceOf(borrower.address),
        pool: await usdc.balanceOf(poolContract.address),
      };
      let balancesCollateralAfter = {
        borrower: await wbtc.balanceOf(borrower.address),
        pool: await wbtc.balanceOf(poolContract.address),
      };

      expect(balancesQuoteAfter.borrower).to.be.lt(balancesQuoteBefore.borrower);
      expect(balancesQuoteBefore.borrower).to.be.eq(
        balancesQuoteAfterDraw.borrower.sub(ethers.utils.parseUnits("2000", 6))
      );
      expect(balancesCollateralAfter.borrower).to.be.equal(balancesCollateralBefore.borrower);
    });

    it("should drawDebt", async () => {
      const { wbtc, borrowerProxy, poolContract, apa, borrower, usdc } = await loadFixture(deploy);
      let balancesQuoteBefore = {
        borrower: await usdc.balanceOf(borrower.address),
        pool: await usdc.balanceOf(poolContract.address),
      };
      let balancesCollateralBefore = {
        borrower: await wbtc.balanceOf(borrower.address),
        pool: await wbtc.balanceOf(poolContract.address),
      };

      const price = ethers.utils.parseUnits("16821.273", 18);
      await depositCollateral(
        apa,
        poolContract,
        borrower,
        borrowerProxy,
        ethers.utils.parseUnits("10", 8),
        price,
        wbtc
      );

      await drawDebt(apa, poolContract, borrowerProxy, borrower, ethers.utils.parseUnits("100", 6), price);

      let balancesQuoteAfter = {
        borrower: await usdc.balanceOf(borrower.address),
        pool: await usdc.balanceOf(poolContract.address),
      };
      let balancesCollateralAfter = {
        borrower: await wbtc.balanceOf(borrower.address),
        pool: await wbtc.balanceOf(poolContract.address),
      };
      expect(balancesCollateralAfter.borrower).to.be.eq(
        balancesCollateralBefore.borrower.sub(ethers.utils.parseUnits("10", 8))
      );
      expect(balancesQuoteAfter.borrower).to.be.eq(balancesQuoteBefore.borrower.add(ethers.utils.parseUnits("100", 6)));
    });
  });
  describe("DPM - lender - AjnaProxyActions", function () {
    it("should supplyQuote", async () => {
      const { lenderProxy, poolContract, apa, lender, usdc, poolInfoContract } = await loadFixture(deploy);
      let balancesQuoteBefore = {
        lender: await usdc.balanceOf(lender.address),
        pool: await usdc.balanceOf(poolContract.address),
      };

      const price = ethers.utils.parseUnits("16821.273", 18);
      const index = await apa.convertPriceToIndex(price);
      await supplyQuote(apa, poolContract, usdc, lender, lenderProxy, ethers.utils.parseUnits("1000", 6), price);

      let balancesQuoteAfter = {
        lender: await usdc.balanceOf(lender.address),
        pool: await usdc.balanceOf(poolContract.address),
      };
      const { lpBalance_ } = await poolContract.lenderInfo(index, lenderProxy.address);
      const depositedQuoteAmount = await poolInfoContract.lpsToQuoteTokens(poolContract.address, lpBalance_, index);
      expect(depositedQuoteAmount).to.be.equal(ethers.utils.parseUnits("1000", 18));
      expect(balancesQuoteAfter.lender).to.be.equal(balancesQuoteBefore.lender.sub(ethers.utils.parseUnits("1000", 6)));
    });
    it("should supplyQuote --> moveQuote", async () => {
      const { lenderProxy, poolContract, apa, lender, usdc, poolInfoContract } = await loadFixture(deploy);
      let balancesQuoteBefore = {
        lender: await usdc.balanceOf(lender.address),
        pool: await usdc.balanceOf(poolContract.address),
      };

      const price = ethers.utils.parseUnits("16821.273", 18);
      const index = await apa.convertPriceToIndex(price);
      await supplyQuote(apa, poolContract, usdc, lender, lenderProxy, ethers.utils.parseUnits("100000", 6), price);
      await moveQuote(
        apa,
        poolContract,
        usdc,
        lender,
        lenderProxy,
        price,
        price.add(ethers.utils.parseUnits("1000", 18))
      );

      let balancesQuoteAfter = {
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
      const newIndex = await apa.convertPriceToIndex(price.add(ethers.utils.parseUnits("1000", 18)));
      const newBalance = await poolContract.lenderInfo(newIndex, lenderProxy.address);
      const newDepositedQuoteAmount = await poolInfoContract.lpsToQuoteTokens(
        poolContract.address,
        newBalance.lpBalance_,
        newIndex
      );
      expect(newDepositedQuoteAmount).to.be.equal(ethers.utils.parseUnits("100000", 18));
      expect(balancesQuoteAfter.lender).to.be.equal(
        balancesQuoteBefore.lender.sub(ethers.utils.parseUnits("100000", 6))
      );
    });
    it("should supplyAndMoveQuote", async () => {
      const { lenderProxy, poolContract, apa, lender, usdc, poolInfoContract } = await loadFixture(deploy);
      let balancesQuoteBefore = {
        lender: await usdc.balanceOf(lender.address),
        pool: await usdc.balanceOf(poolContract.address),
      };

      const price = ethers.utils.parseUnits("16821.273", 18);
      const index = await apa.convertPriceToIndex(price);
      await supplyQuote(apa, poolContract, usdc, lender, lenderProxy, ethers.utils.parseUnits("100000", 6), price);
      await supplyAndMoveQuote(
        apa,
        poolContract,
        usdc,
        lender,
        lenderProxy,
        ethers.utils.parseUnits("100000", 6),
        price,
        price.add(ethers.utils.parseUnits("1000", 18))
      );

      let balancesQuoteAfter = {
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
      const newIndex = await apa.convertPriceToIndex(price.add(ethers.utils.parseUnits("1000", 18)));
      const newBalance = await poolContract.lenderInfo(newIndex, lenderProxy.address);
      const newDepositedQuoteAmount = await poolInfoContract.lpsToQuoteTokens(
        poolContract.address,
        newBalance.lpBalance_,
        newIndex
      );
      expect(newDepositedQuoteAmount).to.be.equal(ethers.utils.parseUnits("200000", 18));
      expect(balancesQuoteAfter.lender).to.be.equal(
        balancesQuoteBefore.lender.sub(ethers.utils.parseUnits("200000", 6))
      );
    });
    it("should withdrawAndMoveQuote", async () => {
      const { lenderProxy, poolContract, apa, lender, usdc, poolInfoContract } = await loadFixture(deploy);
      let balancesQuoteBefore = {
        lender: await usdc.balanceOf(lender.address),
        pool: await usdc.balanceOf(poolContract.address),
      };

      const price = ethers.utils.parseUnits("16821.273", 18);
      const index = await apa.convertPriceToIndex(price);
      const lendAmount = ethers.utils.parseUnits("100000", 6);
      const withdrawAmount = ethers.utils.parseUnits("10000", 6);
      await supplyQuote(apa, poolContract, usdc, lender, lenderProxy, lendAmount, price);
      await hre.network.provider.send("evm_increaseTime", ["0x127501"]);
      await withdrawAndMoveQuote(
        apa,
        poolContract,
        usdc,
        lender,
        lenderProxy,
        withdrawAmount,
        price,
        price.add(ethers.utils.parseUnits("1000", 18))
      );

      let balancesQuoteAfter = {
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
      const newIndex = await apa.convertPriceToIndex(price.add(ethers.utils.parseUnits("1000", 18)));
      const newBalance = await poolContract.lenderInfo(newIndex, lenderProxy.address);
      const newDepositedQuoteAmount = await poolInfoContract.lpsToQuoteTokens(
        poolContract.address,
        newBalance.lpBalance_,
        newIndex
      );
      expect(newDepositedQuoteAmount).to.be.equal(ethers.utils.parseUnits("90000", 18));
      expect(balancesQuoteAfter.lender).to.be.equal(balancesQuoteBefore.lender.sub(lendAmount).add(withdrawAmount));
    });
    it("should supplyQuote and withdrawQuote", async () => {
      const { lenderProxy, poolContract, apa, lender, usdc } = await loadFixture(deploy);
      let balancesQuoteBefore = {
        lender: await usdc.balanceOf(lender.address),
        pool: await usdc.balanceOf(poolContract.address),
      };

      const price = ethers.utils.parseUnits("16821.273", 18);
      const lendAmount = ethers.utils.parseUnits("1000", 6);
      const withdrawAmount = ethers.utils.parseUnits("2000", 6);

      await supplyQuote(apa, poolContract, usdc, lender, lenderProxy, lendAmount, price);
      // increase the time of the next block
      await hre.network.provider.send("evm_increaseTime", ["0x127501"]);
      await withdrawQuote(apa, poolContract, usdc, lender, lenderProxy, withdrawAmount, price);

      let balancesQuoteAfter = {
        lender: await usdc.balanceOf(lender.address),
        pool: await usdc.balanceOf(poolContract.address),
      };
      // there are no borrowers hence the depoisit is not earning
      expect(balancesQuoteAfter.lender).to.be.equal(balancesQuoteBefore.lender);
    });
    it("should supplyQuote and withdrawQuote and accrue interest", async () => {
      const { wbtc, lenderProxy, poolContract, apa, lender, usdc, borrower, borrowerProxy } = await loadFixture(deploy);
      let balancesQuoteBefore = {
        lender: await usdc.balanceOf(lender.address),
        pool: await usdc.balanceOf(poolContract.address),
      };
      const lendAmount = ethers.utils.parseUnits("10000000", 6);
      const borrowAmount = ethers.utils.parseUnits("10000000", 6);
      const depositAmount = ethers.utils.parseUnits("100000", 8);
      const price = ethers.utils.parseUnits("16821.273", 18);

      await supplyQuote(apa, poolContract, usdc, lender, lenderProxy, lendAmount, price);
      // increase the time of the next block
      await depositAndDrawDebt(apa, poolContract, price, wbtc, borrower, borrowerProxy, borrowAmount, depositAmount);
      await hre.network.provider.send("evm_increaseTime", ["0x127501"]);
      await repayAndClose(apa, poolContract, usdc, borrower, borrowerProxy);
      await withdrawQuote(apa, poolContract, usdc, lender, lenderProxy, lendAmount.mul(101).div(100), price);

      let balancesQuoteAfter = {
        lender: await usdc.balanceOf(lender.address),
        pool: await usdc.balanceOf(poolContract.address),
      };
      // expected that the lender will get more quote tokens due to interest
      expect(balancesQuoteAfter.lender).to.be.gt(balancesQuoteBefore.lender);
    });
  });
  describe("DPM - lender - AjnaProxyActions - NFT", function () {
    it.only("should claim multiple rewards from multiple proxies - same owner - called by the owner", async () => {
      const {
        wbtc,
        lenderProxy,
        lenderProxy2,
        poolContract,
        apa,
        lender,
        usdc,
        ajna,
        borrower,
        borrowerProxy,
        poolInfoContract,
        bidder,
        rewardsManagerContract,
        arc,
      } = await loadFixture(deploy);

      const price = ethers.utils.parseUnits("46776653369145271678115", 0);
      const newPrice = ethers.utils.parseUnits("99863.654", 18);
      const lendAmount = ethers.utils.parseUnits("1000000000", 6);
      const borrowAmount = ethers.utils.parseUnits("10000", 6);

      await supplyQuote(apa, poolContract, usdc, lender, lenderProxy, ethers.utils.parseUnits("1000000000", 6), price);
      await mintAndStakeNft(apa, poolContract, lenderProxy, lender, price);
      await supplyQuoteMintNftAndStake(apa, poolContract, lenderProxy2, lender, lendAmount, price, usdc);

      await depositAndDrawDebt(
        apa,
        poolContract,
        price,
        wbtc,
        borrower,
        borrowerProxy,
        borrowAmount,
        ethers.utils.parseUnits("10", 8)
      );

      await depositAndDrawDebt(
        apa,
        poolContract,
        price,
        wbtc,
        borrower,
        borrowerProxy,
        borrowAmount,
        ethers.utils.parseUnits("10", 8)
      );

      await hre.network.provider.send("evm_increaseTime", ["0x11C60"]);

      await repayDebt(apa, poolContract, usdc, borrower, borrowerProxy, poolInfoContract);

      await poolContract.connect(bidder).startClaimableReserveAuction();

      await hre.network.provider.send("evm_increaseTime", ["0x15180"]);

      await ajna.connect(bidder).approve(poolContract.address, ethers.constants.MaxUint256);
      await poolContract.connect(bidder).takeReserves(1);

      await rewardsManagerContract
        .connect(lender)
        .updateBucketExchangeRatesAndClaim(poolContract.address, [5541, 2000]);

      await hre.network.provider.send("evm_increaseTime", ["0x172800"]);
      let epoch = await poolContract.currentBurnEpoch();
      const rewardsToClaim = [
        await rewardsManagerContract.calculateRewards(1, epoch),
        await rewardsManagerContract.calculateRewards(2, epoch),
      ];
      const ajnaBalanceBefore = await ajna.balanceOf(lender.address);
      await arc.connect(lender).claimRewardsAndSendToOwner([1, 2]);
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
        apa,
        lender,
        usdc,
        ajna,
        borrower,
        borrowerProxy,
        poolInfoContract,
        bidder,
        rewardsManagerContract,
        arc,
      } = await loadFixture(deploy);

      const price = ethers.utils.parseUnits("46776653369145271678115", 0);
      const newPrice = ethers.utils.parseUnits("99863.654", 18);
      const lendAmount = ethers.utils.parseUnits("1000000000", 6);
      const borrowAmount = ethers.utils.parseUnits("10000", 6);

      await supplyQuote(apa, poolContract, usdc, lender, lenderProxy, ethers.utils.parseUnits("1000000000", 6), price);
      await mintAndStakeNft(apa, poolContract, lenderProxy, lender, price);
      await supplyQuoteMintNftAndStake(apa, poolContract, lenderProxy2, lender, lendAmount, price, usdc);

      await depositAndDrawDebt(
        apa,
        poolContract,
        price,
        wbtc,
        borrower,
        borrowerProxy,
        borrowAmount,
        ethers.utils.parseUnits("10", 8)
      );

      await depositAndDrawDebt(
        apa,
        poolContract,
        price,
        wbtc,
        borrower,
        borrowerProxy,
        borrowAmount,
        ethers.utils.parseUnits("10", 8)
      );

      await hre.network.provider.send("evm_increaseTime", ["0x11C60"]);

      await repayDebt(apa, poolContract, usdc, borrower, borrowerProxy, poolInfoContract);

      await poolContract.connect(bidder).startClaimableReserveAuction();

      await hre.network.provider.send("evm_increaseTime", ["0x15180"]);

      await ajna.connect(bidder).approve(poolContract.address, ethers.constants.MaxUint256);
      await poolContract.connect(bidder).takeReserves(1);

      await rewardsManagerContract
        .connect(lender)
        .updateBucketExchangeRatesAndClaim(poolContract.address, [5541, 2000]);

      await hre.network.provider.send("evm_increaseTime", ["0x172800"]);

      const tx = arc.connect(borrower).claimRewardsAndSendToOwner([1, 2]);
      await expect(tx).to.be.revertedWithCustomError(arc, "CallerNotProxyOwner");
    });
    it("should NOT claim multiple rewards from multiple proxies - different owners - while called by one of the owners", async () => {
      const {
        wbtc,
        lenderProxy,
        lenderProxy2,
        poolContract,
        apa,
        lender,
        usdc,
        ajna,
        borrower,
        borrowerProxy,
        poolInfoContract,
        bidder,
        rewardsManagerContract,
        arc,
      } = await loadFixture(deploy);

      const price = ethers.utils.parseUnits("46776653369145271678115", 0);
      const newPrice = ethers.utils.parseUnits("99863.654", 18);
      const lendAmount = ethers.utils.parseUnits("1000000000", 6);
      const borrowAmount = ethers.utils.parseUnits("10000", 6);

      await supplyQuote(apa, poolContract, usdc, lender, lenderProxy, ethers.utils.parseUnits("1000000000", 6), price);
      await mintAndStakeNft(apa, poolContract, lenderProxy, lender, price);
      await supplyQuoteMintNftAndStake(apa, poolContract, borrowerProxy, borrower, lendAmount, price, usdc);

      await depositAndDrawDebt(
        apa,
        poolContract,
        price,
        wbtc,
        borrower,
        borrowerProxy,
        borrowAmount,
        ethers.utils.parseUnits("10", 8)
      );

      await depositAndDrawDebt(
        apa,
        poolContract,
        price,
        wbtc,
        borrower,
        borrowerProxy,
        borrowAmount,
        ethers.utils.parseUnits("10", 8)
      );

      await hre.network.provider.send("evm_increaseTime", ["0x11C60"]);

      await repayDebt(apa, poolContract, usdc, borrower, borrowerProxy, poolInfoContract);

      await poolContract.connect(bidder).startClaimableReserveAuction();

      await hre.network.provider.send("evm_increaseTime", ["0x15180"]);

      await ajna.connect(bidder).approve(poolContract.address, ethers.constants.MaxUint256);
      await poolContract.connect(bidder).takeReserves(1);

      await rewardsManagerContract
        .connect(lender)
        .updateBucketExchangeRatesAndClaim(poolContract.address, [5541, 2000]);

      await hre.network.provider.send("evm_increaseTime", ["0x172800"]);

      const tx = arc.connect(borrower).claimRewardsAndSendToOwner([1, 2]);
      await expect(tx).to.be.revertedWithCustomError(arc, "CallerNotProxyOwner");
    });
    it("should supplyQuoteMintNftAndStake - open with NFT", async () => {
      const { lenderProxy, poolContract, apa, lender, usdc } = await loadFixture(deploy);

      const price = ethers.utils.parseUnits("93863.654", 18);
      const lendAmount = ethers.utils.parseUnits("1000000000", 6);

      await supplyQuoteMintNftAndStake(apa, poolContract, lenderProxy, lender, lendAmount, price, usdc);
    });
    it("should supplyQuoteMintNftAndStake --> supplyAndMoveQuoteNft", async () => {
      const { lenderProxy, poolContract, apa, lender, usdc } = await loadFixture(deploy);

      const price = ethers.utils.parseUnits("93863.654", 18);
      const newPrice = ethers.utils.parseUnits("99863.654", 18);
      const lendAmount = ethers.utils.parseUnits("1000000000", 6);

      await supplyQuoteMintNftAndStake(apa, poolContract, lenderProxy, lender, lendAmount, price, usdc);
      await usdc.connect(lender).approve(lenderProxy.address, lendAmount);
      await supplyAndMoveQuoteNft(apa, poolContract, usdc, lenderProxy, lender, lendAmount, price, newPrice, 1);
    });
    it("should supplyQuoteMintNftAndStake --> withdrawAndMoveQuoteNft", async () => {
      const { lenderProxy, poolContract, apa, lender, usdc } = await loadFixture(deploy);

      const price = ethers.utils.parseUnits("93863.654", 18);
      const newPrice = ethers.utils.parseUnits("99863.654", 18);
      const lendAmount = ethers.utils.parseUnits("1000000000", 6);

      await supplyQuoteMintNftAndStake(apa, poolContract, lenderProxy, lender, lendAmount, price, usdc);
      await usdc.connect(lender).approve(lenderProxy.address, lendAmount);
      await withdrawAndMoveQuoteNft(
        apa,
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
      const { lenderProxy, poolContract, apa, lender, usdc } = await loadFixture(deploy);

      const price = ethers.utils.parseUnits("93863.654", 18);
      const newPrice = ethers.utils.parseUnits("99863.654", 18);
      const lendAmount = ethers.utils.parseUnits("1000000000", 6);

      await supplyQuoteMintNftAndStake(apa, poolContract, lenderProxy, lender, lendAmount, price, usdc);
      await usdc.connect(lender).approve(lenderProxy.address, lendAmount);
      await supplyQuoteNft(apa, poolContract, usdc, lender, lenderProxy, lendAmount, price, 1);
    });
    it("should supplyQuoteMintNftAndStake --> withdrawQuoteNft", async () => {
      const { lenderProxy, poolContract, apa, lender, usdc } = await loadFixture(deploy);

      const price = ethers.utils.parseUnits("93863.654", 18);
      const newPrice = ethers.utils.parseUnits("99863.654", 18);
      const lendAmount = ethers.utils.parseUnits("1000000000", 6);

      await supplyQuoteMintNftAndStake(apa, poolContract, lenderProxy, lender, lendAmount, price, usdc);
      await usdc.connect(lender).approve(lenderProxy.address, lendAmount);
      await withdrawQuoteNft(apa, poolContract, usdc, lender, lenderProxy, lendAmount.div(2), price, 1);
    });
    it("should supplyQuoteMintNftAndStake --> moveQuoteNft ", async () => {
      const { lenderProxy, poolContract, apa, lender, usdc } = await loadFixture(deploy);

      const price = ethers.utils.parseUnits("93863.654", 18);
      const newPrice = ethers.utils.parseUnits("99863.654", 18);
      const lendAmount = ethers.utils.parseUnits("1000000000", 6);

      await supplyQuoteMintNftAndStake(apa, poolContract, lenderProxy, lender, lendAmount, price, usdc);
      await usdc.connect(lender).approve(lenderProxy.address, lendAmount);
      await moveQuoteNft(apa, poolContract, lenderProxy, lender, price, newPrice, 1);
    });
    it("should supplyQuoteMintNftAndStake --> unstakeNftAndWithdrawQuote - close ", async () => {
      const { lenderProxy, poolContract, apa, lender, usdc } = await loadFixture(deploy);

      const price = ethers.utils.parseUnits("93863.654", 18);
      const newPrice = ethers.utils.parseUnits("99863.654", 18);
      const lendAmount = ethers.utils.parseUnits("1000000000", 6);

      await supplyQuoteMintNftAndStake(apa, poolContract, lenderProxy, lender, lendAmount, price, usdc);
      await usdc.connect(lender).approve(lenderProxy.address, lendAmount);
      await hre.network.provider.send("evm_increaseTime", ["0x127501"]);
      await unstakeNftAndWithdrawQuote(apa, poolContract, usdc, lender, lenderProxy, price, 1);
    });
  });
});

async function withdrawQuote(
  apa: AjnaProxyActions,
  poolContract: ERC20Pool,
  usdc: DSToken,
  lender: Signer,
  lenderProxy: IAccountImplementation,
  amountToWithdraw: BigNumber,
  price: BigNumber
) {
  const encodedWithdrawQuoteData = apa.interface.encodeFunctionData("withdrawQuote", [
    poolContract.address,
    amountToWithdraw,
    price,
  ]);
  await usdc.connect(lender).approve(lenderProxy.address, allowance);
  const txWithdraw = await lenderProxy.connect(lender).execute(apa.address, encodedWithdrawQuoteData, {
    gasLimit: 3000000,
  });
  const receipt = await txWithdraw.wait();
  console.log("withdrawQuote gasUsed", receipt.gasUsed.toString());
  return receipt.gasUsed.mul(receipt.effectiveGasPrice);
}

async function supplyQuote(
  apa: AjnaProxyActions,
  poolContract: ERC20Pool,
  usdc: DSToken,
  lender: Signer,
  lenderProxy: IAccountImplementation,
  amountToSupply: BigNumber,
  price: BigNumber
) {
  const encodedSupplyQuoteData = apa.interface.encodeFunctionData("supplyQuote", [
    poolContract.address,
    amountToSupply,
    price,
  ]);
  await usdc.connect(lender).approve(lenderProxy.address, allowance);
  const tx = await lenderProxy.connect(lender).execute(apa.address, encodedSupplyQuoteData, {
    gasLimit: 3000000,
  });
  const receipt = await tx.wait();
  console.log("supplyQuote gasUsed", receipt.gasUsed.toString());
  return receipt.gasUsed.mul(receipt.effectiveGasPrice);
}
async function moveQuote(
  apa: AjnaProxyActions,
  poolContract: ERC20Pool,
  usdc: DSToken,
  lender: Signer,
  lenderProxy: IAccountImplementation,
  price: BigNumber,
  newPrice: BigNumber
) {
  const encodedWithdrawQuoteData = apa.interface.encodeFunctionData("moveQuote", [
    poolContract.address,
    price,
    newPrice,
  ]);
  await usdc.connect(lender).approve(lenderProxy.address, allowance);
  const txWithdraw = await lenderProxy.connect(lender).execute(apa.address, encodedWithdrawQuoteData, {
    gasLimit: 3000000,
  });
  const receipt = await txWithdraw.wait();
  console.log("moveQuote gasUsed", receipt.gasUsed.toString());
  return receipt.gasUsed.mul(receipt.effectiveGasPrice);
}
async function supplyAndMoveQuote(
  apa: AjnaProxyActions,
  poolContract: ERC20Pool,
  usdc: DSToken,
  lender: Signer,
  lenderProxy: IAccountImplementation,
  amountToMove: BigNumber,
  price: BigNumber,
  newPrice: BigNumber
) {
  const encodedWithdrawQuoteData = apa.interface.encodeFunctionData("supplyAndMoveQuote", [
    poolContract.address,
    amountToMove,
    price,
    newPrice,
  ]);
  await usdc.connect(lender).approve(lenderProxy.address, allowance);
  const txWithdraw = await lenderProxy.connect(lender).execute(apa.address, encodedWithdrawQuoteData, {
    gasLimit: 3000000,
  });
  const receipt = await txWithdraw.wait();
  console.log("supplyAndMoveQuote gasUsed", receipt.gasUsed.toString());
  return receipt.gasUsed.mul(receipt.effectiveGasPrice);
}
async function withdrawAndMoveQuote(
  apa: AjnaProxyActions,
  poolContract: ERC20Pool,
  usdc: DSToken,
  lender: Signer,
  lenderProxy: IAccountImplementation,
  amountToWithdraw: BigNumber,
  oldPrice: BigNumber,
  newPrice: BigNumber
) {
  const encodedWithdrawQuoteData = apa.interface.encodeFunctionData("withdrawAndMoveQuote", [
    poolContract.address,
    amountToWithdraw,
    oldPrice,
    newPrice,
  ]);
  await usdc.connect(lender).approve(lenderProxy.address, allowance);
  const txWithdraw = await lenderProxy.connect(lender).execute(apa.address, encodedWithdrawQuoteData, {
    gasLimit: 3000000,
  });
  const receipt = await txWithdraw.wait();
  console.log("gas used withdrawAndMoveQuote", receipt.gasUsed.toString());
  return receipt.gasUsed.mul(receipt.effectiveGasPrice);
}
async function supplyQuoteNft(
  apa: AjnaProxyActions,
  poolContract: ERC20Pool,
  usdc: DSToken,
  lender: Signer,
  lenderProxy: IAccountImplementation,
  amountToWithdraw: BigNumber,
  price: BigNumber,
  tokenId: number
) {
  const encodedWithdrawQuoteData = apa.interface.encodeFunctionData("supplyQuoteNft", [
    poolContract.address,
    amountToWithdraw,
    price,
    tokenId,
  ]);
  await usdc.connect(lender).approve(lenderProxy.address, allowance);
  const txWithdraw = await lenderProxy.connect(lender).execute(apa.address, encodedWithdrawQuoteData, {
    gasLimit: 3000000,
  });
  const receipt = await txWithdraw.wait();
  console.log("gas used supplyQuoteNft", receipt.gasUsed.toString());
  return receipt.gasUsed.mul(receipt.effectiveGasPrice);
}
async function withdrawQuoteNft(
  apa: AjnaProxyActions,
  poolContract: ERC20Pool,
  usdc: DSToken,
  lender: Signer,
  lenderProxy: IAccountImplementation,
  amountToWithdraw: BigNumber,
  price: BigNumber,
  tokenId: number
) {
  const encodedWithdrawQuoteData = apa.interface.encodeFunctionData("withdrawQuoteNft", [
    poolContract.address,
    amountToWithdraw,
    price,
    tokenId,
  ]);
  await usdc.connect(lender).approve(lenderProxy.address, allowance);
  const txWithdraw = await lenderProxy.connect(lender).execute(apa.address, encodedWithdrawQuoteData, {
    gasLimit: 3000000,
  });
  const receipt = await txWithdraw.wait();
  console.log("gas used withdrawQuoteNft", receipt.gasUsed.toString());
  return receipt.gasUsed.mul(receipt.effectiveGasPrice);
}
async function unstakeNftAndWithdrawQuote(
  apa: AjnaProxyActions,
  poolContract: ERC20Pool,
  usdc: DSToken,
  lender: Signer,
  lenderProxy: IAccountImplementation,
  price: BigNumber,
  tokenId: number
) {
  const encodedData = apa.interface.encodeFunctionData("unstakeNftAndWithdrawQuote", [
    poolContract.address,
    price,
    tokenId,
  ]);
  await usdc.connect(lender).approve(lenderProxy.address, allowance);
  const txWithdraw = await lenderProxy.connect(lender).execute(apa.address, encodedData, {
    gasLimit: 3000000,
  });
  const receipt = await txWithdraw.wait();
  console.log("gas used unstakeNftAndWithdrawQuote", receipt.gasUsed.toString());
  return receipt.gasUsed.mul(receipt.effectiveGasPrice);
}
async function drawDebt(
  apa: AjnaProxyActions,
  poolContract: ERC20Pool,
  borrowerProxy: IAccountImplementation,
  borrower: Signer,
  amountToDraw: BigNumber,
  price: BigNumber
) {
  const encodedDrawDebtData = apa.interface.encodeFunctionData("drawDebt", [poolContract.address, amountToDraw, price]);

  const tx = await borrowerProxy.connect(borrower).execute(apa.address, encodedDrawDebtData, {
    gasLimit: 30000000,
  });

  const receipt = await tx.wait();

  return receipt.gasUsed.mul(receipt.effectiveGasPrice);
}

async function withdrawCollateral(
  apa: AjnaProxyActions,
  poolContract: ERC20Pool,
  wbtc: DSToken,
  borrower: Signer,
  borrowerProxy: IAccountImplementation,
  amountToWithdraw: BigNumber
) {
  const encodedWithdrawCollateralData = apa.interface.encodeFunctionData("withdrawCollateral", [
    poolContract.address,
    amountToWithdraw,
  ]);
  const approvalTx = await wbtc.connect(borrower).approve(borrowerProxy.address, allowance);
  const receiptApproval = await approvalTx.wait();
  const withdrawCollateralTx = await borrowerProxy
    .connect(borrower)
    .execute(apa.address, encodedWithdrawCollateralData, {
      gasLimit: 3000000,
    });

  const receipt = await withdrawCollateralTx.wait();

  return receipt.gasUsed
    .mul(receipt.effectiveGasPrice)
    .add(receiptApproval.gasUsed.mul(receiptApproval.effectiveGasPrice));
}

async function depositCollateral(
  apa: AjnaProxyActions,
  poolContract: ERC20Pool,
  borrower: Signer,
  borrowerProxy: IAccountImplementation,
  amountToDeposit: BigNumber,
  price: BigNumber,
  collateralToken: DSToken | WETH,
  isWeth = false
) {
  const encodedAddCollateralData = apa.interface.encodeFunctionData("depositCollateral", [
    poolContract.address,
    amountToDeposit,
    price,
  ]);
  const approvalTx = await collateralToken.connect(borrower).approve(borrowerProxy.address, allowance);
  const addCollateralTx = await borrowerProxy.connect(borrower).execute(apa.address, encodedAddCollateralData, {
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
  apa: AjnaProxyActions,
  poolContract: ERC20Pool,
  usdc: DSToken,
  borrower: Signer,
  borrowerProxy: IAccountImplementation
) {
  const encodedRepayData = apa.interface.encodeFunctionData("repayAndClose", [poolContract.address]);
  const approvalTx = await usdc.connect(borrower).approve(borrowerProxy.address, allowance);
  const approvalTxReceipt = await approvalTx.wait();
  const repayTx = await borrowerProxy.connect(borrower).execute(apa.address, encodedRepayData, {
    gasLimit: 3000000,
  });

  const receipt = await repayTx.wait();

  return receipt.gasUsed
    .mul(receipt.effectiveGasPrice)
    .add(approvalTxReceipt.gasUsed.mul(approvalTxReceipt.effectiveGasPrice));
}

async function mintAndStakeNft(
  apa: AjnaProxyActions,
  poolContract: ERC20Pool,
  lenderProxy: IAccountImplementation,
  lender: Signer,
  price: BigNumber
) {
  const mintNftData = apa.interface.encodeFunctionData("mintAndStakeNft", [poolContract.address, price]);
  const mintNftTx = await lenderProxy.connect(lender).execute(apa.address, mintNftData, {
    gasLimit: 3000000,
  });
  const receipt = await mintNftTx.wait();
  return receipt.gasUsed.mul(receipt.effectiveGasPrice);
}
async function claimRewardsAndSendToOwner(
  apa: AjnaProxyActions,
  poolContract: ERC20Pool,
  lenderProxy: IAccountImplementation,
  lender: Signer,
  tokenIds: number[]
) {
  const txData = apa.interface.encodeFunctionData("claimRewardsAndSendToOwner", [poolContract.address, tokenIds]);
  const tx = await lenderProxy.connect(lender).execute(apa.address, txData, {
    gasLimit: 3000000,
  });
  const receipt = await tx.wait();
  return receipt.gasUsed.mul(receipt.effectiveGasPrice);
}

async function supplyQuoteMintNftAndStake(
  apa: AjnaProxyActions,
  poolContract: ERC20Pool,
  lenderProxy: IAccountImplementation,
  lender: Signer,
  amount: BigNumber,
  price: BigNumber,
  debt: DSToken
) {
  const mintNftData = apa.interface.encodeFunctionData("supplyQuoteMintNftAndStake", [
    poolContract.address,
    amount,
    price,
  ]);
  await debt.connect(lender).approve(lenderProxy.address, amount);
  const mintNftTx = await lenderProxy.connect(lender).execute(apa.address, mintNftData, {
    gasLimit: 3000000,
  });
  const receipt = await mintNftTx.wait();
  console.log("gas used supplyQuoteMintNftAndStake", receipt.gasUsed.toString());
  return receipt.gasUsed.mul(receipt.effectiveGasPrice);
}
async function moveQuoteNft(
  apa: AjnaProxyActions,
  poolContract: ERC20Pool,
  lenderProxy: IAccountImplementation,
  lender: Signer,
  oldPrice: BigNumber,
  newPrice: BigNumber,
  tokenId: number
) {
  const moveLiquidityData = apa.interface.encodeFunctionData("moveQuoteNft", [
    poolContract.address,
    oldPrice,
    newPrice,
    tokenId,
  ]);
  const moveLiquidityTx = await lenderProxy.connect(lender).execute(apa.address, moveLiquidityData, {
    gasLimit: 3000000,
  });
  const receipt = await moveLiquidityTx.wait();
  console.log("gas used moveQuoteNft", receipt.gasUsed.toString());
  return receipt.gasUsed.mul(receipt.effectiveGasPrice);
}
async function supplyAndMoveQuoteNft(
  apa: AjnaProxyActions,
  poolContract: ERC20Pool,
  debt: ERC20 | DSToken,
  lenderProxy: IAccountImplementation,
  lender: Signer,
  amountToAdd: BigNumber,
  oldPrice: BigNumber,
  newPrice: BigNumber,
  tokenId: number
) {
  const mintNftData = apa.interface.encodeFunctionData("supplyAndMoveQuoteNft", [
    poolContract.address,
    amountToAdd,
    oldPrice,
    newPrice,
    tokenId,
  ]);
  await debt.connect(lender).approve(poolContract.address, allowance);
  const mintNftTx = await lenderProxy.connect(lender).execute(apa.address, mintNftData, {
    gasLimit: 3000000,
  });
  const receipt = await mintNftTx.wait();
  console.log("gas used supplyAndMoveQuoteNft", receipt.gasUsed.toString());
  return receipt.gasUsed.mul(receipt.effectiveGasPrice);
}
async function withdrawAndMoveQuoteNft(
  apa: AjnaProxyActions,
  poolContract: ERC20Pool,
  debt: ERC20 | DSToken,
  lenderProxy: IAccountImplementation,
  lender: Signer,
  amountToWithdraw: BigNumber,
  oldPrice: BigNumber,
  newPrice: BigNumber,
  tokenId: number
) {
  const mintNftData = apa.interface.encodeFunctionData("withdrawAndMoveQuoteNft", [
    poolContract.address,
    amountToWithdraw,
    oldPrice,
    newPrice,
    tokenId,
  ]);
  await debt.connect(lender).approve(poolContract.address, allowance);
  const mintNftTx = await lenderProxy.connect(lender).execute(apa.address, mintNftData, {
    gasLimit: 3000000,
  });
  const receipt = await mintNftTx.wait();
  console.log("gas used withdrawAndMoveQuoteNft", receipt.gasUsed.toString());
  return receipt.gasUsed.mul(receipt.effectiveGasPrice);
}
async function repayDebt(
  apa: AjnaProxyActions,
  poolContract: ERC20Pool,
  usdc: DSToken,
  borrower: Signer,
  borrowerProxy: IAccountImplementation,
  poolInfoContract: PoolInfoUtils,
  amountToRepay?: BigNumber
) {
  let encodedRepayData = "";
  if (amountToRepay) {
    encodedRepayData = apa.interface.encodeFunctionData("repayDebt", [poolContract.address, amountToRepay]);
  } else {
    const borrowerInfo = await poolInfoContract.borrowerInfo(poolContract.address, borrowerProxy.address);
    const quoteScale = await poolContract.quoteTokenScale();
    encodedRepayData = apa.interface.encodeFunctionData("repayDebt", [
      poolContract.address,
      borrowerInfo.debt_.mul(105).div(100).div(quoteScale),
    ]);
  }
  const approvalTx = await usdc.connect(borrower).approve(borrowerProxy.address, allowance);
  const receiptApproval = await approvalTx.wait();
  const repayTx = await borrowerProxy.connect(borrower).execute(apa.address, encodedRepayData, {
    gasLimit: 3000000,
  });

  const receipt = await repayTx.wait();
  console.log("gas used repayDebt", receipt.gasUsed.toString());
  return receipt.gasUsed
    .mul(receipt.effectiveGasPrice)
    .add(receiptApproval.gasUsed.mul(receiptApproval.effectiveGasPrice));
}

async function depositAndDrawDebt(
  apa: AjnaProxyActions,
  poolContract: ERC20Pool,
  price: BigNumber,
  collateralToken: DSToken | WETH,
  borrower: Signer,
  borrowerProxy: IAccountImplementation,
  amountToDraw: BigNumber,
  amountToDeposit: BigNumber,
  isWeth = false
) {
  const encodedAOpenAndDrawData = apa.interface.encodeFunctionData("openPosition", [
    poolContract.address,
    amountToDraw,
    amountToDeposit,
    price,
  ]);
  if (!isWeth) {
    await collateralToken.connect(borrower).approve(borrowerProxy.address, allowance);
  }
  const tx2 = await borrowerProxy.connect(borrower).execute(apa.address, encodedAOpenAndDrawData, {
    gasLimit: 3000000,
    value: isWeth ? amountToDeposit : 0,
  });

  const receipt = await tx2.wait();
  console.log("gas used depositAndDrawDebt", receipt.gasUsed.toString());
  return receipt.gasUsed.mul(receipt.effectiveGasPrice);
}

async function sendLotsOfMoney(target: string) {
  await utils.setTokenBalance(target, WBTC, BigNumber.from("1000000000000000000").mul(1000));
  await utils.setTokenBalance(target, USDC, BigNumber.from("1000000000000000000").mul(1000));
  await utils.setTokenBalance(target, AJNA, BigNumber.from("1000000000000000000").mul(1000000));
}
async function deployPool(
  poolInstance: PoolCommons,
  auctionsInstance: Auctions,
  actionsInstance: LenderActions,
  borrowerActionsInstance: BorrowerActions
) {
  const ERC20PoolFactory = await ethers.getContractFactory("ERC20PoolFactory", {
    libraries: {
      PoolCommons: poolInstance.address,
      Auctions: auctionsInstance.address,
      LenderActions: actionsInstance.address,
      BorrowerActions: borrowerActionsInstance.address,
    },
  });

  const erc20PoolFactory = await ERC20PoolFactory.deploy(AJNA, {
    gasLimit: 10000000,
  });
  hash = await erc20PoolFactory.ERC20_NON_SUBSET_HASH();

  const ERC721PoolFactory = await ethers.getContractFactory("ERC721PoolFactory", {
    libraries: {
      PoolCommons: poolInstance.address,
      Auctions: auctionsInstance.address,
      LenderActions: actionsInstance.address,
      BorrowerActions: borrowerActionsInstance.address,
    },
  });
  const erc721PoolFactory = await ERC721PoolFactory.deploy(AJNA, {
    gasLimit: 10000000,
  });

  await erc20PoolFactory.deployPool(WBTC, USDC, ethers.utils.parseUnits("0.05", 18), {
    gasLimit: 10000000,
  });
  await erc20PoolFactory.deployPool(WETH, USDC, ethers.utils.parseUnits("0.05", 18), {
    gasLimit: 10000000,
  });
  const poolAddress = await erc20PoolFactory.deployedPools(hash, WBTC, USDC);
  const poolAddressWeth = await erc20PoolFactory.deployedPools(hash, WETH, USDC);
  const poolContract = await hre.ethers.getContractAt("ERC20Pool", poolAddress);
  const poolContractWeth = await ethers.getContractAt("ERC20Pool", poolAddressWeth);
  return {
    poolAddress,
    poolContractWeth,
    poolContract,
    erc20PoolFactory,
    erc721PoolFactory,
  };
}
async function createBorrowerProxy(dmpFactory: IAccountFactory, borrower: Signer) {
  const accountTx = await dmpFactory.connect(borrower)["createAccount()"]();
  const factoryReceipt = await accountTx.wait();
  const [AccountCreatedEvent] = utils.getEvents(factoryReceipt, dmpFactory.interface.getEvent("AccountCreated"));
  const proxyAddress = AccountCreatedEvent.args.proxy.toString();
  const borrowerProxy = (await hre.ethers.getContractAt(
    "IAccountImplementation",
    proxyAddress
  )) as IAccountImplementation;
  return borrowerProxy;
}
async function createLenderProxy(dmpFactory: IAccountFactory, lender: Signer) {
  const accountTx = await dmpFactory.connect(lender)["createAccount()"]();
  const factoryReceipt = await accountTx.wait();
  const [AccountCreatedEvent] = utils.getEvents(factoryReceipt, dmpFactory.interface.getEvent("AccountCreated"));
  const proxyAddress = AccountCreatedEvent.args.proxy.toString();
  const lenderProxy = (await hre.ethers.getContractAt(
    "IAccountImplementation",
    proxyAddress
  )) as IAccountImplementation;
  return lenderProxy;
}

async function provideLiquidity(usdc: DSToken, poolContract: ERC20Pool, poolContractWeth: ERC20Pool, lender: Signer) {
  await usdc.connect(lender).approve(poolContract.address, allowance);
  await usdc.connect(lender).approve(poolContractWeth.address, allowance);
  const blockNumber = await ethers.provider.getBlockNumber();
  const timestamp = (await ethers.provider.getBlock(blockNumber)).timestamp;
  const tx = await poolContract
    .connect(lender)
    .addQuoteToken(ethers.utils.parseUnits("10000000", 18), 2000, timestamp + 100000);
  const tx2 = await poolContractWeth
    .connect(lender)
    .addQuoteToken(ethers.utils.parseUnits("10000000", 18), 2000, timestamp + 100000);
  await tx.wait();
  await tx2.wait();
}

async function deployGuard() {
  const AccountGaurdFactory = await ethers.getContractFactory("AccountGuard");
  const accountGuard = await AccountGaurdFactory.deploy();
  const AccountFactoryFactory = await ethers.getContractFactory("AccountFactory");
  const accountFactory = await AccountFactoryFactory.deploy(accountGuard.address);

  const dmpGuard = accountGuard;
  const dmpFactory = accountFactory;

  const [guardDeployerAddress] = await hre.ethers.getSigners();
  const guardDeployer = await utils.impersonate(guardDeployerAddress.address);
  return { dmpGuard, guardDeployer, dmpFactory };
}

async function deployApa(
  poolInstance: PoolCommons,
  rewardsManager: RewardsManager,
  positionManager: PositionManager,
  ajna: AjnaToken,
  weth: WETH,
  dmpGuard: AccountGuard,
  serviceRegistry: IServiceRegistry
) {
  const PoolInfoUtils = await ethers.getContractFactory("PoolInfoUtils", {
    libraries: {
      PoolCommons: poolInstance.address,
    },
  });
  const poolInfoContract = await (await PoolInfoUtils.deploy()).deployed();

  const AjnaRewardClaimer = await ethers.getContractFactory("AjnaRewardClaimer", {});
  const arc = await AjnaRewardClaimer.deploy(rewardsManager.address, ajna.address, serviceRegistry.address);

  const AjnaProxyActions = await ethers.getContractFactory("AjnaProxyActions");
  const apa = await AjnaProxyActions.deploy(
    poolInfoContract.address,
    positionManager.address,
    rewardsManager.address,
    ajna.address,
    weth.address,
    arc.address,
    dmpGuard.address
  );
  await arc.initializeAjnaProxyActions(apa.address);
  return { apa, poolInfoContract, arc };
}

async function deployTokens() {
  // const ajna = await ethers.getContractAt("DSToken", AJNA);
  const usdc = await ethers.getContractAt("DSToken", USDC);
  const wbtc = await ethers.getContractAt("DSToken", WBTC);
  const AjnaToken = await ethers.getContractFactory("AjnaToken");
  const ajna = await AjnaToken.deploy("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
  AJNA = ajna.address;
  const wethFactory = await ethers.getContractFactory("WETH");
  const weth = (await wethFactory.deploy()) as WETH;
  WETH = weth.address;
  return { usdc, wbtc, ajna, weth };
}

async function deployLibraries() {
  const Auctions = await ethers.getContractFactory("Auctions");
  const auctionsInstance = await Auctions.deploy();

  const LenderAction = await ethers.getContractFactory("LenderActions");
  const actionsInstance = await LenderAction.deploy();

  const PoolCommons = await ethers.getContractFactory("PoolCommons");
  const poolCommons = await PoolCommons.deploy();

  const BorrowerActions = await ethers.getContractFactory("BorrowerActions");
  const borrowerActionsInstance = await BorrowerActions.deploy();

  const PositionNFTSVG = await ethers.getContractFactory("PositionNFTSVG");
  const positionNFTSVGInstance = await PositionNFTSVG.deploy();

  return {
    poolCommons,
    auctionsInstance,
    actionsInstance,
    borrowerActionsInstance,
    positionNFTSVGInstance,
  };
}

async function deployRewardsContracts(
  positionNFTSVGInstance: PositionNFTSVG,
  erc20PoolFactory: ERC20PoolFactory,
  erc721PoolFactory: ERC721PoolFactory,
  ajna: AjnaToken
) {
  const PositionManager = await ethers.getContractFactory("PositionManager", {
    libraries: {
      PositionNFTSVG: positionNFTSVGInstance.address,
    },
  });
  const positionManagerContract = await (
    await PositionManager.deploy(erc20PoolFactory.address, erc721PoolFactory.address)
  ).deployed();

  const RewardsManager = await ethers.getContractFactory("RewardsManager");
  const rewardsManagerContract = await (
    await RewardsManager.deploy(ajna.address, positionManagerContract.address)
  ).deployed();
  return { rewardsManagerContract, positionManagerContract };
}

async function deployServiceRegistry() {
  const ServiceRegistry = await ethers.getContractFactory("ServiceRegistry");
  const serviceRegistryContract = await ServiceRegistry.deploy(0);
  await serviceRegistryContract.deployed();

  return { serviceRegistryContract };
}
