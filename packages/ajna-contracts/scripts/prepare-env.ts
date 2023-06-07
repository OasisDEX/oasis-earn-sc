import {
  DAY,
  deploy,
  depositCollateralAndDrawQuote,
  HardhatUtils,
  openPosition,
  provideLiquidity,
  User,
  WEEK,
  withdrawCollateralAndRepayQuote,
  YEAR,
} from "@ajna-contracts/scripts";
import { AccountFactory, ERC20Pool, IAccountImplementation, Token, WETH } from "@ajna-contracts/typechain";
import { BigNumber, Signer } from "ethers";
import hre from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types/runtime";
// @ts-ignore
import ploty_ from "plotly";

const plotly =
  process.env.PLOTY_KEY && process.env.PLOTY_USER ? ploty_(process.env.PLOTY_USER, process.env.PLOTY_KEY) : undefined;

const utils = new HardhatUtils(hre);

interface Bucket {
  price: BigNumber;
  index: BigNumber;
  quoteTokens: BigNumber;
  collateral: BigNumber;
  bucketLPs: BigNumber;
}
interface AjnaPool {
  poolAddress: string;
  quoteToken: string;
  collateralToken: string;

  //@deprecated use lowestUtilizedPrice
  lup: BigNumber;
  lowestUtilizedPrice: BigNumber;
  lowestUtilizedPriceIndex: BigNumber;

  //@deprecated use highestThresholdPrice
  htp: BigNumber;
  highestThresholdPrice: BigNumber;
  highestThresholdPriceIndex: BigNumber;

  highestPriceBucket: BigNumber;
  highestPriceBucketIndex: BigNumber;

  mostOptimisticMatchingPrice: BigNumber;

  poolMinDebtAmount: BigNumber;
  poolCollateralization: BigNumber;
  poolActualUtilization: BigNumber;
  poolTargetUtilization: BigNumber;

  // annualized rate as a fraction 0.05 = 5%
  interestRate: BigNumber;
  debt: BigNumber;
  depositSize: BigNumber;
  apr30dAverage: BigNumber;
  dailyPercentageRate30dAverage: BigNumber;
  monthlyPercentageRate30dAverage: BigNumber;
  currentBurnEpoch: BigNumber;
  buckets: Bucket[];
  pendingInflator: BigNumber;
}

export const ajnaHre = hre;
export async function createDPMProxy(dmpFactory: AccountFactory, owner: Signer) {
  const accountTx = await dmpFactory.connect(owner)["createAccount()"]();
  const factoryReceipt = await accountTx.wait();
  const [AccountCreatedEvent] = utils.getEvents(factoryReceipt, dmpFactory.interface.getEvent("AccountCreated"));
  const proxyAddress = AccountCreatedEvent.args.proxy.toString();
  const dpmProxy = utils.getContract<IAccountImplementation>("IAccountImplementation", proxyAddress);
  return dpmProxy;
}

export async function prepareEnv(_hre?: HardhatRuntimeEnvironment, mainnetTokens = false) {
  const hre = _hre ? _hre : await import("hardhat");
  const ethers = hre.ethers;
  const signers = await ethers.getSigners();
  const [deployer, lender, borrower] = signers;

  const {
    erc20PoolFactory,
    erc721PoolFactory,
    ajnaProxyActionsContract,
    poolInfoContract,
    usdc,
    wbtc,
    weth,
    ajna,
    dmpFactory,
    guardDeployerSigner,
    dmpGuardContract,
    pools,
    positionManagerContract,
    rewardsManagerContract,
  } = await deploy(mainnetTokens, hre);

  const poolByAddress = Object.entries(pools).reduce(
    (acc, [, pool]) => ({ ...acc, [pool.address]: pool }),
    {} as Record<string, ERC20Pool>
  );

  await Promise.all([
    // Have some issues with setting balance on mainnet USDC contract
    ...(mainnetTokens ? [] : signers.map(signer => utils.sendLotsOfMoney(signer.address, usdc, mainnetTokens))),
    ...signers.map(signer => utils.sendLotsOfMoney(signer.address, wbtc, mainnetTokens)),
    ...signers.map(signer => utils.sendLotsOfMoney(signer.address, weth, mainnetTokens)),
  ]);

  const dmpProxies = await Promise.all(signers.map(signer => createDPMProxy(dmpFactory, signer)));
  const users: User[] = signers.map((signer, index) => ({
    signer,
    proxy: dmpProxies[index],
  }));
  const lenderProxy = users[1].proxy;
  const borrowerProxy = users[2].proxy;

  async function getLenderInfo(index: BigNumber, lenderAddress: string = lender.address) {
    const lenderInfo = await pools.wbtcUsdcPool.lenderInfo(index, lenderAddress);

    return {
      lenderInfo,
    };
  }

  async function getBorrowerInfo(user: User, pool: ERC20Pool = pools.wbtcUsdcPool) {
    return await poolInfoContract.borrowerInfo(pool.address, user.proxy.address);
  }

  async function getParams(pool: ERC20Pool = pools.wbtcUsdcPool) {
    const borrowerInfo = await poolInfoContract.borrowerInfo(pool.address, borrowerProxy.address);
    const hpb = await poolInfoContract.hpb(pool.address);
    const hpbIndex = await poolInfoContract.hpbIndex(pool.address);
    const htp = await poolInfoContract.htp(pool.address);
    let momp = BigNumber.from(0);
    let htpIndex = BigNumber.from(0);
    try {
      htpIndex = await poolInfoContract.priceToIndex(htp);
    } catch (e) {
      console.error("htp not found", e);
    }
    try {
      momp = await poolInfoContract.momp(pool.address);
    } catch (e) {
      console.error("momp not found", e);
    }
    const lenderInterestMargin = await poolInfoContract.lenderInterestMargin(pool.address);
    const lup = await poolInfoContract.lup(pool.address);
    const lupIndex = await poolInfoContract.lupIndex(pool.address);
    const poolLoansInfo = await poolInfoContract.poolLoansInfo(pool.address);
    const poolPricesInfo = await poolInfoContract.poolPricesInfo(pool.address);
    const poolReservesInfo = await poolInfoContract.poolReservesInfo(pool.address);
    const poolUtilizationInfo = await poolInfoContract.poolUtilizationInfo(pool.address);
    const [debt, accruedDebt, debtInAuctions] = await pool.debtInfo();

    const params = {
      hpb,
      hpbIndex,
      htp,
      htpIndex,
      lenderInterestMargin,
      lup,
      lupIndex,
      momp,
    };

    return {
      borrowerInfo,
      poolLoansInfo,
      poolPricesInfo,
      poolReservesInfo,
      poolUtilizationInfo,
      erc20PoolFactory,
      balances: {
        lender: {
          eth: await lender.getBalance(),

          usdc: await usdc.balanceOf(lender.address),
          wbtc: await wbtc.balanceOf(lender.address),
        },
        borrower: {
          eth: await lender.getBalance(),
          usdc: await usdc.balanceOf(borrower.address),
          wbtc: await wbtc.balanceOf(borrower.address),
        },
      },
      debtInfo: {
        debt,
        debtInAuctions,
        accruedDebt,
      },
      ...params,
    };
  }

  async function timeTravel(time: number): Promise<void> {
    await hre.network.provider.send("evm_increaseTime", [BigNumber.from(time).toHexString()]);
  }

  const bucketsRepo: Record<string, Set<number>> = Object.values(pools).reduce(
    (acc, pool) => ({
      ...acc,
      [pool.address]: new Set<number>(),
    }),
    {}
  );
  async function provideLiquidity_(pool: ERC20Pool, amount: BigNumber, bucketIndex: BigNumber, user: User = users[1]) {
    await provideLiquidity(usdc, user.signer, pool, amount, bucketIndex, getExpiryTimestamp);
    bucketsRepo[pool.address].add(bucketIndex.toNumber());
  }
  async function removeLiquidity_(pool: ERC20Pool, amount: BigNumber, bucketIndex: BigNumber, user: User = users[1]) {
    const amountWei = ethers.utils.parseUnits(amount.toString(), 18);
    const tx = await pool.connect(user.signer).removeQuoteToken(amountWei, bucketIndex);
    await tx.wait();
  }

  async function getPoolData(poolAddress: string): Promise<AjnaPool> {
    const buckets = await getAllBucketsInfo(poolAddress);
    const pool = poolByAddress[poolAddress];
    const params = await getParams(pool);

    return {
      poolAddress: pool.address,
      quoteToken: await pool.quoteTokenAddress(),
      collateralToken: await pool.collateralAddress(),

      //@deprecated use lowestUtilizedPrice
      lup: params.lup,
      lowestUtilizedPrice: params.lup,
      lowestUtilizedPriceIndex: params.lupIndex,

      //@deprecated use highestThresholdPrice
      htp: params.htp,
      highestThresholdPrice: params.htp,
      highestThresholdPriceIndex: params.htpIndex,

      highestPriceBucket: params.hpb,
      highestPriceBucketIndex: params.hpbIndex,

      mostOptimisticMatchingPrice: params.momp,

      poolMinDebtAmount: params.poolUtilizationInfo.poolMinDebtAmount_,
      poolCollateralization: params.poolUtilizationInfo.poolCollateralization_,
      poolActualUtilization: params.poolUtilizationInfo.poolActualUtilization_,
      poolTargetUtilization: params.poolUtilizationInfo.poolTargetUtilization_,

      // annualized rate as a fraction 0.05 = 5%
      interestRate: params.poolLoansInfo.pendingInflator_,
      debt: BigNumber.from(0),
      depositSize: BigNumber.from(0),
      apr30dAverage: BigNumber.from(0),
      dailyPercentageRate30dAverage: BigNumber.from(0),
      monthlyPercentageRate30dAverage: BigNumber.from(0),
      currentBurnEpoch: BigNumber.from(0),
      buckets: Object.entries(buckets).map(([index, bucket]) => {
        return {
          price: bucket.price_,
          index: BigNumber.from(index),
          quoteTokens: bucket.quoteTokens_,
          collateral: bucket.collateral_,
          bucketLPs: bucket.bucketLP_,
        };
      }),
      pendingInflator: BigNumber.from(0),
    };
  }

  async function getBucketInfo(index: BigNumber, poolAddress: string = pools.wbtcUsdcPool.address.toLowerCase()) {
    const bucketInfo = await poolInfoContract.bucketInfo(poolAddress, index);

    return bucketInfo;
  }
  async function moveLiquidity_(
    pool: ERC20Pool,
    amount: BigNumber,
    fromBucketIndex: BigNumber,
    toBucketIndex: BigNumber,
    user: User = users[1]
  ) {
    const amountWei = ethers.utils.parseUnits(amount.toString(), 18);
    const expiry = await getExpiryTimestamp();
    const tx = await pool.connect(user.signer).moveQuoteToken(amountWei, fromBucketIndex, toBucketIndex, expiry);
    await tx.wait();
  }

  async function getAllBucketsInfo(
    poolAddress: string = pools.wbtcUsdcPool.address.toLowerCase()
  ): Promise<Record<string, Awaited<ReturnType<typeof getBucketInfo>>>> {
    const buckets = bucketsRepo[poolAddress];

    return (
      await Promise.all(Array.from(buckets).map(bucketIndex => getBucketInfo(BigNumber.from(bucketIndex), poolAddress)))
    ).reduce(
      (acc, bucketInfo, index) => ({
        ...acc,
        [Array.from(buckets)[index]]: bucketInfo,
      }),
      {}
    );
  }

  async function printBuckets(name: string, pool: ERC20Pool = pools.wbtcUsdcPool) {
    if (!plotly) {
      console.log("Create ploty account: https://chart-studio.plotly.com/");
      return;
    }
    const bucketsInfo = await getAllBucketsInfo(pool.address.toLowerCase());
    const params = await getParams(pool);

    let totalDebt = params.debtInfo.accruedDebt;
    const buckets = Object.values(bucketsInfo);

    const yUtilized: string[] = [];
    const yUnutilized: string[] = [];
    const yNotEarning: string[] = [];

    const x = Object.values(bucketsInfo).map(bucket => ethers.utils.formatUnits(bucket.price_, 18));

    buckets.forEach(bucket => {
      if (totalDebt.gt(0)) {
        if (totalDebt.gt(bucket.quoteTokens_)) {
          yUtilized.push(ethers.utils.formatUnits(bucket.quoteTokens_, 18));
          yUnutilized.push("0");
          yNotEarning.push("0");
          totalDebt = totalDebt.sub(bucket.quoteTokens_);
        } else {
          yUtilized.push(ethers.utils.formatUnits(totalDebt, 18));
          yUnutilized.push(ethers.utils.formatUnits(bucket.quoteTokens_.sub(totalDebt), 18));
          yNotEarning.push("0");
          totalDebt = BigNumber.from(0);
        }
      } else {
        yUtilized.push("0");
        if (bucket.price_.gte(params.htp)) {
          yNotEarning.push("0");
          yUnutilized.push(ethers.utils.formatUnits(bucket.quoteTokens_, 18));
        } else {
          yNotEarning.push(ethers.utils.formatUnits(bucket.quoteTokens_, 18));
          yUnutilized.push("0");
        }
      }
    });

    const data = [
      {
        x: x,
        y: yUtilized,
        type: "bar",
        name: "Utilized",
      },
      {
        x: x,
        y: yUnutilized,
        type: "bar",
        name: "Unutilized",
      },
      {
        x: x,
        y: yNotEarning,
        name: "Not earning",
        type: "bar",
      },
    ];

    const graphOptions = {
      filename: name,
      fileopt: "overwrite",
      layout: { barmode: "stack" },
    };
    return new Promise((resolve, reject) => {
      plotly.plot(data, graphOptions, function (err: any, msg: any) {
        if (err) {
          reject(err);
        }
        resolve(msg);
      });
    });
  }

  function printAddresses() {
    console.table({
      erc20PoolFactory: erc20PoolFactory.address,
      wbtcUsdcPool: pools.wbtcUsdcPool.address,
      wethUsdcPool: pools.wethUsdcPool.address,
      poolInfoContract: poolInfoContract.address,
      dmpFactory: dmpFactory.address,
      dmpGuardContract: dmpGuardContract.address,
      "lender - signer[1]": lender.address,
      lenderProxy: lenderProxy.address,
      "borrower - signer[2]": borrower.address,
      borrowerProxy: borrowerProxy.address,
      ajnaProxyActions: ajnaProxyActionsContract.address,
      positionManagerContract: positionManagerContract.address,
      rewardsManagerContract: rewardsManagerContract.address,
    });
  }
  async function getExpiryTimestamp() {
    const blockNumber = await ethers.provider.getBlockNumber();
    const timestamp = (await ethers.provider.getBlock(blockNumber)).timestamp;

    return timestamp + 130000;
  }

  console.log(`
    DEPLOYED AJNA CONTRACTS:
    ========================
    erc20PoolFactory: ${erc20PoolFactory.address}
    wbtcUsdcPool: ${pools.wbtcUsdcPool.address}
    wethUsdcPool: ${pools.wethUsdcPool.address}
    poolInfoContract: ${poolInfoContract.address}
    ajnaProxyActionsContract: ${ajnaProxyActionsContract.address}
    positionManagerContract: ${positionManagerContract.address}
    rewardsManagerContract: ${rewardsManagerContract.address}
    ========================
  `);

  return {
    times: {
      DAY,
      WEEK,
      YEAR,
    },
    erc20PoolFactory,
    getLenderInfo,
    timeTravel,
    getBucketInfo,
    users,
    poolContract: pools.wbtcUsdcPool,
    lender,
    borrower,
    deployer,
    dmpFactory,
    dmpGuardContract,
    guardDeployerSigner,
    borrowerProxy,
    lenderProxy,
    poolInfo: poolInfoContract,
    ajnaProxyActionsContract,
    usdc,
    wbtc,
    weth,
    ajna,
    getParams,
    provideLiquidity: provideLiquidity_,
    removeLiquidity: removeLiquidity_,
    moveLiquidity: moveLiquidity_,
    getAllBucketsInfo,
    getBorrowerInfo,
    printBuckets,
    printAddresses,
    getPoolData,
    pools,
    positionManagerContract,
    rewardsManagerContract,
    getExpiryTimestamp,
    provider: hre.ethers.provider,
    withdrawCollateralAndRepayQuote: async (
      collateralToken: Token,
      debtToken: Token,
      pool: ERC20Pool,
      collateralAmount: BigNumber,
      debtAmount: BigNumber,
      user: User = users[2]
    ) =>
      withdrawCollateralAndRepayQuote(
        ajnaProxyActionsContract,
        pool,
        debtToken,
        await collateralToken.decimals(),
        await debtToken.decimals(),
        user.proxy,
        user.signer,
        collateralAmount,
        debtAmount,
        poolInfoContract,
        hre.ethers.provider,
        weth.address
      ),
    depositCollateralAndDrawQuote: async (
      collateralToken: Token | WETH,
      debtToken: Token,
      pool: ERC20Pool,
      collateralAmount: BigNumber,
      debtAmount: BigNumber,
      price: BigNumber,
      user: User = users[2]
    ) =>
      depositCollateralAndDrawQuote(
        ajnaProxyActionsContract,
        pool,
        collateralToken,
        await collateralToken.decimals(),
        await debtToken.decimals(),
        user.proxy,
        user.signer,
        collateralAmount,
        debtAmount,
        price,
        poolInfoContract,
        hre.ethers.provider,
        weth
      ),
    openPosition: async (
      collateralToken: Token | WETH,
      debtToken: Token,
      pool: ERC20Pool,
      collateralAmount: BigNumber,
      debtAmount: BigNumber,
      price: BigNumber,
      user: User = users[2]
    ) =>
      openPosition(
        ajnaProxyActionsContract,
        pool,
        collateralToken,
        await collateralToken.decimals(),
        await debtToken.decimals(),
        user.proxy,
        user.signer,
        collateralAmount,
        debtAmount,
        price,
        poolInfoContract,
        hre.ethers.provider,
        weth
      ),
  };
}
