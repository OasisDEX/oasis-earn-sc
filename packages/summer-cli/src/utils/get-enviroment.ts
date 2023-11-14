import { Address } from '@oasisdex/addresses';
import { ethers } from 'ethers';

import { createEnviroment, Enviroment } from '../logic/common/enviroment';

function getWallet(): Address {
  const wallet = process.env.WALLET;

  if (!ethers.utils.isAddress(wallet)) {
    throw new Error(`Invalid wallet address ${wallet}`);
  }

  return wallet;
}

function getRpc(): string {
  const rpc = process.env.RPC;

  if (!rpc) {
    throw new Error(`Invalid rpc ${rpc}`);
  }

  return rpc;
}

export async function getEnvitoment(): Promise<Enviroment> {
  return createEnviroment(getWallet(), getRpc());
}
