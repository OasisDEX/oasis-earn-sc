import { Address } from '@oasisdex/addresses';
import axios from 'axios';
import { ethers } from 'ethers';

import { createEnviroment, Enviroment } from '../logic/common/enviroment';

function getWallet(wallet = process.env.WALLET): Address {
  if (!ethers.utils.isAddress(wallet)) {
    console.warn(
      `Invalid wallet address ${wallet}. Defaulting to 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \nprivate key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80\n`,
    );
    return '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
  }

  return wallet;
}

async function getRpc(chainId = 1): Promise<string> {
  let rpc = process.env.RPC;
  if (!rpc) {
    rpc = await createFork(chainId);
  }
  if (!rpc) {
    throw new Error(`Invalid rpc ${rpc}`);
  }

  return rpc;
}

export async function getEnvironment(): Promise<Enviroment> {
  return createEnviroment(getWallet(), await getRpc());
}

async function createFork(chainId: number) {
  if (process.env.TENDERLY_ACCESS_KEY === undefined) {
    throw new Error('TENDERLY_ACCESS_KEY is not defined');
  }
  if (process.env.TENDERLY_USERNAME === undefined) {
    throw new Error('TENDERLY_USERNAME is not defined');
  }
  if (process.env.TENDERLY_PROJECT === undefined) {
    throw new Error('TENDERLY_PROJECT is not defined');
  }
  const fork = await axios.post(
    `https://api.tenderly.co/api/v1/account/${process.env.TENDERLY_USERNAME}/project/${process.env.TENDERLY_PROJECT}/fork`,
    {
      network_id: '1',
      chain_config: {
        chain_id: chainId,
        shanghai_time: new Date().getTime(),
      },
    },
    {
      headers: {
        'X-Access-Key': process.env.TENDERLY_ACCESS_KEY as string,
      },
    },
  );
  const forkId = fork.data.simulation_fork.id;
  const rpcUrl = `https://rpc.tenderly.co/fork/${forkId}`;
  console.log(`Created fork ${forkId} with rpc ${rpcUrl}`);
  if (!forkId) {
    throw new Error('Fork not created');
  }
  return rpcUrl;
}
