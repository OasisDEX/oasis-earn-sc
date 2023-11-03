import { prepareEnv } from "@ajna-contracts/scripts";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

type DeployEnv = Awaited<ReturnType<typeof prepareEnv>>;

describe.skip("Exploration", function () {
  let env: DeployEnv;

  describe.skip("With liquidity in pool", async () => {
    before(async () => {
      env = await loadFixture(prepareEnv);
      // Providing USDC as liquidity
      await env.provideLiquidity(
        env.pools.wbtcUsdcPool,
        BigNumber.from(30000),
        await env.ajnaProxyActionsContract.convertPriceToIndex(ethers.utils.parseUnits("15000", 18)) // price with 18 decimals
      );
      await env.provideLiquidity(
        env.pools.wbtcUsdcPool,
        BigNumber.from(20000),
        await env.ajnaProxyActionsContract.convertPriceToIndex(ethers.utils.parseUnits("14000", 18)) // price with 18 decimals
      );
      await env.provideLiquidity(
        env.pools.wbtcUsdcPool,
        BigNumber.from(10000),
        await env.ajnaProxyActionsContract.convertPriceToIndex(ethers.utils.parseUnits("10000", 18)) // price with 18 decimals
      );
      await env.moveLiquidity(
        env.pools.wbtcUsdcPool,
        BigNumber.from(10000),
        await env.ajnaProxyActionsContract.convertPriceToIndex(ethers.utils.parseUnits("10000", 18)),
        await env.ajnaProxyActionsContract.convertPriceToIndex(ethers.utils.parseUnits("12000", 18)) // price with 18 decimals
      );
      await env.provideLiquidity(
        env.pools.wbtcUsdcPool,
        BigNumber.from(1000),
        await env.ajnaProxyActionsContract.convertPriceToIndex(ethers.utils.parseUnits("500000", 18)) // price with 18 decimals
      );

      await env.provideLiquidity(
        env.pools.wbtcUsdcPool,
        BigNumber.from(55_100),
        await env.ajnaProxyActionsContract.convertPriceToIndex(ethers.utils.parseUnits("17000", 18)) // price with 18 decimals
      );
      await env.provideLiquidity(
        env.pools.wbtcUsdcPool,
        BigNumber.from(30000),
        await env.ajnaProxyActionsContract.convertPriceToIndex(ethers.utils.parseUnits("16000", 18)) // price with 18 decimals
      );
      await env.provideLiquidity(
        env.pools.wbtcUsdcPool,
        BigNumber.from(50000),
        await env.ajnaProxyActionsContract.convertPriceToIndex(ethers.utils.parseUnits("20000", 18)) // price with 18 decimals
      );
      await env.provideLiquidity(
        env.pools.wethUsdcPool,
        BigNumber.from(500000),
        await env.ajnaProxyActionsContract.convertPriceToIndex(ethers.utils.parseUnits("2000", 18)) // price with 18 decimals
      );
      await env.provideLiquidity(
        env.pools.wethUsdcPool,
        BigNumber.from(500000),
        await env.ajnaProxyActionsContract.convertPriceToIndex(ethers.utils.parseUnits("2100", 18)) // price with 18 decimals
      );
      await env.provideLiquidity(
        env.pools.wethUsdcPool,
        BigNumber.from(100000),
        await env.ajnaProxyActionsContract.convertPriceToIndex(ethers.utils.parseUnits("1900", 18)) // price with 18 decimals
      );
      await env.removeLiquidity(
        env.pools.wbtcUsdcPool,
        BigNumber.from(100),
        await env.ajnaProxyActionsContract.convertPriceToIndex(ethers.utils.parseUnits("20000", 18)) // price with 18 decimals
      );
      // ugly code to emit all staking events
      const lender = env.users[0].signer;
      const lenderAddress = await env.users[0].signer.getAddress();
      const expiryTimestamp = await env.getExpiryTimestamp();
      await env.usdc.connect(lender).approve(env.pools.wbtcUsdcPool.address, ethers.utils.parseUnits("10000000", 18));
      await env.pools.wbtcUsdcPool
        .connect(lender)
        .addQuoteToken(ethers.utils.parseUnits("10000000", 18), 2000, expiryTimestamp, false);
      await env.positionManagerContract
        .connect(env.users[0].signer)
        .mint(
          env.pools.wbtcUsdcPool.address,
          lenderAddress,
          ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ERC20_NON_SUBSET_HASH"))
        );

      const lpCount = await env.pools.wbtcUsdcPool.lenderInfo(2000, lenderAddress);
      await env.pools.wbtcUsdcPool
        .connect(lender)
        .increaseLPAllowance(env.positionManagerContract.address, [2000], [lpCount.lpBalance_]);
      await env.positionManagerContract.connect(lender).memorializePositions(env.pools.wbtcUsdcPool.address, 1, [2000]);
      await env.positionManagerContract.connect(lender).approve(env.rewardsManagerContract.address, 1);
      await env.rewardsManagerContract.connect(lender).stake(1);
      // end of ugly code
    });

    it("Exploration", async () => {
      await env.openPosition(
        env.weth,
        env.usdc,
        env.pools.wethUsdcPool,
        BigNumber.from(200),
        BigNumber.from(100000),
        ethers.utils.parseUnits("1900", 18),
        env.users[9]
      );
      await env.openPosition(
        env.weth,
        env.usdc,
        env.pools.wethUsdcPool,
        BigNumber.from(200),
        BigNumber.from(100000),
        ethers.utils.parseUnits("1900", 18),
        env.users[8]
      );

      await env.printBuckets("BUCKETS empty");
      await env.depositCollateralAndDrawQuote(
        env.wbtc,
        env.usdc,
        env.pools.wbtcUsdcPool,
        BigNumber.from(6),
        BigNumber.from(86000),
        ethers.utils.parseUnits("15000", 18),
        env.users[9]
      ); // TP 17000
      await env.depositCollateralAndDrawQuote(
        env.wbtc,
        env.usdc,
        env.pools.wbtcUsdcPool,
        BigNumber.from(5),
        BigNumber.from(42000),
        ethers.utils.parseUnits("14000", 18)
      ); // TP 14000
      await env.depositCollateralAndDrawQuote(
        env.wbtc,
        env.usdc,
        env.pools.wbtcUsdcPool,
        BigNumber.from(2),
        BigNumber.from(10000),
        ethers.utils.parseUnits("10000", 18),
        env.users[6]
      ); // TP 5000
      await env.depositCollateralAndDrawQuote(
        env.wbtc,
        env.usdc,
        env.pools.wbtcUsdcPool,
        BigNumber.from(1),
        BigNumber.from(500),
        ethers.utils.parseUnits("1100", 18),
        env.users[7]
      ); // TP 500
      await env.depositCollateralAndDrawQuote(
        env.wbtc,
        env.usdc,
        env.pools.wbtcUsdcPool,
        BigNumber.from(10),
        BigNumber.from(10000),
        ethers.utils.parseUnits("10000", 18),
        env.users[8]
      ); // TP 1000
      // await env.printBuckets("WBTC-USDC", env.pools.wbtcUsdcPool);
      await env.printBuckets("WETH-USDC", env.pools.wethUsdcPool);

      await env.withdrawCollateralAndRepayQuote(
        env.wbtc,
        env.usdc,
        env.pools.wbtcUsdcPool,
        BigNumber.from(1),
        BigNumber.from(100)
      );

      env.printAddresses();

      expect(true).to.eq(true);
    });
  });
});
