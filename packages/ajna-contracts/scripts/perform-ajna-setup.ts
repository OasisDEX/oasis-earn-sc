import { HardhatUtils, prepareEnv } from "@ajna-contracts/scripts";
import hre from "hardhat";


async function main() {
  console.log("provider url", hre.ethers.provider.connection.url);
  const utils = new HardhatUtils(hre);
  const sender = "0xb42C980EdB30BDDA2febF0C4Bee7136303e4A68c";
  const ethers = hre.ethers;
  await ethers.provider.send("tenderly_addBalance", [
    [sender],
    //amount in wei will be added for all wallets
    ethers.utils.hexValue(ethers.utils.parseUnits("1000", "ether").toHexString()),
  ]);
  const result = await prepareEnv(hre, true);
  console.log(utils.printTrace());
}

main();
