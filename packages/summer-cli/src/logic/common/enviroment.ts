import { ethers, JsonRpcSigner, JsonRpcProvider } from 'ethers';
import { SupportedNetowkrs, getSupportedNetwork } from '../../utils/network';
import { Address } from '@oasisdex/deploy-configurations/types/address';

export interface Enviroment {
  walletSigner: JsonRpcSigner;
  provier: JsonRpcProvider;
  network: SupportedNetowkrs;
}

export async function createEnviroment(
  wallet: Address,
  rpc: string,
): Promise<Enviroment> {
  const provier = new ethers.JsonRpcProvider(rpc);

  const network = await provier.getNetwork();

  return {
    walletSigner: new JsonRpcSigner(provier, wallet),
    provier,
    network: getSupportedNetwork(network.chainId.toString()),
  };
}
