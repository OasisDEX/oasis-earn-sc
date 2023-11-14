import { BigNumber } from 'bignumber.js';
import { ethers } from 'ethers';

import {
  getTokenAddress,
  SupportedTokens,
  tokenAmountToWei,
} from '../../utils/tokens';
import type { Enviroment } from './enviroment';

export async function getTenderlyEth(enviroment: Enviroment, amount: number) {
  return enviroment.provider.send('tenderly_setBalance', [
    await enviroment.walletSigner.getAddress(),
    `0x${new BigNumber(tokenAmountToWei('WETH', amount)).toString(16)}`,
  ]);
}

export async function getTokens(
  enviroment: Enviroment,
  token: SupportedTokens,
  amount: number,
): Promise<ethers.providers.TransactionReceipt> {
  const tokenAddress = getTokenAddress(token, enviroment.network);
  return enviroment.provider.send('tenderly_setErc20Balance', [
    tokenAddress,
    await enviroment.walletSigner.getAddress(),
    `0x${new BigNumber(tokenAmountToWei(token, amount)).toString(16)}`,
  ]);
}
