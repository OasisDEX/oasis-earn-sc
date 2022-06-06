import "@nomiclabs/hardhat-ethers";
import { Signer } from "ethers";
import { ethers } from "hardhat";
import DS_PROXY_REGISTRY_ABI from "../abi/ds-proxy-factory.json";

export async function getOrCreateProxy(signer: Signer) {
  const PROXY_REGISTRY_MAINET = "0x4678f0a6958e4D2Bc4F1BAF7Bc52E8F3564f3fE4";
  const address = await signer.getAddress();

  const dsProxyRegistry = await ethers.getContractAt(
    DS_PROXY_REGISTRY_ABI,
    PROXY_REGISTRY_MAINET,
    signer
  );

  let proxyAddress = await dsProxyRegistry.proxies(address);

  if (proxyAddress === ethers.constants.AddressZero) {
    await (await dsProxyRegistry["build()"]()).wait();
    proxyAddress = await dsProxyRegistry.proxies(address);
  }

  return proxyAddress;
}
