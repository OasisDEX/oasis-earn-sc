import "@nomiclabs/hardhat-ethers";

import { EventFragment } from "@ethersproject/abi";
import { FactoryOptions } from "@nomiclabs/hardhat-ethers/types";
import { BigNumber, constants, Contract, ContractReceipt, Signer } from "ethers";
import hre, { ethers } from "hardhat";
import { HardhatRuntimeEnvironment, Network } from "hardhat/types/runtime";

import { Token, WETH } from "../../typechain-types";

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
export const trace: TraceItem[] = [];

export class HardhatUtils {
  constructor(public readonly hre: HardhatRuntimeEnvironment, public readonly forked?: Network) {}
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
  public printTrace() {
    return JSON.stringify(trace, null, 2);
  }
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
  public async sendLotsOfMoney(target: string, token: Token | WETH, mainnet = false) {
    if (mainnet) {
      console.log("sendLotsOfMoney - setTokenBalance", target);
      await this.setTokenBalance(target, token.address, BigNumber.from("1000000000000000000").mul(1000));
    } else {
      console.log("sendLotsOfMoney - mint", target);
      await token.mint(target, BigNumber.from("1000000000000000000").mul(1000));
    }
  }

  public async performSimulation(data: BasicSimulationData) {
    console.log("performSimulation", data);
    const provider = new ethers.providers.JsonRpcProvider(
      "https://rpc.tenderly.co/fork/bbac2e6d-3c56-4b72-9d1a-3a6faec78814"
    );
    await provider.send("tenderly_simulateTransaction", [
      {
        data: data.data,
        from: data.from,
        to: data.to,
      },
      "pending",
      null,
    ]);
  }

  public async deployContract<T extends Contract>(
    contractName: string,
    args: any[],
    signerOrOptions?: Signer | FactoryOptions | undefined
  ): Promise<T> {
    const factory = await ethers.getContractFactory(contractName, signerOrOptions);
    const contract = (await factory.deploy(...args)) as unknown as T;
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
    const contract = (await ethers.getContractAt(contractName, contractAddress)) as unknown as T;
    return contract;
  }

  public async impersonate(user: string): Promise<Signer> {
    await this.impersonateAccount(user);
    const newSigner = await this.hre.ethers.getSigner(user);
    return newSigner;
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
    const token = await this.hre.ethers.getContractAt("ERC20", tokenAddress);
    for (let i = 0; i < 100; i++) {
      let probedSlot = this.hre.ethers.utils.keccak256(encode(["address", "uint"], [account, i]));
      // remove padding for JSON RPC
      while (probedSlot.startsWith("0x0")) probedSlot = "0x" + probedSlot.slice(3);
      const prev = await this.hre.network.provider.send("eth_getStorageAt", [tokenAddress, probedSlot, "latest"]);
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
    const slot = await this.findBalancesSlot(tokenAddress);
    let index = this.hre.ethers.utils.solidityKeccak256(["uint256", "uint256"], [account, slot]);
    if (index.startsWith("0x0")) index = "0x" + index.slice(3);

    await this.hre.ethers.provider.send("hardhat_setStorageAt", [
      tokenAddress,
      index,
      this.hre.ethers.utils.hexZeroPad(balance.toHexString(), 32),
    ]);
    const token = await this.hre.ethers.getContractAt("ERC20", tokenAddress);
    const balanceAfter = await token.balanceOf(account);
    return balance == balanceAfter;
  }
}
