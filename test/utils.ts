import { network, ethers } from "hardhat";
import R from "ramda";
import { writeFileSync } from "fs";
// import chalk from 'chalk'
import { BigNumber } from "bignumber.js";
import { Contract, Signer, BigNumber as EthersBN } from "ethers";

export const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
export const ETH_ADDR = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export const MAX_UINT =
  "115792089237316195423570985008687907853269984665640564039457584007913129639935";

export const standardAmounts = {
  ETH: "2",
  WETH: "2",
  AAVE: "8",
  BAT: "4000",
  USDC: "2000",
  UNI: "50",
  SUSD: "2000",
  BUSD: "2000",
  SNX: "100",
  REP: "70",
  REN: "1000",
  MKR: "1",
  ENJ: "1000",
  DAI: "2000",
  WBTC: "0.04",
  RENBTC: "0.04",
  ZRX: "2000",
  KNC: "1000",
  MANA: "2000",
  PAXUSD: "2000",
  COMP: "5",
  LRC: "3000",
  LINK: "70",
  USDT: "2000",
  TUSD: "2000",
  BAL: "50",
  GUSD: "2000",
  YFI: "0.05",
};

export async function fetchStandardAmounts() {
  return standardAmounts;
}

// TODO: validate `contractArgs`
function abiEncodeArgs(deployed: Contract, contractArgs: any[]) {
  // not writing abi encoded args if this does not pass
  if (
    !contractArgs ||
    !deployed ||
    !R.hasPath(["interface", "deploy"], deployed)
  ) {
    return null;
  }

  return ethers.utils.defaultAbiCoder.encode(
    deployed.interface.deploy.inputs,
    contractArgs
  );
}

export async function deploy(
  contractName: string,
  _args = [],
  overrides = {},
  libraries = {},
  silent: boolean
) {
  if (!silent) {
    console.log(` 🛰  Deploying: ${contractName}`);
  }

  const contractArgs = _args || [];
  const contractArtifacts = await ethers.getContractFactory(contractName, {
    libraries: libraries,
  });
  const deployed = await contractArtifacts.deploy(...contractArgs, overrides);
  const encoded = abiEncodeArgs(deployed, contractArgs);
  writeFileSync(`artifacts/${contractName}.address`, deployed.address);

  let extraGasInfo = "";
  if (deployed?.deployTransaction) {
    const gasUsed = deployed.deployTransaction.gasLimit.mul(
      deployed.deployTransaction.gasPrice!
    );
    extraGasInfo = "(" + ethers.utils.formatEther(gasUsed) + " ETH)";
  }
  // if (!silent) {
  //   console.log(
  //     ' 📄',
  //     chalk.cyan(contractName),
  //     'deployed to:',
  //     chalk.magenta(deployed.address),
  //     chalk.grey(extraGasInfo),
  //     'in block',
  //     chalk.yellow(deployed.deployTransaction.blockNumber),
  //   )
  // }

  if (!encoded || encoded.length <= 2) return deployed;
  writeFileSync(`artifacts/${contractName}.args`, encoded.slice(2));

  return deployed;
}

export async function send(
  tokenAddr: string,
  to: string,
  amount: BigNumber.Value
) {
  const tokenContract = await ethers.getContractAt("IERC20", tokenAddr);

  await tokenContract.transfer(to, amount);
}

export async function approve(tokenAddr: string, to: string) {
  const tokenContract = await ethers.getContractAt("IERC20", tokenAddr);

  const allowance: EthersBN = await tokenContract.allowance(
    await tokenContract.signer.getAddress(),
    to
  );

  if (allowance.eq(0)) {
    await tokenContract.approve(to, MAX_UINT, { gasLimit: 1000000 });
  }
}

export async function sendEther(signer: Signer, to: string, amount: string) {
  const value = ethers.utils.parseUnits(amount, 18);
  const txObj = await signer.populateTransaction({
    to,
    value,
    gasLimit: 300000,
  });

  await signer.sendTransaction(txObj);
}

export async function balanceOf(tokenAddr: string, addr: string) {
  const tokenContract = await ethers.getContractAt("IERC20", tokenAddr);

  // console.log(`Balance of ${tokenAddr} for ${addr} is ${balance.toString()} in block ${await hre.ethers.provider.getBlockNumber()}`);

  const balance =
    tokenAddr.toLowerCase() === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
      ? await ethers.provider.getBalance(addr)
      : await tokenContract.balanceOf(addr);

  return new BigNumber(balance.toString());
}

export async function etherBalanceOf(addr: string) {
  const balance = await ethers.provider.getBalance(addr);
  return new BigNumber(balance.toString());
}

export function isEth(tokenAddr: string) {
  return (
    tokenAddr.toLowerCase() === ETH_ADDR.toLowerCase() ||
    tokenAddr.toLowerCase() === WETH_ADDRESS.toLowerCase()
  );
}

export function convertToWeth(tokenAddr: string) {
  return isEth(tokenAddr) ? WETH_ADDRESS : tokenAddr;
}

export async function impersonateAccount(account: string) {
  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [account],
  });
}

export async function stopImpersonatingAccount(account: string) {
  await network.provider.request({
    method: "hardhat_stopImpersonatingAccount",
    params: [account],
  });
}

// TODO: validate `timeIncrease`
export async function timeTravel(timeIncrease: number) {
  await network.provider.request({
    method: "evm_increaseTime",
    params: [timeIncrease],
    // id: new Date().getTime(), // TODO: validate
  });
}
