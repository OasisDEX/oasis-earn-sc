import { deployPool, HardhatUtils, Pool } from "@ajna-contracts/scripts";
import {
  AjnaProxyActions,
  AjnaRewardClaimer,
  ERC20,
  ERC20Pool,
  ERC20PoolFactory,
  IWETH,
} from "@ajna-contracts/typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import hre from "hardhat";

import { ADDRESSES, CONFIG, POOLS, TOKENS } from "./common/config";
const utils = new HardhatUtils(hre);

async function main() {
  const signer: SignerWithAddress = await getSigner();
  const network = hre.network.name === "hardhat" || hre.network.name === "local" ? "goerli" : hre.network.name;

  const initializeStakingRewards = CONFIG.initializeStakingRewards || false;
  const deployPools = CONFIG.deployPools || false;

  const erc20PoolFactory = await utils.getContract<ERC20PoolFactory>(
    "ERC20PoolFactory",
    ADDRESSES[network].ERC20_POOL_FACTORY
  );
  let apa: AjnaProxyActions;
  if (ADDRESSES[network].AJNA_PROXY_ACTIONS === "0x0000000000000000000000000000000000000000") {
    apa = await utils.deployContract<AjnaProxyActions>("AjnaProxyActions", [
      ADDRESSES[network].POOL_INFO_UTILS,
      TOKENS[network].AJNA,
      TOKENS[network].WETH,
      ADDRESSES[network].GUARD,
    ]);
    console.log(`AjnaProxyActions Deployed: ${apa.address}`);
  } else {
    apa = await utils.getContract<AjnaProxyActions>("AjnaProxyActions", ADDRESSES[network].AJNA_PROXY_ACTIONS);
    if (initializeStakingRewards) {
      const arc = await utils.deployContract<AjnaRewardClaimer>("AjnaRewardClaimer", [
        ADDRESSES[network].REWARD_MANAGER,
        TOKENS[network].AJNA,
        ADDRESSES[network].SERVICE_REGISTRY,
      ]);
      await apa.initialize(ADDRESSES[network].POSITION_MANAGER, ADDRESSES[network].REWARD_MANAGER, arc.address);
      console.log(`AjnaProxyActions Address   : ${apa.address}`);
      console.log(`AjnaRewardsClaimer Deployed: ${arc.address}`);
    }
  }
  await deployAjnaPools(deployPools, network, erc20PoolFactory, apa, signer);
}

async function deployAjnaPools(
  deployPools: boolean,
  network: string,
  erc20PoolFactory: ERC20PoolFactory,
  apa: AjnaProxyActions,
  signer: SignerWithAddress
) {
  if (deployPools) {
    for (const pool of POOLS) {
      const [collateral, quote] = pool.pair.split("-");
      try {
        const deployedPool = await deployPool(erc20PoolFactory, TOKENS[network][collateral], TOKENS[network][quote]);
        console.info(`Pool ${pool.pair} deployed at ${deployedPool.address}`);
        if (pool.deposit) {
          await depositQuoteToken(network, quote, signer, pool, apa, deployedPool);
        }
      } catch (error) {
        console.error("error adding quote token", error);
      }
    }
  }
}

async function depositQuoteToken(
  network: string,
  quote: string,
  signer: SignerWithAddress,
  pool: Pool,
  apa: AjnaProxyActions,
  deployedPool: ERC20Pool
) {
  const quoteToken = await utils.getContract<ERC20>("ERC20", TOKENS[network][quote]);
  if (quote === "WETH") {
    const weth = await utils.getContract<IWETH>("IWETH", TOKENS[network][quote]);
    try {
      await weth.connect(signer).deposit({ value: hre.ethers.utils.parseUnits(pool.amount.toString(), 18) });
    } catch (error) {
      console.error("error depositing weth", error);
    }
  }
  const balance = await quoteToken.balanceOf(signer.address);
  const decimals = await quoteToken.decimals();
  const price = hre.ethers.utils.parseUnits(pool.price.toString(), 18);
  const index = await apa.convertPriceToIndex(price.toString());
  const amountInDecimals = hre.ethers.utils.parseUnits(pool.amount.toString(), decimals);
  const amount = hre.ethers.utils.parseUnits(pool.amount.toString(), 18);
  const allowance = await quoteToken.allowance(signer.address, deployedPool.address);
  if (allowance.lt(amountInDecimals)) {
    console.info(`Approving ${pool.amount} of ${quote} to pool ${pool.pair} at index ${index}`);
    await quoteToken.connect(signer).approve(deployedPool.address, amountInDecimals);
  }
  if (amountInDecimals.lte(balance)) {
    console.info(`Adding ${pool.amount} of ${quote} to pool ${pool.pair} at index ${index}`);
    await deployedPool.connect(signer).addQuoteToken(amount, index, 999999999999999, false);
  }
}

async function getSigner() {
  let signer: SignerWithAddress;
  if (hre.network.name === "hardhat" || hre.network.name === "localhost") {
    const deployer = CONFIG.deployer || "0x0B5a3C04D1199283938fbe887A2C82C808aa89Fb";
    await utils.impersonate(deployer);
    signer = await hre.ethers.getSigner(deployer);
  } else {
    signer = (await hre.ethers.getSigners())[0];
  }
  return signer;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => {
    // success message or other processing
    process.exitCode = 0;
    process.exit();
  })
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
    process.exit();
  });
