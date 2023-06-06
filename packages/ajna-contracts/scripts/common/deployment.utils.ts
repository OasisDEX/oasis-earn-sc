import { ADDRESSES } from "@oasisdex/oasis-actions";
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

export async function deployTokens(receiver: string, mainnetTokens: boolean = false) {
  const usdc = mainnetTokens
    ? await utils.getContract<Token>("ERC20", ADDRESSES.main.USDC)
    : await utils.deployContract<Token>("Token", ["USDC", "USDC", receiver, 6]);
  const wbtc = mainnetTokens
    ? await utils.getContract<Token>("ERC20", ADDRESSES.main.WBTC)
    : await utils.deployContract<Token>("Token", ["WBTC", "WBTC", receiver, 8]);
  const ajna = await utils.deployContract<Token>("Token", ["AJNA", "AJNA", receiver, 18]);
  const weth = mainnetTokens
    ? await utils.getContract<WETH>("WETH", ADDRESSES.main.WETH)
    : await utils.deployContract<WETH>("WETH", []);
  console.log("usdc", usdc.address);
  console.log("wbtc", wbtc.address);
  console.log("ajna", ajna.address);
  console.log("weth", weth.address);
  console.log("mainnet tokens:", mainnetTokens);
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
  dpmGuardContract: Contract,
  guardOwnerAddress: string,
  weth: WETH,
  ajna: Token,
  signerAddress: string,
  isMainnet = false
) {
  const { serviceRegistryContract } = await deployServiceRegistry();
  const hash = await serviceRegistryContract.getServiceNameHash("DPM_GUARD");
  const result = await serviceRegistryContract.addNamedService(hash, dpmGuardContract.address);

  utils.traceTransaction("addNamedService", {
    address: await serviceRegistryContract.owner(),
    data: result.data,
    from: signerAddress,
    to: serviceRegistryContract.address,
    nonce: result.nonce,
  });

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
    positionManager.address,
    rewardsManager.address,
    ajna.address,
    weth.address,
    arc.address,
    dpmGuardContract.address,
  ]);

  await arc.initializeAjnaProxyActions(ajnaProxyActionsContract.address);

  if(!isMainnet) {
    await dpmGuardContract.connect(guardOwnerAddress).setWhitelist(ajnaProxyActionsContract.address, true);
  }else{
    console.log("Simulating transaction, whitelisting AjnaProxyActions contract")
    await utils.performSimulation(
      {
        from: guardOwnerAddress,
        to: dpmGuardContract.address,
        data: dpmGuardContract.interface.encodeFunctionData("setWhitelist", [ajnaProxyActionsContract.address, true]),
     }
    );
     console.log("Done");
  }

  return { ajnaProxyActionsContract, poolInfo: poolInfoContract, poolInfoContract, ajnaRewardsClaimerContract: arc };
}
export async function deployGuard(isMainnet: boolean = false) {
  let dpmGuardContract: AccountGuard;
  let guardDeployerAddress: string;
  let dpmFactory: AccountFactory;  

  if(isMainnet) {
    dpmGuardContract = await utils.getContract<AccountGuard>("AccountGuard", ADDRESSES.main.accountGuard);
    dpmFactory = await utils.getContract<AccountFactory>("AccountFactory", ADDRESSES.main.accountFactory);
    guardDeployerAddress = await dpmGuardContract.owner();
  } else {
    dpmGuardContract = await utils.deployContract<AccountGuard>("AccountGuard", []);
    dpmFactory = await utils.deployContract<AccountFactory>("AccountFactory", [dpmGuardContract.address]);
    [guardDeployerAddress] = await (await hre.ethers.getSigners())[0].getAddress();  
  }

  return { dpmGuardContract, guardDeployerAddress, dpmFactory };
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
  quote: string
): Promise<ERC20Pool> {
  const hash = await erc20PoolFactory.ERC20_NON_SUBSET_HASH();

  await erc20PoolFactory.deployPool(collateral, quote, "50000000000000000", {
    gasLimit: 10000000,
  });

  const poolAddress = await erc20PoolFactory.deployedPools(hash, collateral, quote);

  return (await utils.getContract<ERC20Pool>("ERC20Pool", poolAddress)) as ERC20Pool;
}
export async function deploy(mainnetTokens = false) {
  const [deployer] = await ethers.getSigners();
  const { usdc, wbtc, ajna, weth } = await deployTokens(deployer.address, mainnetTokens);
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

  const { dpmFactory, guardDeployerAddress, dpmGuardContract } = await deployGuard(mainnetTokens);
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
    dpmGuardContract,
    guardDeployerAddress,
    weth,
    ajna,
    await deployer.getAddress(),
    false
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
    dpmFactory,
    guardDeployerAddress,
    dpmGuardContract,
    pools,
  };
}
