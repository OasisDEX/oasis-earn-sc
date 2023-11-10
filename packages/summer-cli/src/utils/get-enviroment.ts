import { Address } from '@oasisdex/deploy-configurations/types/address';
import { createEnviroment, Enviroment } from '../logic/common/enviroment';
import 'dotenv/config';
import { isAddress } from 'ethers';

function getWallet(): Address {
  const wallet = process.env.WALLET;

  if (!isAddress(wallet)) {
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
