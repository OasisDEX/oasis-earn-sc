import { ADDRESSES } from "@deploy-configurations/addresses";
import { Contract, Signer } from "ethers";
import hre, { ethers } from "hardhat";

import {
  AccountFactory,
  AccountGuard,
  AjnaProxyActions,
  AjnaRewardClaimer,
  BorrowerActions,
  ERC20Pool,
  ERC20PoolFactory,
  ERC721PoolFactory,
  KickerActions,
  LenderActions,
  LPActions,
  PoolCommons,
  PoolInfoUtils,
  PositionManager,
  PositionNFTSVG,
  RewardsManager,
  ServiceRegistry,
  SettlerActions,
  TakerActions,
  Token,
  WETH,
} from "../../typechain-types";
import { HardhatUtils } from "./hardhat.utils";

const utils = new HardhatUtils(hre);

export async function deployLibraries() {
  const borrowerActionsInstance = await utils.deployContract<BorrowerActions>("BorrowerActions", []);
  const kickerActionsInstance = await utils.deployContract<KickerActions>("KickerActions", []);
  const actionsInstance = await utils.deployContract<LenderActions>("LenderActions", []);
  const settlerActionsInstance = await utils.deployContract<SettlerActions>("SettlerActions", []);
  const takerActionsInstance = await utils.deployContract<TakerActions>("TakerActions", []);
  const lpActionsInstance = await utils.deployContract<LPActions>("LPActions", []);
  const poolCommons = await utils.deployContract<PoolCommons>("PoolCommons", []);
  const lenderActionsInstance = await utils.deployContract<LenderActions>("LenderActions", []);

  const positionNFTSVGInstance = await utils.deployContract<PositionNFTSVG>("PositionNFTSVG", []);
  return {
    poolCommons,
    actionsInstance,
    borrowerActionsInstance,
    positionNFTSVGInstance,
    kickerActionsInstance,
    settlerActionsInstance,
    takerActionsInstance,
    lpActionsInstance,
    lenderActionsInstance,
  };
}

export async function deployTokens(receiver: string, mainnetTokens: boolean) {
  const usdc = mainnetTokens
    ? await utils.getContract<Token>("ERC20", ADDRESSES.mainnet.common.USDC)
    : await utils.deployContract<Token>("Token", ["USDC", "USDC", receiver, 6]);
  const wbtc = mainnetTokens
    ? await utils.getContract<Token>("ERC20", ADDRESSES.mainnet.common.WBTC)
    : await utils.deployContract<Token>("Token", ["WBTC", "WBTC", receiver, 8]);
  const ajna = await utils.deployContract<Token>("Token", ["AJNA", "AJNA", receiver, 18]);
  const weth = mainnetTokens
    ? await utils.getContract<WETH>("WETH", ADDRESSES.mainnet.common.WETH)
    : await utils.deployContract<WETH>("WETH", []);

  return { usdc, wbtc, ajna, weth };
}

export async function deployRewardsContracts(
  positionNFTSVGInstance: PositionNFTSVG,
  erc20PoolFactory: ERC20PoolFactory,
  erc721PoolFactory: ERC721PoolFactory,
  ajna: Token
) {
  const positionManagerContract = await utils.deployContract<PositionManager>(
    "PositionManager",
    [erc20PoolFactory.address, erc721PoolFactory.address],
    {
      libraries: {
        PositionNFTSVG: positionNFTSVGInstance.address,
      },
    }
  );

  const rewardsManagerContract = await utils.deployContract<RewardsManager>("RewardsManager", [
    ajna.address,
    positionManagerContract.address,
  ]);
  return { rewardsManagerContract, positionManagerContract };
}

async function deployServiceRegistry() {
  const serviceRegistryContract = await utils.deployContract<ServiceRegistry>("ServiceRegistry", [0]);

  return { serviceRegistryContract };
}

export async function deployApa(
  poolInstance: PoolCommons,
  rewardsManager: RewardsManager,
  positionManager: PositionManager,
  dmpGuardContract: Contract,
  guardDeployerSigner: Signer,
  weth: WETH,
  ajna: Token,
  initializeStaking = true
) {
  const { serviceRegistryContract } = await deployServiceRegistry();
  const hash = await serviceRegistryContract.getServiceNameHash("DPM_GUARD");
  await serviceRegistryContract.addNamedService(hash, dmpGuardContract.address);
  const poolInfoContract = await utils.deployContract<PoolInfoUtils>("PoolInfoUtils", [], {
    libraries: {
      PoolCommons: poolInstance.address,
    },
  });

  const arc = await utils.deployContract<AjnaRewardClaimer>("AjnaRewardClaimer", [
    rewardsManager.address,
    ajna.address,
    serviceRegistryContract.address,
  ]);

  const ajnaProxyActionsContract = await utils.deployContract<AjnaProxyActions>("AjnaProxyActions", [
    poolInfoContract.address,
    ajna.address,
    weth.address,
    dmpGuardContract.address,
  ]);

  if (initializeStaking) {
    await ajnaProxyActionsContract.initialize(positionManager.address, rewardsManager.address, arc.address);
    await arc.initializeAjnaProxyActions(ajnaProxyActionsContract.address);
  }

  await dmpGuardContract.connect(guardDeployerSigner).setWhitelist(ajnaProxyActionsContract.address, true);

  return { ajnaProxyActionsContract, poolInfo: poolInfoContract, poolInfoContract, ajnaRewardsClaimerContract: arc };
}
export async function deployGuard() {
  const dmpGuardContract = await utils.deployContract<AccountGuard>("AccountGuard", []);
  const dmpFactory = await utils.deployContract<AccountFactory>("AccountFactory", [dmpGuardContract.address]);

  const [guardDeployerAddress] = await hre.ethers.getSigners();
  const guardDeployerSigner = await utils.impersonate(guardDeployerAddress.address);

  return { dmpGuardContract, guardDeployerSigner, dmpFactory };
}

export async function deployPoolFactory(
  poolInstance: Contract,
  borrowerActionsInstance: Contract,
  kickerActionsInstance: KickerActions,
  settlerActionsInstance: SettlerActions,
  takerActionsInstance: TakerActions,
  lpActionsInstance: LPActions,
  lenderActionsInstance: LenderActions,
  reward: string
) {
  const erc20PoolFactory = await utils.deployContract<ERC20PoolFactory>("ERC20PoolFactory", [reward], {
    libraries: {
      BorrowerActions: borrowerActionsInstance.address,
      KickerActions: kickerActionsInstance.address,
      LPActions: lpActionsInstance.address,
      LenderActions: lenderActionsInstance.address,
      PoolCommons: poolInstance.address,
      SettlerActions: settlerActionsInstance.address,
      TakerActions: takerActionsInstance.address,
    },
  });

  const erc721PoolFactory = await utils.deployContract<ERC721PoolFactory>("ERC721PoolFactory", [reward], {
    libraries: {
      KickerActions: kickerActionsInstance.address,
      LPActions: lpActionsInstance.address,
      SettlerActions: settlerActionsInstance.address,
      TakerActions: takerActionsInstance.address,
      BorrowerActions: borrowerActionsInstance.address,
      LenderActions: lenderActionsInstance.address,
      PoolCommons: poolInstance.address,
    },
  });

  return { erc20PoolFactory, erc721PoolFactory };
}
export async function deployPool(
  erc20PoolFactory: ERC20PoolFactory,
  collateral: string,
  quote: string,
  deployPools = true
): Promise<ERC20Pool> {
  const hash = await erc20PoolFactory.ERC20_NON_SUBSET_HASH();
  let poolAddress = await erc20PoolFactory.deployedPools(hash, collateral, quote);
  if (poolAddress === hre.ethers.constants.AddressZero && deployPools) {
    const tx = await erc20PoolFactory.deployPool(collateral, quote, "25000000000000000");
    await tx.wait();
    poolAddress = await erc20PoolFactory.deployedPools(hash, collateral, quote);
  }

  return utils.getContract<ERC20Pool>("ERC20Pool", poolAddress);
}
export async function getPool(
  erc20PoolFactory: ERC20PoolFactory,
  collateral: string,
  quote: string
): Promise<ERC20Pool> {
  const hash = await erc20PoolFactory.ERC20_NON_SUBSET_HASH();
  const poolAddress = await erc20PoolFactory.deployedPools(hash, collateral, quote);
  return utils.getContract<ERC20Pool>("ERC20Pool", poolAddress);
}
export async function deploy(mainnet = false) {
  const [deployer] = await ethers.getSigners();
  const { usdc, wbtc, ajna, weth } = await deployTokens(deployer.address, mainnet);
  const {
    poolCommons,
    /*actionsInstance,*/
    borrowerActionsInstance,
    positionNFTSVGInstance,
    kickerActionsInstance,
    settlerActionsInstance,
    takerActionsInstance,
    lpActionsInstance,
    lenderActionsInstance,
  } = await deployLibraries();

  const { dmpFactory, guardDeployerSigner, dmpGuardContract } = await deployGuard();
  const { erc20PoolFactory, erc721PoolFactory } = await deployPoolFactory(
    poolCommons,
    borrowerActionsInstance,
    kickerActionsInstance,
    settlerActionsInstance,
    takerActionsInstance,
    lpActionsInstance,
    lenderActionsInstance,
    ajna.address
  );

  const { rewardsManagerContract, positionManagerContract } = await deployRewardsContracts(
    positionNFTSVGInstance,
    erc20PoolFactory,
    erc721PoolFactory,
    ajna
  );

  const { ajnaProxyActionsContract, poolInfoContract } = await deployApa(
    poolCommons,
    rewardsManagerContract,
    positionManagerContract,
    dmpGuardContract,
    guardDeployerSigner,
    weth,
    ajna
  );
  const pools = {
    wbtcUsdcPool: await deployPool(erc20PoolFactory, wbtc.address, usdc.address),
    wethUsdcPool: await deployPool(erc20PoolFactory, weth.address, usdc.address),
  };

  return {
    erc20PoolFactory,
    erc721PoolFactory,
    positionManagerContract,
    rewardsManagerContract,
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
  };
}
