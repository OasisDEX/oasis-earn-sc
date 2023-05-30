import { ethers } from "hardhat";

async function main() {
  const POOL_INFO_UTILS = "0x1F9F7732ff409FC0AbcAAea94634A7b41F445299";
  const POSITION_MANAGER = "0x83AB3762A4AeC9FBD4e7c01581C9495f2160630b";
  const REWARD_MANAGER = "0xaF9bc1F09fe561CbD00018fC352507fD23cD46E2";
  const AJNA_TOKEN = "0xaadebCF61AA7Da0573b524DE57c67aDa797D46c5";
  const WETH = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6";
  const GUARD = "0x9319710C25cdaDDD1766F0bDE40F1A4034C17c7e";
  const SERVICE_REGISTRY = "0x5A5277B8c8a42e6d8Ab517483D7D59b4ca03dB7F";

  const AjnaRewardsClaimerFactory = await ethers.getContractFactory("AjnaRewardClaimer");
  const arc = await AjnaRewardsClaimerFactory.deploy(REWARD_MANAGER, AJNA_TOKEN, SERVICE_REGISTRY);
  const ARC = (await arc.deployed()).address;

  const AjnaProxyActions = await ethers.getContractFactory("AjnaProxyActions");
  // hardcoded addresses for now
  const apa = await AjnaProxyActions.deploy(
    POOL_INFO_UTILS,
    POSITION_MANAGER,
    REWARD_MANAGER,
    AJNA_TOKEN,
    WETH,
    ARC,
    GUARD
  );
  await apa.deployed();
  console.log(`AjnaRewardsClaimer Deployed: ${arc.address}`);
  console.log(`AjnaProxyActions Deployed: ${apa.address}`);
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
