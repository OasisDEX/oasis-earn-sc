import { Address } from '@oasisdex/addresses';
import { ethers, JsonRpcProvider, JsonRpcSigner } from 'ethers';

import { getSupportedNetwork, SupportedNetowkrs } from '../../utils/network';

export interface Enviroment {
  walletSigner: JsonRpcSigner;
  provider: JsonRpcProvider;
  network: SupportedNetowkrs;
}

export async function createEnviroment(
  wallet: Address,
  rpc: string,
): Promise<Enviroment> {
  const provider = new ethers.JsonRpcProvider(rpc);

  const network = await provider.getNetwork();

  return {
    walletSigner: new JsonRpcSigner(provider, wallet),
    provider,
    network: getSupportedNetwork(network.chainId.toString()),
  };
}
