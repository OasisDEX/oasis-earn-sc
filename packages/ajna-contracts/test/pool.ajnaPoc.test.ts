import { HardhatUtils } from "@ajna-contracts/scripts";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import hre, { ethers } from "hardhat";

import { AjnaPoc, IERC20 } from "../typechain-types";

const AJNA = "0x347fcea8b4fd1a46e2c0db8f79e22d293c2f8513";
const USDC = "0x6Fb5ef893d44F4f88026430d82d4ef269543cB23";
const WBTC = "0x7ccF0411c7932B99FC3704d68575250F032e3bB7";
const WBTC_USDC_POOL = "0x0BDE5e31af1a88113158Fb577cB3C61Df9843afE";
const utils = new HardhatUtils(hre);
let hash = "";
const usePredeployed = false;

let otherSupplier: AjnaPoc;

let WBTCToken: IERC20;
let USDCToken: IERC20;

async function sendLotsOfMoney(target: string) {
  await utils.setTokenBalance(target, WBTC, BigNumber.from("100000000").mul(1000));
  await utils.setTokenBalance(target, USDC, BigNumber.from("1000000").mul(10000000));
}

describe.skip("Pool test", function () {
  async function deploy() {
    const [owner, otherAccount] = await hre.ethers.getSigners();
    const ownerAddress = await owner.getAddress();
    console.log("owner address", ownerAddress);

    await sendLotsOfMoney(ownerAddress);

    const usdc = await ethers.getContractAt("DSToken", USDC);
    const wbtc = await ethers.getContractAt("DSToken", WBTC);

    const wbtcUsdcPool = await ethers.getContractAt("IPool", WBTC_USDC_POOL);
    WBTCToken = await ethers.getContractAt("IERC20", WBTC);
    USDCToken = await ethers.getContractAt("IERC20", USDC);

    console.log("deploying libraries");

    const Auctions = await ethers.getContractFactory("Auctions");
    const auctionsInstance = await Auctions.deploy();
    const BorrowerActions = await ethers.getContractFactory("BorrowerActions");
    const borrowerActionsInstance = await BorrowerActions.deploy();
    const LenderAction = await ethers.getContractFactory("LenderActions");
    const actionsInstance = await LenderAction.deploy();

    const PoolCommons = await ethers.getContractFactory("PoolCommons");
    const poolInstance = await PoolCommons.deploy();

    console.log("libraries deployed");

    const ERC20PoolFactory = await ethers.getContractFactory("ERC20PoolFactory", {
      libraries: {
        PoolCommons: poolInstance.address,
        Auctions: auctionsInstance.address,
        LenderActions: actionsInstance.address,
        BorrowerActions: borrowerActionsInstance.address,
      },
    });

    let poolAddress = "";
    if (usePredeployed == false) {
      console.log("deploying pool factory");
      const erc20PoolFactory = await ERC20PoolFactory.deploy(AJNA, {
        gasLimit: 10000000,
      });
      hash = await erc20PoolFactory.ERC20_NON_SUBSET_HASH();
      console.log("searching pool");

      poolAddress = await erc20PoolFactory.deployedPools(hash, WBTC, USDC);
      console.log("address used", poolAddress);
    } else {
      console.log("using predeployed pool");
      poolAddress = WBTC_USDC_POOL;
      console.log("address used", poolAddress);
    }

    console.log("deploying ajnaPoc");
    const AjnaPoc = await ethers.getContractFactory("AjnaPoc", {
      libraries: {
        PoolCommons: poolInstance.address,
      },
    });
    const ajnaPoc = await AjnaPoc.deploy(WBTC, USDC, poolAddress);
    const x = await ajnaPoc.deployed();
    otherSupplier = await (await AjnaPoc.deploy(WBTC, USDC, poolAddress)).deployed();

    console.log("ajnaPoc deployed");

    await sendLotsOfMoney(x.address);

    await sendLotsOfMoney(otherSupplier.address);

    console.log("supplying liquidity");
    /*     await otherSupplier.supplyQuote(ethers.utils.parseUnits("1000", 18), 0, {
      gasLimit: 5000000,
    }); */
    //convertPriceToIndex is oversimplified for now, return 0 index for 0 price and last index for any other price
    //so as far as I understand this two lines should add liquidity one for almost free and second at absurd price
    // so I expect borrowing under 10000000000 should work and borrowing over 10000000000 should fail
    await otherSupplier.supplyQuote(ethers.utils.parseUnits("1000", 18), 2000000, {
      gasLimit: 5000000,
    });
    await otherSupplier.supplyQuote(ethers.utils.parseUnits("1000", 18), 200000, {
      gasLimit: 5000000,
    });
    console.log("supplying liquidity done");

    return {
      owner,
      otherAccount,
      wbtcUsdcPool,
      usdc,
      wbtc,
      ajnaPoc,
      otherSupplier,
    };
  }

  describe("wbtc usdc pool", function () {
    it("should not revert while depositing collateral", async () => {
      const { ajnaPoc } = await loadFixture(deploy);

      const balanceBefore = await WBTCToken.balanceOf(ajnaPoc.address);

      const tx = await ajnaPoc.depositCollateral(ethers.utils.parseUnits("1", 18), 5000, { gasLimit: 5000000 });
      await tx.wait();

      const balanceAfter = await WBTCToken.balanceOf(ajnaPoc.address);

      expect(balanceBefore.sub(balanceAfter).toNumber()).to.be.eq(ethers.utils.parseUnits("1", 8));
    });

    it("should not revert while opening", async () => {
      const { ajnaPoc } = await loadFixture(deploy);

      const balanceBefore = await WBTCToken.balanceOf(ajnaPoc.address);
      const balanceQuoteBefore = await USDCToken.balanceOf(ajnaPoc.address);
      const tx = await ajnaPoc.openAndDraw(
        ethers.utils.parseUnits("100", 18),
        ethers.utils.parseUnits("10", 18),
        5000,
        { gasLimit: 5000000 }
      );
      await tx.wait();

      const balanceAfter = await WBTCToken.balanceOf(ajnaPoc.address);
      const balanceQuoteAfter = await USDCToken.balanceOf(ajnaPoc.address);
      expect(balanceBefore.sub(balanceAfter).toNumber()).to.be.eq(1000000000);
      expect(balanceQuoteAfter.sub(balanceQuoteBefore).toNumber()).to.be.eq(100000000);
    });
  });

  describe("borrowing", function () {
    it("should not revert while borrowing", async () => {
      const { ajnaPoc } = await loadFixture(deploy);
      const bucketIndex = await ajnaPoc.convertPriceToIndex(1000);
      const bucketIndex2 = await ajnaPoc.convertPriceToIndex(10000);
      const bucketIndex3 = await ajnaPoc.convertPriceToIndex(100000);

      console.log("bucketIndex", bucketIndex.toNumber());
      console.log("bucketIndex", bucketIndex2.toNumber());
      console.log("bucketIndex", bucketIndex3.toNumber());
    });
  });
});
