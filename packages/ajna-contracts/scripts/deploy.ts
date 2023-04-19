import hre from "hardhat";
import { Contract, Signer, BigNumber, providers } from "ethers";
import { ethers } from "hardhat";
import { HardhatUtils } from "./common/hardhat.utils";
import {
  ERC20Pool,
  ERC20PoolFactory,
  ERC721PoolFactory,
  IAccountImplementation,
  PoolCommons,
  PositionManager,
  PositionNFTSVG,
  RewardsManager,
  Token,
  WETH,
} from "../typechain-types";
import ploty_ from "plotly";
import { strategies, views } from "@oasisdex/oasis-actions";
import { BigNumber as BN } from "bignumber.js";

const plotly =
  process.env.PLOTY_KEY && process.env.PLOTY_USER ? ploty_(process.env.PLOTY_USER, process.env.PLOTY_KEY) : undefined;

const utils = new HardhatUtils(hre);

const DAY = 1000 * 60 * 60 * 24;
const WEEK = DAY * 7;
const YEAR = DAY * 365;

export async function deployLibraries() {
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

export async function createDPMProxy(dmpFactory: Contract, owner: Signer) {
  const accountTx = await dmpFactory.connect(owner)["createAccount()"]();
  const factoryReceipt = await accountTx.wait();
  const [AccountCreatedEvent] = utils.getEvents(factoryReceipt, dmpFactory.interface.getEvent("AccountCreated"));
  const proxyAddress = AccountCreatedEvent.args.proxy.toString();
  const lenderProxy = (await hre.ethers.getContractAt(
    "IAccountImplementation",
    proxyAddress
  )) as IAccountImplementation;
  return lenderProxy;
}

export async function deployRewardsContracts(
  positionNFTSVGInstance: PositionNFTSVG,
  erc20PoolFactory: ERC20PoolFactory,
  erc721PoolFactory: ERC721PoolFactory,
  ajna: Token
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
export async function deployApa(
  poolInstance: PoolCommons,
  rewardsManager: RewardsManager,
  positionManager: PositionManager,
  ajna: Token,
  dmpGuard: Contract,
  guardDeployer: Signer,
  weth: string
) {
  const PoolInfoUtils = await ethers.getContractFactory("PoolInfoUtils", {
    libraries: {
      PoolCommons: poolInstance.address,
    },
  });
  const { serviceRegistryContract } = await deployServiceRegistry();
  const poolInfo = await (await PoolInfoUtils.deploy()).deployed();

  const poolInfoContract = await ethers.getContractAt("PoolInfoUtils", poolInfo.address);

  const AjnaRewardClaimer = await ethers.getContractFactory("AjnaRewardClaimer", {});
  const arc = await AjnaRewardClaimer.deploy(rewardsManager.address, ajna.address, serviceRegistryContract.address);

  const AjnaProxyActions = await ethers.getContractFactory("AjnaProxyActions");
  const apa = await AjnaProxyActions.deploy(
    poolInfoContract.address,
    positionManager.address,
    rewardsManager.address,
    ajna.address,
    weth,
    arc.address,
    dmpGuard.address
  );

  await dmpGuard.connect(guardDeployer).setWhitelist(apa.address, true);

  return { apa, poolInfo, poolInfoContract };
}

function createOpenOrDeposit(fnName: "open" | "depositBorrow") {
  return async function (
    apa: Contract,
    poolContract: Contract,
    collateralToken: Contract,
    collateralPrecision: number,
    quotePrecision: number,
    borrowerProxy: Contract,
    borrower: Signer,
    collateralAmount: BigNumber,
    quoteAmount: BigNumber,
    price: BigNumber,
    poolInfoAddress: Contract,
    provider: providers.Provider,
    weth: WETH
  ) {
    const openStrategy = await strategies.ajna[fnName](
      {
        position: await views.ajna.getPosition(
          {
            proxyAddress: borrowerProxy.address,
            poolAddress: poolContract.address,
          },
          { poolInfoAddress: poolInfoAddress.address, provider }
        ),
        collateralAmount: new BN(collateralAmount.toString()),
        collateralTokenPrecision: collateralPrecision,
        quoteAmount: new BN(quoteAmount.toString()),
        quoteTokenPrecision: quotePrecision,
        dpmProxyAddress: borrowerProxy.address,
        poolAddress: poolContract.address,
        // @ts-ignore
        price: BigNumber.from(price.toString()),
      },
      {
        ajnaProxyActions: apa.address,
        poolInfoAddress: poolInfoAddress.address,
        provider,
        WETH: weth.address,
      }
    );

    await collateralToken
      .connect(borrower)
      .approve(borrowerProxy.address, ethers.utils.parseUnits(collateralAmount.toString(), collateralPrecision));
    const tx = await borrowerProxy.connect(borrower).execute(openStrategy.tx.to, openStrategy.tx.data, {
      gasLimit: 3000000,
      value: openStrategy.tx.value,
    });
    await tx.wait();
    return tx;
  };
}

export const openPosition = createOpenOrDeposit("open");

export const depositCollateralAndDrawQuote = createOpenOrDeposit("depositBorrow");

export async function withdrawCollateralAndRepayQuote(
  apa: Contract,
  poolContract: Contract,
  borrowToken: Contract,
  collateralPrecision: number,
  quotePrecision: number,
  borrowerProxy: Contract,
  borrower: Signer,
  collateralAmount: BigNumber,
  debtAmount: BigNumber,
  poolInfo: Contract,
  provider: providers.Provider,
  WETH: string
) {
  const withdrawStrategy = await strategies.ajna.paybackWithdraw(
    {
      position: await views.ajna.getPosition(
        {
          proxyAddress: borrowerProxy.address,
          poolAddress: poolContract.address,
        },
        { poolInfoAddress: poolInfo.address, provider }
      ),
      collateralAmount: new BN(collateralAmount.toString()),
      quoteAmount: new BN(debtAmount.toString()),
      quoteTokenPrecision: quotePrecision,
      collateralTokenPrecision: collateralPrecision,
      dpmProxyAddress: borrowerProxy.address,
      poolAddress: poolContract.address,
    },
    {
      ajnaProxyActions: apa.address,
      poolInfoAddress: poolInfo.address,
      provider,
      WETH,
    }
  );

  await borrowToken
    .connect(borrower)
    .approve(borrowerProxy.address, ethers.utils.parseUnits(debtAmount.toString(), quotePrecision));
  const tx = await borrowerProxy.connect(borrower).execute(withdrawStrategy.tx.to, withdrawStrategy.tx.data, {
    gasLimit: 3000000,
    value: withdrawStrategy.tx.value,
  });

  await tx.wait();

  return tx;
}

export async function deployGuard() {
  const Guard = await ethers.getContractFactory("AccountGuard");
  const dmpGuard = await Guard.deploy();

  await dmpGuard.deployed();

  const AccountImplementation = await ethers.getContractFactory("AccountImplementation");
  const implementationInstance = await AccountImplementation.deploy(dmpGuard.address);

  await implementationInstance.deployed();

  const AccountFactory = await ethers.getContractFactory("AccountFactory");
  const dmpFactory = await AccountFactory.deploy(dmpGuard.address);
  await dmpFactory.deployed();

  console.log("dmpGuard", dmpGuard.address);
  console.log("dmpFactory", dmpFactory.address);

  //const dmpGuard = await ethers.getContractAt("IAccountGuard", DPM_GUARD);
  // const dmpFactory = await ethers.getContractAt("IAccountFactory", DPM_FACTORY);
  const owner = await dmpGuard.owner();
  const guardDeployerAddress = owner;
  const guardDeployer = await utils.impersonate(guardDeployerAddress);
  return { dmpGuard, guardDeployer, dmpFactory };
}

export async function deployPoolFactory(
  poolInstance: Contract,
  auctionsInstance: Contract,
  actionsInstance: Contract,
  borrowerActionsInstance: Contract,
  reward: string
) {
  const ERC20PoolFactory = await ethers.getContractFactory("ERC20PoolFactory", {
    libraries: {
      PoolCommons: poolInstance.address,
      Auctions: auctionsInstance.address,
      LenderActions: actionsInstance.address,
      BorrowerActions: borrowerActionsInstance.address,
    },
  });

  const erc20PoolFactory = await ERC20PoolFactory.deploy(reward, {
    gasLimit: 10000000,
  });
  console.log("erc20PoolFactory", erc20PoolFactory.address);
  const ERC721PoolFactory = await ethers.getContractFactory("ERC721PoolFactory", {
    libraries: {
      PoolCommons: poolInstance.address,
      Auctions: auctionsInstance.address,
      LenderActions: actionsInstance.address,
      BorrowerActions: borrowerActionsInstance.address,
    },
  });
  const erc721PoolFactory = await ERC721PoolFactory.deploy(reward, {
    gasLimit: 10000000,
  });
  return { erc20PoolFactory, erc721PoolFactory };
}
export async function deployPool(erc20PoolFactory: ERC20PoolFactory, collateral: string, quote: string) {
  const hash = await erc20PoolFactory.ERC20_NON_SUBSET_HASH();

  await erc20PoolFactory.deployPool(collateral, quote, "50000000000000000", {
    gasLimit: 10000000,
  });

  const poolAddress = await erc20PoolFactory.deployedPools(hash, collateral, quote);

  return await ethers.getContractAt("ERC20Pool", poolAddress);
}
export async function sendLotsOfMoney(target: string, token: Token | WETH) {
  await token.mint(target, BigNumber.from("1000000000000000000").mul(1000));
}

export async function provideLiquidity(
  usdc: Contract,
  lender: Signer,
  poolContract: Contract,
  amount: BigNumber,
  bucketIndex: BigNumber,
  getExpiryTimestamp: () => Promise<number>
) {
  const amountWei = ethers.utils.parseUnits(amount.toString(), 18);
  await usdc.connect(lender).approve(poolContract.address, amountWei);
  const expiry = await getExpiryTimestamp();
  const tx = await poolContract.connect(lender).addQuoteToken(amountWei, bucketIndex, expiry);
  await tx.wait();
}

interface User {
  signer: Signer;
  proxy: IAccountImplementation;
}

export async function deploy() {
  const [deployer] = await ethers.getSigners();

  const tokenFactory = await ethers.getContractFactory("Token");
  const usdc = (await tokenFactory.deploy("USDC", "USDC", deployer.address, 6)) as Token;
  const wbtc = (await tokenFactory.deploy("WBTC", "WBTC", deployer.address, 8)) as Token;
  const ajna = (await tokenFactory.deploy("Token", "AJNA", deployer.address, 18)) as Token;
  const wethFactory = await ethers.getContractFactory("WETH");
  const weth = (await wethFactory.deploy()) as WETH;

  const { poolCommons, auctionsInstance, actionsInstance, borrowerActionsInstance, positionNFTSVGInstance } =
    await deployLibraries();

  const { dmpFactory, guardDeployer, dmpGuard } = await deployGuard();
  const poolFactory = await deployPoolFactory(
    poolCommons,
    auctionsInstance,
    actionsInstance,
    borrowerActionsInstance,
    ajna.address
  );

  const { rewardsManagerContract, positionManagerContract } = await deployRewardsContracts(
    positionNFTSVGInstance,
    poolFactory.erc20PoolFactory,
    poolFactory.erc721PoolFactory,
    ajna
  );

  const { apa, poolInfoContract } = await deployApa(
    poolCommons,
    rewardsManagerContract,
    positionManagerContract,
    ajna,
    dmpGuard,
    guardDeployer,
    weth.address
  );
  const pools = {
    wbtcUsdcPool: await deployPool(poolFactory.erc20PoolFactory, wbtc.address, usdc.address),
    wethUsdcPool: await deployPool(poolFactory.erc20PoolFactory, weth.address, usdc.address),
  };

  const AjnaPoc = await ethers.getContractFactory("AjnaPoc", {
    libraries: {
      PoolCommons: poolCommons.address,
    },
  });

  const ajnaPoc = await AjnaPoc.deploy(wbtc.address, usdc.address, pools.wbtcUsdcPool.address);
  await ajnaPoc.deployed();

  return {
    ajnaPoc,
    poolFactory,
    apa,
    poolInfoContract,
    usdc,
    wbtc,
    weth,
    ajna,
    auctionsInstance,
    actionsInstance,
    borrowerActionsInstance,
    dmpFactory,
    guardDeployer,
    dmpGuard,
    pools,
    positionManagerContract,
    rewardsManagerContract,
  };
}

export async function prepareEnv() {
  const signers = await ethers.getSigners();
  const [deployer, lender, borrower] = signers;

  const {
    poolFactory,
    apa,
    poolInfoContract,
    usdc,
    wbtc,
    weth,
    ajna,
    auctionsInstance,
    actionsInstance,
    borrowerActionsInstance,
    dmpFactory,
    guardDeployer,
    dmpGuard,
    ajnaPoc,
    pools,
    positionManagerContract,
    rewardsManagerContract,
  } = await deploy();

  await Promise.all([
    ...signers.map(signer => sendLotsOfMoney(signer.address, usdc)),
    ...signers.map(signer => sendLotsOfMoney(signer.address, wbtc)),
    ...signers.map(signer => sendLotsOfMoney(signer.address, weth)),
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
    let borrowerInfo = await poolInfoContract.borrowerInfo(pool.address, borrowerProxy.address);
    let hpb = await poolInfoContract.hpb(pool.address);
    let hpbIndex = await poolInfoContract.hpbIndex(pool.address);
    let htp = await poolInfoContract.htp(pool.address);
    let momp = BigNumber.from(0);
    try {
      momp = await poolInfoContract.momp(pool.address);
    } catch (e) {}
    let lenderInterestMargin = await poolInfoContract.lenderInterestMargin(pool.address);
    let lup = await poolInfoContract.lup(pool.address);
    let lupIndex = await poolInfoContract.lupIndex(pool.address);
    let poolLoansInfo = await poolInfoContract.poolLoansInfo(pool.address);
    let poolPricesInfo = await poolInfoContract.poolPricesInfo(pool.address);
    let poolReservesInfo = await poolInfoContract.poolReservesInfo(pool.address);
    let poolUtilizationInfo = await poolInfoContract.poolUtilizationInfo(pool.address);
    let [debt, accruedDebt, debtInAuctions] = await pool.debtInfo();

    let params = {
      hpb,
      hpbIndex,
      htp,
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
      [pool.address.toLowerCase()]: new Set<number>(),
    }),
    {}
  );
  async function provideLiquidity_(pool: ERC20Pool, amount: BigNumber, bucketIndex: BigNumber, user: User = users[1]) {
    await provideLiquidity(usdc, user.signer, pool, amount, bucketIndex, getExpiryTimestamp);
    bucketsRepo[pool.address.toLowerCase()].add(bucketIndex.toNumber());
  }
  async function removeLiquidity_(pool: ERC20Pool, amount: BigNumber, bucketIndex: BigNumber, user: User = users[1]) {
    const amountWei = ethers.utils.parseUnits(amount.toString(), 18);
    const tx = await pool.connect(user.signer).removeQuoteToken(amountWei, bucketIndex);
    await tx.wait();
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

    let yUtilized: string[] = [];
    let yUnutilized: string[] = [];
    let yNotEarning: string[] = [];

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
      poolFactory: poolFactory.erc20PoolFactory.address,
      wbtcUsdcPool: pools.wbtcUsdcPool.address,
      wethUsdcPool: pools.wethUsdcPool.address,
      poolInfoContract: poolInfoContract.address,
      dmpFactory: dmpFactory.address,
      dmpGuard: dmpGuard.address,
      "lender - signer[1]": lender.address,
      lenderProxy: lenderProxy.address,
      "borrower - signer[2]": borrower.address,
      borrowerProxy: borrowerProxy.address,
      ajnaProxyActions: apa.address,
      positionManagerContract: positionManagerContract.address,
      rewardsManagerContract: rewardsManagerContract.address,
    });
  }
  async function getExpiryTimestamp() {
    const blockNumber = await ethers.provider.getBlockNumber();
    const timestamp = (await ethers.provider.getBlock(blockNumber)).timestamp;

    return timestamp + 130000;
  }
  return {
    times: {
      DAY,
      WEEK,
      YEAR,
    },
    getLenderInfo,
    timeTravel,
    getBucketInfo,
    users,
    poolContract: pools.wbtcUsdcPool,
    lender,
    borrower,
    deployer,
    dmpFactory,
    dmpGuard,
    guardDeployer,
    borrowerProxy,
    lenderProxy,
    poolInfo: poolInfoContract,
    auctionsInstance,
    actionsInstance,
    borrowerActionsInstance,
    apa,
    usdc,
    wbtc,
    weth,
    ajnaPoc,
    ajna,
    getParams,
    provideLiquidity: provideLiquidity_,
    removeLiquidity: removeLiquidity_,
    moveLiquidity: moveLiquidity_,
    getAllBucketsInfo,
    getBorrowerInfo,
    printBuckets,
    printAddresses,
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
        apa,
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
        apa,
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
        apa,
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
