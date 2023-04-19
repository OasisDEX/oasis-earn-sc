import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatUtils } from "../scripts/common/hardhat.utils";
import { BigNumber } from "ethers";

const AJNA = "0x347fcea8b4fd1a46e2c0db8f79e22d293c2f8513";
const USDC = "0x6Fb5ef893d44F4f88026430d82d4ef269543cB23";
const WBTC = "0x7ccF0411c7932B99FC3704d68575250F032e3bB7";
const WBTC_USDC_POOL = "0x0BDE5e31af1a88113158Fb577cB3C61Df9843afE";
const utils = new HardhatUtils(hre);
let hash = "";
const usePredeployed: boolean = false;

describe.skip("AJNA - drain test", function () {
  async function deploy() {
    await hre.network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: process.env.ALCHEMY_NODE_GOERLI!,
            blockNumber: 8145848,
          },
        },
      ],
    });
    const [deployer, lender, borrower, otherLender] =
      await hre.ethers.getSigners();

    let addresses: { [key: string]: string } = {};

    addresses.deployerAddress = await deployer.getAddress();
    addresses.lenderAddress = await lender.getAddress();
    addresses.borrowerAddress = await borrower.getAddress();
    addresses.otherLenderAddress = await otherLender.getAddress();

    const ajna = await ethers.getContractAt("DSToken", AJNA);
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

    const ERC20PoolFactory = await ethers.getContractFactory(
      "ERC20PoolFactory",
      {
        libraries: {
          PoolCommons: poolInstance.address,
          Auctions: auctionsInstance.address,
          LenderActions: actionsInstance.address,
          BorrowerActions: borrowerActionsInstance.address,
        },
      }
    );

    let poolAddress;

    if (usePredeployed == false) {
      const erc20PoolFactory = await ERC20PoolFactory.deploy(AJNA, {
        gasLimit: 10000000,
      });
      hash = await erc20PoolFactory.ERC20_NON_SUBSET_HASH();

      const pool = (
        await erc20PoolFactory.deployPool(USDC, WBTC, "50000000000000000", {
          gasLimit: 10000000,
        })
      ).wait();

      poolAddress = await erc20PoolFactory.deployedPools(hash, USDC, WBTC);
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
      await utils.setTokenBalance(
        addresses[address],
        WBTC,
        BigNumber.from("1000000000000000000").mul(1000)
      );
      await utils.setTokenBalance(
        addresses[address],
        USDC,
        BigNumber.from("1000000000000000000").mul(1000)
      );
    }

    const poolInfoContract = await ethers.getContractAt(
      "PoolInfoUtils",
      poolInfo.address
    );
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
      otherLender,
      wbtcUsdcPool,
      usdc,
      wbtc,

      poolInfoContract,
    };
  }

  describe("wbtc usdc pool", function () {
    it("direct AJNA interaction - lend tokens", async () => {
      const { lender, otherLender, wbtc, poolContract, poolInfoContract } =
        await loadFixture(deploy);
      const balancesBefore = {
        lender: (await wbtc.balanceOf(lender.address)).toString(),
        otherLender: (await wbtc.balanceOf(otherLender.address)).toString(),
        pool: (await wbtc.balanceOf(poolContract.address)).toString(),
      };
      console.table(balancesBefore);
      await wbtc
        .connect(otherLender)
        .approve(poolContract.address, ethers.utils.parseUnits("1", 18));
      await poolContract
        .connect(otherLender)
        .addQuoteToken(ethers.utils.parseUnits("1", 18), 2000);
      for (let i = 0; i < 2; i++) {
        const tx = await poolContract
          .connect(lender)
          .addQuoteToken(ethers.utils.parseUnits("9", 9), 2000);
        const txRes = await tx.wait();
        console.log(txRes.gasUsed.toString());
      }
      const balancesAfterFakeDeposit = {
        lender: (await wbtc.balanceOf(lender.address)).toString(),
        otherLender: (await wbtc.balanceOf(otherLender.address)).toString(),
        pool: (await wbtc.balanceOf(poolContract.address)).toString(),
      };
      console.table(balancesAfterFakeDeposit);
      const tx = poolContract
        .connect(lender)
        .removeQuoteToken(ethers.utils.parseUnits("9", 9).mul(100000), 2000);
      await expect(tx).to.be.reverted;
    });
  });
});
