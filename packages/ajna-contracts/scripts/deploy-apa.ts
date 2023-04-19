import { ethers } from "hardhat";

async function main() {
  const AjnaProxyActions = await ethers.getContractFactory("AjnaProxyActions");
  // hardcoded addresses for now
  const apa = await AjnaProxyActions.deploy(
    "0xEa36b2a4703182d07df9DdEe46BF97f9979F0cCf",
    "0x31BcbE14Ad30B2f7E1E4A14caB2C16849B73Dac3",
    "0xEd6890d748e62ddbb3f80e7256Deeb2fBb853476",
    "0xaadebCF61AA7Da0573b524DE57c67aDa797D46c5",
    "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6"
  );
  await apa.deployed();
  console.log(`AjnaProxyActions Deployed: ${apa.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
