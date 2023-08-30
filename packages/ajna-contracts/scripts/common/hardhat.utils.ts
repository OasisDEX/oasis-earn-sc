import "@nomiclabs/hardhat-ethers";

import erc20abi from "@abis/external/tokens/IERC20.json";
import { EventFragment } from "@ethersproject/abi";
import { FactoryOptions } from "@nomiclabs/hardhat-ethers/types";
import { BigNumber, constants, Contract, ContractReceipt, Signer } from "ethers";
import { writeFileSync } from "fs";
import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment, Network } from "hardhat/types/runtime";
import { join } from "path";

import { Token, WETH } from "../../typechain-types";
import { CONFIG } from "./config";

export type BasicSimulationData = {
  data: string;
  from: string;
  to: string;
};

export type TraceData = BasicSimulationData & {
  address: string;
  nonce: number;
};

export type TraceItem = TraceData & {
  operationName: string;
};

export let trace: TraceItem[] = [];

export class HardhatUtils {
  public async getMainSignerTransactionCount(): Promise<number> {
    const signer: Signer = this.hre.ethers.provider.getSigner(0);
    const transactionCount = await signer.getTransactionCount();
    return transactionCount;
  }
  constructor(public readonly hre: HardhatRuntimeEnvironment, public readonly forked?: Network) {}
  public getEvents(receipt: ContractReceipt, eventAbi: EventFragment) {
    const iface = new this.hre.ethers.utils.Interface([eventAbi]);
    const filteredEvents = receipt.logs?.filter(({ topics }) => topics[0] === iface.getEventTopic(eventAbi.name));
    return (
      filteredEvents?.map(x => ({
        ...iface.parseLog(x),
        topics: x.topics,
        data: x.data,
        address: x.address,
      })) || []
    );
  }

  public clearTrace() {
    trace = [];
  }

  public traceTransaction(operationName: string, result: TraceData) {
    trace.push({
      operationName,
      address: result.address,
      data: result.data,
      from: result.from,
      to: result.to,
      nonce: result.nonce,
    });
  }

  public getTraceSize() {
    return trace.length;
  }

  public async saveTrace(fullFileName: string) {
    writeFileSync(join(__dirname, fullFileName), this.printTrace(), {
      flag: "w",
    });
  }

  public printTrace() {
    return JSON.stringify(trace, null, 2);
  }

  public async sendLotsOfMoney(target: string, token: Token | WETH, mainnet = false) {
    if (mainnet) {
      await this.setTokenBalance(target, token.address, BigNumber.from("1000000000000000000").mul(1000));
    } else {
      await token.mint(target, BigNumber.from("1000000000000000000").mul(1000));
    }
  }

  public async deployContract<T extends Contract>(
    contractName: string,
    args: any[],
    signerOrOptions?: Signer | FactoryOptions | undefined
  ): Promise<T> {
    const factory = await ethers.getContractFactory(contractName, signerOrOptions);
    const contract = (await factory.deploy(...args)) as unknown as T;
    await contract.deployed();
    const receipt = await contract.deployTransaction.wait();
    this.traceTransaction(contractName, {
      address: contract.address,
      data: contract.deployTransaction.data,
      from: receipt.from,
      to: receipt.to,
      nonce: contract.deployTransaction.nonce,
    });
    return contract;
  }

  public async getContract<T extends Contract>(contractName: string, contractAddress: string): Promise<T> {
    const contract = (await ethers.getContractAt(contractName, contractAddress)) as T;
    return contract;
  }

  public async impersonate(user: string): Promise<Signer> {
    if (this.hre.network.name !== "tenderly") {
      await this.impersonateAccount(user);
      const newSigner = await this.hre.ethers.getSigner(user);
      return newSigner;
    } else {
      return this.hre.ethers.getSigner(user);
    }
  }

  private async impersonateAccount(account: string) {
    await this.hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [account],
    });
  }
  public async findBalancesSlot(tokenAddress: string): Promise<number> {
    const encode = (types: any[], values: any[]) => this.hre.ethers.utils.defaultAbiCoder.encode(types, values);
    const account = constants.AddressZero;
    const probeA = encode(["uint"], [BigNumber.from("100")]);
    const probeB = encode(["uint"], [BigNumber.from("200")]);
    // const token = await this.hre.ethers.getContractAt("ERC20", tokenAddress);
    const token = new this.hre.ethers.Contract(tokenAddress, erc20abi);
    for (let i = 0; i < 100; i++) {
      let probedSlot = this.hre.ethers.utils.keccak256(encode(["address", "uint"], [account, i]));
      // remove padding for JSON RPC
      while (probedSlot.startsWith("0x0")) probedSlot = "0x" + probedSlot.slice(3);
      const prev = await this.hre.network.provider.send("eth_getStorageAt", [tokenAddress, probedSlot]);
      // make sure the probe will change the slot value
      const probe = prev === probeA ? probeB : probeA;

      await this.hre.network.provider.send("hardhat_setStorageAt", [tokenAddress, probedSlot, probe]);

      const balance = await token.balanceOf(account);
      // reset to previous value
      await this.hre.network.provider.send("hardhat_setStorageAt", [tokenAddress, probedSlot, prev]);
      if (balance.eq(this.hre.ethers.BigNumber.from(probe))) return i;
    }
    throw "Balances slot not found!";
  }
  /**
   * Set token balance to the provided value.
   * @param {string} account  - address of the wallet holding the tokens
   * @param {string}tokenAddress - address of the token contract
   * @param {BigNumber} balance - token balance to set
   * @return {Promise<boolean>} if the operation succedded
   */
  public async setTokenBalance(account: string, tokenAddress: string, balance: BigNumber): Promise<boolean> {
    const isStorageManipulationSuccessful = await this.setTokenBalanceByStorageManipulation(
      account,
      tokenAddress,
      balance
    );
    if (!isStorageManipulationSuccessful) {
      const isBridgeImpersonationSuccessful = await this.setTokenBalanceByBridgeImpersonation(
        account,
        tokenAddress,
        balance
      );
      return isBridgeImpersonationSuccessful;
    }
    return isStorageManipulationSuccessful;
  }

  private async setTokenBalanceByBridgeImpersonation(account: string, tokenAddress: string, balance: BigNumber) {
    const bridgeAddress = "0x8eb8a3b98659cce290402893d0123abb75e3ab28";
    const signer =
      this.hre.network.name === "tenderly"
        ? await this.hre.ethers.getSigner(bridgeAddress)
        : await this.impersonate(bridgeAddress);
    const token = await this.hre.ethers.getContractAt("ERC20", tokenAddress, signer);
    const balanceOfSource = BigNumber.from((await token.balanceOf(bridgeAddress)).toString());
    console.log("balanceOfSource", balanceOfSource.toString());
    console.log("balance", balance.toString());
    if (balanceOfSource.lt(balance)) {
      balance = balanceOfSource.div(10);
      console.warn(
        "Absurd amount of money requested, even Avalanche Bridge is too poor to handle it sending only ",
        balance.toString()
      );
    }
    try {
      await token.transfer(account, balance.toString());
      const balanceAfter = await token.balanceOf(account);
      return balance < balanceAfter;
    } catch (ex) {
      console.log(ex);
      return false;
    }
  }

  private async setTokenBalanceByStorageManipulation(
    account: string,
    tokenAddress: string,
    balance: BigNumber
  ): Promise<boolean> {
    try {
      const slot = await this.findBalancesSlot(tokenAddress);
      let index = this.hre.ethers.utils.solidityKeccak256(["uint256", "uint256"], [account, slot]);
      if (index.startsWith("0x0")) index = "0x" + index.slice(3);

      await this.hre.ethers.provider.send("hardhat_setStorageAt", [
        tokenAddress,
        index,
        this.hre.ethers.utils.hexZeroPad(balance.toHexString(), 32),
      ]);
      // const token = await this.hre.ethers.getContractAt("ERC20", tokenAddress);
      const token = new this.hre.ethers.Contract(tokenAddress, erc20abi);
      const balanceAfter = await token.balanceOf(account);
      return balance == balanceAfter;
    } catch (ex) {
      return false;
    }
  }
}

export function logGasUsage(receipt: ContractReceipt, methodName: string) {
  CONFIG.logGasUsage ? console.log(`gas used ${methodName}`, receipt.gasUsed.toString()) : null;
}
