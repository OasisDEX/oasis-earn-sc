import { HardhatUtils, prepareEnv } from "@ajna-contracts/scripts";
import hre from "hardhat";
const utils = new HardhatUtils(hre);

async function main() {
  const sender = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  const ethers = hre.ethers;
  const signers = await ethers.getSigners();

  await signers[0].provider.send("tenderly_addBalance", [
    [sender],
    //amount in wei will be added for all wallets
    ethers.utils.hexValue(ethers.utils.parseUnits("1000", "ether").toHexString()),
  ]);
  const result = await prepareEnv(hre, false);
  console.log(result);
}

main();
