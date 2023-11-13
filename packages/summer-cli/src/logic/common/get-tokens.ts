import { ethers, TransactionReceipt } from 'ethers';

import {
  getTokenAddress,
  SupportedTokens,
  tokenAmountToWei,
} from '../../utils/tokens';
import type { Enviroment } from './enviroment';

export async function getTenderlyEth(enviroment: Enviroment, amount: number) {
  return enviroment.provider.send('tenderly_setBalance', [
    await enviroment.walletSigner.getAddress(),
    ethers.toQuantity(BigInt(tokenAmountToWei('WETH', amount))),
  ]);
}

export async function getTokens(
  enviroment: Enviroment,
  token: SupportedTokens,
  amount: number,
): Promise<TransactionReceipt> {
  const tokenAddress = getTokenAddress(token, enviroment.network);
  return enviroment.provider.send('tenderly_setErc20Balance', [
    tokenAddress,
    await enviroment.walletSigner.getAddress(),
    ethers.toQuantity(BigInt(tokenAmountToWei(token, amount))),
  ]);
}
