import ERC20 from '@oasisdex/abis/external/tokens/IERC20.json';
import WETH from '@oasisdex/abis/external/tokens/IWETH.json';
import { IERC20 } from '@oasisdex/abis/types/ethers-contracts/tokens/IERC20';
import { IWETH } from '@oasisdex/abis/types/ethers-contracts/tokens/IWETH';
import { Contract, TransactionReceipt, VoidSigner } from 'ethers';
import {
  SupportedTokens,
  getTokenAddress,
  getTokenHolder,
  tokenAmountToWei,
} from '../../utils/tokens';
import { sendTxFromAddress } from '../../utils/tx';
import type { Enviroment } from './enviroment';
import { ADDRESSES } from '@oasisdex/addresses';
import { ethers } from 'ethers';

export async function getTenderlyEth(enviroment: Enviroment, amount: number) {
  return enviroment.provider.send('tenderly_setBalance', [
    await enviroment.walletSigner.getAddress(),
    ethers.toQuantity(BigInt(tokenAmountToWei('WETH', amount))),
  ]);
}

export async function wrapEth(
  enviroment: Enviroment,
  amount: number,
): Promise<TransactionReceipt> {
  const wethAddress = ADDRESSES[enviroment.network].common.WETH;
  const contract = new Contract(
    wethAddress,
    WETH,
    enviroment.provider,
  ) as any as IWETH;

  await getTenderlyEth(enviroment, amount)

  const txData = {
    ...(await contract.deposit.populateTransaction()),
    value: ethers.toQuantity(BigInt(tokenAmountToWei('WETH', amount))),
  };

  return sendTxFromAddress(
    txData as any,
    await enviroment.walletSigner.getAddress(),
    enviroment.provider,
  );
}

export async function getERC20Token(
  enviroment: Enviroment,
  token: SupportedTokens,
  amount: number,
): Promise<TransactionReceipt> {
  const holder = getTokenHolder(token, enviroment.network);

  const tokenAddress = getTokenAddress(token, enviroment.network);
  const holderSigner = new VoidSigner(holder, enviroment.provider);

  const contract = new Contract(
    tokenAddress,
    ERC20,
    holderSigner,
  ) as any as IERC20;

  const txData = await contract.transfer.populateTransaction(
    await enviroment.walletSigner.getAddress(),
    tokenAmountToWei(token, amount),
  );

  return sendTxFromAddress(txData, holder, enviroment.provider);
}

export async function getTokens(
  enviroment: Enviroment,
  token: SupportedTokens,
  amount: number,
): Promise<TransactionReceipt> {
  if (token === 'WETH') {
    return wrapEth(enviroment, amount);
  } else {
    return getERC20Token(enviroment, token, amount);
  }
}
