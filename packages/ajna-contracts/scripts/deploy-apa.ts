import { deployPool, HardhatUtils, Pool } from "@ajna-contracts/scripts";
import { AjnaProxyActions, ERC20, ERC20Pool, ERC20PoolFactory, IWETH } from "@ajna-contracts/typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import chalk from "chalk";
import hre from "hardhat";

import { ADDRESSES, CONFIG, POOLS, TOKENS } from "./common/config";
const utils = new HardhatUtils(hre);

async function main() {
  const signer: SignerWithAddress = await getSigner();
  console.info(`Deployer address: ${signer.address}`);
  console.info(`Deployer balance: ${hre.ethers.utils.formatEther(await signer.getBalance())}`);
  console.info(`Deploying on network: ${hre.network.name}`);
  console.info(`Deploying on chainId: ${hre.network.config.chainId}`);

  const network = hre.network.name === "hardhat" || hre.network.name === "local" ? "mainnet" : hre.network.name;

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
    if (network !== "hardhat") {
      console.log(`Waiting for 60 seconds, before verification on etherscan...`);
      await new Promise(resolve => setTimeout(resolve, 60000));
      await hre.run("verify:verify", {
        address: apa.address,
        constructorArguments: [
          ADDRESSES[network].POOL_INFO_UTILS,
          TOKENS[network].AJNA,
          TOKENS[network].WETH,
          ADDRESSES[network].GUARD,
        ],
      });
    }
  } else {
    apa = await utils.getContract<AjnaProxyActions>("AjnaProxyActions", ADDRESSES[network].AJNA_PROXY_ACTIONS);
  }
  await deployAjnaPools(network, erc20PoolFactory, apa, signer);
}

async function deployAjnaPools(
  network: string,
  erc20PoolFactory: ERC20PoolFactory,
  apa: AjnaProxyActions,
  signer: SignerWithAddress
) {
  for (const pool of POOLS) {
    const [collateral, quote] = pool.pair.split("-");
    const collateralToken = TOKENS[network][collateral];
    const quoteToken = TOKENS[network][quote];
    if (quoteToken === hre.ethers.constants.AddressZero || collateralToken === hre.ethers.constants.AddressZero) {
      console.log(
        chalk.red(`Token ${quote}(${quoteToken}) or ${collateral}(${collateralToken}) not found for ${network}`)
      );
      continue;
    }
    try {
      const deployedPool = await deployPool(erc20PoolFactory, collateralToken, quoteToken, pool.deploy, pool.rate);
      deployedPool.address === hre.ethers.constants.AddressZero
        ? console.info(chalk.red(`Pool ${pool.pair} not yet deployed`))
        : console.info(chalk.green(`Pool ${pool.pair} deployed at ${deployedPool.address}`));
      if (pool.deposit) {
        await depositQuoteToken(network, quote, signer, pool, apa, deployedPool);
      }
    } catch (error) {
      console.error(chalk.red("error adding quote token"), error);
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
    console.info(chalk.blue(`Approving ${pool.amount} of ${quote} to pool ${pool.pair} at index ${index}`));
    await quoteToken.connect(signer).approve(deployedPool.address, amountInDecimals);
  }
  if (amountInDecimals.lte(balance)) {
    console.info(chalk.blue(`Adding ${pool.amount} of ${quote} to pool ${pool.pair} at index ${index}`));
    await deployedPool.connect(signer).addQuoteToken(amount, index, 999999999999999);
  } else {
    console.info(chalk.red(`Not enough ${quote} to add to pool ${pool.pair}`));
  }
}

async function getSigner() {
  let signer: SignerWithAddress;
  if (hre.network.name === "hardhat" || hre.network.name === "localhost") {
    const deployer = CONFIG.deployer || "0x8E78CC7089509B568a401f593F64B3074693d25E";
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
