import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";
import init, { resetNode } from "../helpers/init";
import { JsonRpcProvider } from "@ethersproject/providers";
import { RuntimeConfig, WithRuntimeConfig, Debug } from "../helpers/types";
import { getOrCreateProxy } from "../helpers/proxy";
import { swapUniswapTokens } from "../helpers/swap";
import ADDRESSES from "../helpers/addresses.json";
import { deploy } from "../helpers/contract";

describe("Architecture:", async () => {
  let provider: JsonRpcProvider;
  let config: RuntimeConfig;
  let signer: Signer;
  let address: string;
  let proxyAddress: string;
  let options: Debug & WithRuntimeConfig;

  before(async () => {
    config = await init();
    ({ provider, signer, address } = config);
    proxyAddress = await getOrCreateProxy(signer);
    options = {
      debug: false,
      config,
    };
  });

  beforeEach(async () => {
    await resetNode(provider!, parseInt(process.env.BLOCK_NUMBER!));
    await swapUniswapTokens(
      ADDRESSES.main.WETH,
      ADDRESSES.main.DAI,
      ethers.utils.parseEther("200").toString(),
      ethers.utils.parseEther("0.1").toString(),
      address,
      config
    );
  });

  describe("delegatecall", async () => {
    const CONTRACT_A_STATE = 13;
    const CONTRACT_1B_STATE = 17;
    let NEW_STATE = 77;
    let contractA: Contract;
    let contractAAddress: string;
    let contract1B: Contract;
    let contract1BAddress: string;
    let contract2B: Contract;
    let contract2BAddress: string;

    beforeEach(async () => {
      [contractA, contractAAddress] = await deploy(
        "ContractA",
        [CONTRACT_A_STATE],
        options
      );
      [contract1B, contract1BAddress] = await deploy(
        "Contract1B",
        [CONTRACT_1B_STATE],
        options
      );
      [contract2B, contract2BAddress] = await deploy("Contract2B", [], options);
    });

    it("delegatee and delegator sharing same storage variable", async function () {
      await contract1B.execute(contractAAddress, NEW_STATE);
      expect(await contract1B.state()).to.equal(NEW_STATE);
      expect(await contractA.state()).to.equal(CONTRACT_A_STATE);
    });

    it("delegator not having a storage variable", async function () {
      NEW_STATE = 55;
      await contract2B.execute(contractAAddress, NEW_STATE);
      expect(await contractA.state()).to.equal(CONTRACT_A_STATE);
      try {
        await contract2B.state();
      } catch (e: any) {
        expect(e.message).to.equal("contract2B.state is not a function");
      }
    });
  });
});
