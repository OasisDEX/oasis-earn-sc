import 'dotenv/config';

import { Address } from '@oasisdex/deploy-configurations/types/address';
import { ethers } from 'ethers';

import { getSupportedNetwork, SupportedNetowkrs } from '../../utils/network';

export interface Enviroment {
  walletSigner: ethers.Signer;
  provider: ethers.providers.JsonRpcProvider;
  network: SupportedNetowkrs;
}

export async function createEnviroment(
  wallet: Address,
  rpc: string,
): Promise<Enviroment> {
  const provider = new ethers.providers.JsonRpcProvider(rpc);

  const network = await provider.getNetwork();

  return {
    walletSigner: new ethers.VoidSigner(wallet, provider),
    provider,
    network: getSupportedNetwork(network.chainId.toString()),
  };
}
