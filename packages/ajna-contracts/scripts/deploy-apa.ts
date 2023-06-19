import { deployPool, HardhatUtils } from "@ajna-contracts/scripts";
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
const utils = new HardhatUtils(hre);

type Pool = { pair: string; amount: number; price: number; deposit: boolean };
// RC5 addresses
const ADDRESSES = {
  goerli: {
    AJNA_PROXY_ACTIONS: "0x1a8Db1151F8F1582d0A010410c50a3b6C07398e7",
    ERC20_POOL_FACTORY: "0xb54FE3ee12926e63FF4A5163766fb93eDbADd5f3",
    POOL_INFO_UTILS: "0x28ef92e694d1044917981837b21e5eA994931c71",
    POSITION_MANAGER: "0x31E3B448cAFF35e9eEb232053f4d5e76776a1C83",
    REWARD_MANAGER: "0x015441062c2aad707629D9A1f2029074F58ad5aE",
    GUARD: "0x9319710C25cdaDDD1766F0bDE40F1A4034C17c7e",
    SERVICE_REGISTRY: "0x5A5277B8c8a42e6d8Ab517483D7D59b4ca03dB7F",
  },
  mainnet: {
    AJNA_PROXY_ACTIONS: "0x0000000000000000000000000000000000000000",
    ERC20_POOL_FACTORY: "0x0000000000000000000000000000000000000000",
    POOL_INFO_UTILS: "0x0000000000000000000000000000000000000000",
    POSITION_MANAGER: "0x0000000000000000000000000000000000000000",
    REWARD_MANAGER: "0x0000000000000000000000000000000000000000",
    GUARD: "0x0000000000000000000000000000000000000000",
    SERVICE_REGISTRY: "0x0000000000000000000000000000000000000000",
  },
};
//TOKENS
const TOKENS = {
  goerli: {
    WETH: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
    RETH: "0x62bc478ffc429161115a6e4090f819ce5c50a5d9",
    WSTETH: "0x6320cD32aA674d2898A68ec82e869385Fc5f7E2f",
    WBTC: "0x7ccF0411c7932B99FC3704d68575250F032e3bB7",
    USDC: "0x6Fb5ef893d44F4f88026430d82d4ef269543cB23",
    DAI: "0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844",
    AJNA: "0xaadebCF61AA7Da0573b524DE57c67aDa797D46c5",
  },
  // TODO: update mainnet addresses
  mainnet: {
    WETH: "0x0000000000000000000000000000000000000000",
    RETH: "0x0000000000000000000000000000000000000000",
    WSTETH: "0x0000000000000000000000000000000000000000",
    WBTC: "0x0000000000000000000000000000000000000000",
    USDC: "0x0000000000000000000000000000000000000000",
    DAI: "0x0000000000000000000000000000000000000000",
    AJNA: "0x0000000000000000000000000000000000000000",
  },
};

const pools: Pool[] = [
  { pair: "WBTC-USDC", amount: 5000, price: 20000, deposit: false },
  { pair: "WBTC-DAI", amount: 5000, price: 20000, deposit: false },
  { pair: "USDC-WBTC", amount: 1, price: 0.000030769, deposit: false },
  { pair: "WETH-USDC", amount: 5000, price: 1500, deposit: false },
  { pair: "WETH-DAI", amount: 5000, price: 1500, deposit: false },
  { pair: "USDC-WETH", amount: 1, price: 0.0005, deposit: false },
  { pair: "RETH-DAI", amount: 5000, price: 1500, deposit: false },
  { pair: "RETH-USDC", amount: 5000, price: 1500, deposit: false },
  { pair: "RETH-WETH", amount: 1, price: 1.07, deposit: false },
  { pair: "WSTETH-DAI", amount: 5000, price: 1500, deposit: false },
  { pair: "WSTETH-USDC", amount: 5000, price: 1500, deposit: false },
  { pair: "WSTETH-WETH", amount: 1, price: 1.09, deposit: false },
];

async function main() {
  const signer: SignerWithAddress = await getSigner();
  const network = hre.network.name === "hardhat" || hre.network.name === "local" ? "goerli" : hre.network.name;

  const initializeStakingRewards = false;
  const deployPools = true;

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

      console.log(`AjnaRewardsClaimer Deployed: ${arc.address}`);
    }
  }
  await deployAjnaPools(deployPools, network, erc20PoolFactory, apa, signer);
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

async function deployAjnaPools(
  deployPools: boolean,
  network: string,
  erc20PoolFactory: ERC20PoolFactory,
  apa: AjnaProxyActions,
  signer: SignerWithAddress
) {
  if (deployPools) {
    for (const pool of pools) {
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
    await deployedPool.connect(signer).addQuoteToken(amount, index, 999999999999999);
  }
}

async function getSigner() {
  let signer: SignerWithAddress;
  if (hre.network.name === "hardhat" || hre.network.name === "localhost") {
    const deployer = "0x0B5a3C04D1199283938fbe887A2C82C808aa89Fb";
    await utils.impersonate(deployer);
    signer = await hre.ethers.getSigner(deployer);
  } else {
    signer = (await hre.ethers.getSigners())[0];
  }
  return signer;
}
