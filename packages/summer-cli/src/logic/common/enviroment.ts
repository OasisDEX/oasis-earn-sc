import { ethers, JsonRpcSigner, JsonRpcProvider } from 'ethers';
import { SupportedNetowkrs } from '../../utils/network';
import { Address } from '@oasisdex/deploy-configurations/types/address';

export interface Enviroment {
  walletSigner: JsonRpcSigner;
  provier: JsonRpcProvider;
  network: SupportedNetowkrs;
}

export function createEnviroment(wallet: Address, rpc: string, network: SupportedNetowkrs): Enviroment {
  const provier = new ethers.JsonRpcProvider(rpc);

  return {
    walletSigner: new JsonRpcSigner(provier, wallet),
    provier,
    network,
  };
}
