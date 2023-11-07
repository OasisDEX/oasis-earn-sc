import { HardhatUtils } from "@ajna-contracts/scripts";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import hre, { ethers } from "hardhat";

const AJNA = "0x347fcea8b4fd1a46e2c0db8f79e22d293c2f8513";
const USDC = "0x6Fb5ef893d44F4f88026430d82d4ef269543cB23";
const WBTC = "0x7ccF0411c7932B99FC3704d68575250F032e3bB7";
const WBTC_USDC_POOL = "0x0BDE5e31af1a88113158Fb577cB3C61Df9843afE";
const utils = new HardhatUtils(hre);
let hash = "";
const usePredeployed = false;

describe.skip("Pool direct test", function () {
  async function deploy() {
    const [deployer, lender, borrower] = await hre.ethers.getSigners();

    const addresses: { [key: string]: string } = {};

    addresses.deployerAddress = await deployer.getAddress();
    addresses.lenderAddress = await lender.getAddress();
    addresses.borrowerAddress = await borrower.getAddress();

    const usdc = await ethers.getContractAt("DSToken", USDC);
    const wbtc = await ethers.getContractAt("DSToken", WBTC);

    const wbtcUsdcPool = await ethers.getContractAt("IPool", WBTC_USDC_POOL);

    const Auctions = await ethers.getContractFactory("Auctions");
    const auctionsInstance = await Auctions.deploy();
    const LenderAction = await ethers.getContractFactory("LenderActions");
    const actionsInstance = await LenderAction.deploy();
    const BorrowerActions = await ethers.getContractFactory("BorrowerActions");
    const borrowerActionsInstance = await BorrowerActions.deploy();
    const PoolCommons = await ethers.getContractFactory("PoolCommons");
    const poolInstance = await PoolCommons.deploy();

    const ERC20PoolFactory = await ethers.getContractFactory("ERC20PoolFactory", {
      libraries: {
        PoolCommons: poolInstance.address,
        Auctions: auctionsInstance.address,
        LenderActions: actionsInstance.address,
        BorrowerActions: borrowerActionsInstance.address,
      },
    });

    let poolAddress;

    if (usePredeployed == false) {
      const erc20PoolFactory = await ERC20PoolFactory.deploy(AJNA, {
        gasLimit: 10000000,
      });
      hash = await erc20PoolFactory.ERC20_NON_SUBSET_HASH();

      (
        await erc20PoolFactory.deployPool(WBTC, USDC, "50000000000000000", {
          gasLimit: 10000000,
        })
      ).wait();

      poolAddress = await erc20PoolFactory.deployedPools(hash, WBTC, USDC);
    } else {
      poolAddress = WBTC_USDC_POOL;
    }
    addresses.poolAddress = poolAddress;

    const PoolInfoUtils = await ethers.getContractFactory("PoolInfoUtils", {
      libraries: {
        PoolCommons: poolInstance.address,
      },
    });
    const poolInfo = await (await PoolInfoUtils.deploy()).deployed();
    addresses.poolInfoAddress = poolInfo.address;

    console.table(addresses);

    for (const address in addresses) {
      await utils.setTokenBalance(addresses[address], WBTC, BigNumber.from("100000000").mul(1000));
      await utils.setTokenBalance(addresses[address], USDC, BigNumber.from("1000000").mul(10000000));
    }

    const poolInfoContract = await ethers.getContractAt("PoolInfoUtils", poolInfo.address);
    const poolContract = await ethers.getContractAt("ERC20Pool", poolAddress);

    // setup allowances
    const allowance = ethers.utils.parseEther("10000000000000");
    await usdc.connect(lender).approve(poolContract.address, allowance);
    await wbtc.connect(borrower).approve(poolContract.address, allowance);
    await usdc.connect(borrower).approve(poolContract.address, allowance);

    return {
      deployer,
      lender,
      borrower,
      poolContract,
      wbtcUsdcPool,
      usdc,
      wbtc,

      poolInfoContract,
    };
  }

  describe("wbtc usdc pool", function () {
    it("direct AJNA interaction - lend tokens", async () => {
      const { lender, usdc, poolContract } = await loadFixture(deploy);
      const balancesBefore = {
        lender: await usdc.balanceOf(lender.address),
        pool: await usdc.balanceOf(poolContract.address),
      };
      const blockNumber = await ethers.provider.getBlockNumber();
      const timestamp = (await ethers.provider.getBlock(blockNumber)).timestamp;
      const tx = await poolContract
        .connect(lender)
        .addQuoteToken(ethers.utils.parseUnits("1000", 18), 2000, timestamp + 1000000);
      await tx.wait();
      const balancesAfter = {
        lender: await usdc.balanceOf(lender.address),
        pool: await usdc.balanceOf(poolContract.address),
      };
      expect(balancesBefore.lender).to.not.equal(balancesAfter.lender);
      expect(balancesBefore.pool).to.not.equal(balancesAfter.pool);
    });
    it("direct AJNA interaction - lend tokens and remove them", async () => {
      // TODO: check amounts
      const { lender, usdc, poolContract } = await loadFixture(deploy);
      const balancesBefore = {
        lender: await usdc.balanceOf(lender.address),
        pool: await usdc.balanceOf(poolContract.address),
      };
      const blockNumber = await ethers.provider.getBlockNumber();
      const timestamp = (await ethers.provider.getBlock(blockNumber)).timestamp;

      const tx = await poolContract
        .connect(lender)
        .addQuoteToken(ethers.utils.parseUnits("10000", 18), 2000, timestamp + 1000000);
      await tx.wait();
      await hre.network.provider.send("evm_increaseTime", ["0x8AC7230489E80000"]);
      await (await poolContract.connect(lender).removeQuoteToken(ethers.utils.parseUnits("10000", 18), 2000)).wait();

      const balancesAfter = {
        lender: (await usdc.balanceOf(lender.address)).toString(),
        pool: (await usdc.balanceOf(poolContract.address)).toString(),
      };

      expect(balancesBefore.lender).to.be.equal(balancesAfter.lender);
      expect(balancesBefore.pool).to.be.equal(balancesAfter.pool);
    });

    it("direct AJNA interaction - borrow tokens", async () => {
      const { lender, borrower, usdc, poolContract, wbtc } = await loadFixture(deploy);

      const balancesQuoteBefore = {
        lender: await usdc.balanceOf(lender.address),
        pool: await usdc.balanceOf(poolContract.address),
      };
      const balancesCollateralBefore = {
        borrower: await wbtc.balanceOf(borrower.address),
        pool: await wbtc.balanceOf(poolContract.address),
      };

      const expiry = await getExpiryTimestamp();

      // add 1000 USDC to the pool
      const tx = await poolContract.connect(lender).addQuoteToken(ethers.utils.parseUnits("1000", 18), 2000, expiry);
      await tx.wait();

      // borrow 100 USDC and add 1 WBTC as collateral
      const tx2 = await poolContract
        .connect(borrower)
        .drawDebt(borrower.address, ethers.utils.parseUnits("100", 18), 5000, ethers.utils.parseUnits("1", 18));
      await tx2.wait();

      const balancesQuoteAfter = {
        lender: await usdc.balanceOf(lender.address),
        pool: await usdc.balanceOf(poolContract.address),
      };
      const balancesCollateralAfter = {
        borrower: await wbtc.balanceOf(borrower.address),
        pool: await wbtc.balanceOf(poolContract.address),
      };

      expect(balancesQuoteAfter.lender).to.be.equal(balancesQuoteBefore.lender.sub(ethers.utils.parseUnits("1000", 6)));
      expect(balancesQuoteAfter.pool).to.be.equal(
        balancesQuoteBefore.pool.add(ethers.utils.parseUnits("1000", 6)).sub(ethers.utils.parseUnits("100", 6))
      );
      expect(balancesCollateralAfter.borrower).to.be.equal(
        balancesCollateralBefore.borrower.sub(ethers.utils.parseUnits("1", 8))
      );
      expect(balancesCollateralAfter.pool).to.be.equal(
        balancesCollateralBefore.pool.add(ethers.utils.parseUnits("1", 8))
      );
    });

    it("direct AJNA interaction - borrow tokens - repay loan", async () => {
      const { lender, borrower, usdc, poolContract, wbtc, poolInfoContract } = await loadFixture(deploy);
      /*
        
        it's goerli ... 
        
        const price = await oracle.latestAnswer(); */
      // chianlink
      const price = ethers.utils.parseUnits("16821.27311214", 8);
      // chainlink price is 8 decimals, we need 18
      const bucketIndex = await poolInfoContract.priceToIndex(price.mul(ethers.utils.parseUnits("1", 10)));
      const balancesQuoteBefore = {
        lender: await usdc.balanceOf(lender.address),
        borrower: await usdc.balanceOf(borrower.address),
        pool: await usdc.balanceOf(poolContract.address),
      };
      const balancesCollateralBefore = {
        borrower: await wbtc.balanceOf(borrower.address),
        pool: await wbtc.balanceOf(poolContract.address),
      };
      const expiry = await getExpiryTimestamp();
      // add 1000 USDC to the pool
      const lendTx = await poolContract
        .connect(lender)
        .addQuoteToken(ethers.utils.parseUnits("1000", 18), 2000, expiry);
      await lendTx.wait();

      // borrow 100 USDC and add 1 WBTC as collateral
      await (
        await poolContract
          .connect(borrower)
          .drawDebt(borrower.address, ethers.utils.parseUnits("100", 18), bucketIndex, ethers.utils.parseUnits("1", 18))
      ).wait();
      // console.log(borrowTxRes.logs)
      const borrowerInfo = await poolInfoContract.borrowerInfo(poolContract.address, borrower.address);

      const repayTx = await poolContract
        .connect(borrower)
        .repayDebt(
          borrower.address,
          borrowerInfo.debt_.mul(101).div(100),
          ethers.utils.parseUnits("1", 18),
          borrower.address,
          0
        );
      await repayTx.wait();

      const balancesQuoteAfter = {
        lender: await usdc.balanceOf(lender.address),
        borrower: await usdc.balanceOf(borrower.address),
        pool: await usdc.balanceOf(poolContract.address),
      };
      const balancesCollateralAfter = {
        borrower: await wbtc.balanceOf(borrower.address),
        pool: await wbtc.balanceOf(poolContract.address),
      };
      const borrowerInfoAfter = await poolInfoContract.borrowerInfo(poolContract.address, borrower.address);

      expect(borrowerInfoAfter.debt_).to.be.equal(ethers.BigNumber.from(0));
      expect(borrowerInfoAfter.collateral_).to.be.equal(ethers.BigNumber.from(0));
      expect(balancesCollateralAfter.borrower).to.be.equal(balancesCollateralBefore.borrower);
      expect(balancesQuoteAfter.borrower).to.be.lessThan(balancesQuoteBefore.borrower);
    });
    it("direct AJNA interaction - borrow tokens - repay loan - oracle price", async () => {
      const { lender, borrower, usdc, poolContract, wbtc, poolInfoContract } = await loadFixture(deploy);
      /*
      
      it's goerli ... 
      
      const price = await oracle.latestAnswer(); */
      // chianlink
      const price = ethers.utils.parseUnits("16821.27311214", 8);
      // chainlink price is 8 decimals, we need 18
      const bucketIndex = await poolInfoContract.priceToIndex(price.mul(ethers.utils.parseUnits("1", 10)));

      const balancesQuoteBefore = {
        lender: await usdc.balanceOf(lender.address),
        borrower: await usdc.balanceOf(borrower.address),
        pool: await usdc.balanceOf(poolContract.address),
      };
      const balancesCollateralBefore = {
        borrower: await wbtc.balanceOf(borrower.address),
        pool: await wbtc.balanceOf(poolContract.address),
      };
      const expiry = await getExpiryTimestamp();
      // add 1000 USDC to the pool
      const lendTx = await poolContract
        .connect(lender)
        .addQuoteToken(ethers.utils.parseUnits("1000", 18), 2000, expiry);
      await lendTx.wait();

      // borrow 100 USDC and add 1 WBTC as collateral
      await (
        await poolContract
          .connect(borrower)
          .drawDebt(borrower.address, ethers.utils.parseUnits("100", 18), bucketIndex, ethers.utils.parseUnits("1", 18))
      ).wait();
      // console.log(borrowTxRes.logs)
      const borrowerInfo = await poolInfoContract.borrowerInfo(poolContract.address, borrower.address);

      const repayTx = await poolContract
        .connect(borrower)
        .repayDebt(
          borrower.address,
          borrowerInfo.debt_.mul(101).div(100),
          ethers.utils.parseUnits("1", 18),
          borrower.address,
          0
        );
      await repayTx.wait();

      const balancesQuoteAfter = {
        lender: await usdc.balanceOf(lender.address),
        borrower: await usdc.balanceOf(borrower.address),
        pool: await usdc.balanceOf(poolContract.address),
      };
      const balancesCollateralAfter = {
        borrower: await wbtc.balanceOf(borrower.address),
        pool: await wbtc.balanceOf(poolContract.address),
      };
      const borrowerInfoAfter = await poolInfoContract.borrowerInfo(poolContract.address, borrower.address);

      expect(borrowerInfoAfter.debt_).to.be.equal(ethers.BigNumber.from(0));
      expect(borrowerInfoAfter.collateral_).to.be.equal(ethers.BigNumber.from(0));
      expect(balancesCollateralAfter.borrower).to.be.equal(balancesCollateralBefore.borrower);
      expect(balancesQuoteAfter.borrower).to.be.lessThan(balancesQuoteBefore.borrower);
    });
  });
});
async function getExpiryTimestamp() {
  const blockNumber = await ethers.provider.getBlockNumber();
  const timestamp = (await ethers.provider.getBlock(blockNumber)).timestamp;

  return timestamp + 130000;
}
