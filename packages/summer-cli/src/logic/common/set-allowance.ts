import ERC20 from '@oasisdex/abis/external/tokens/IERC20.json';
import { IERC20 } from '@oasisdex/abis/types/ethers-contracts/tokens/IERC20';
import { Address } from '@oasisdex/addresses';
import { Contract, ethers } from 'ethers';

import {
  getTokenAddress,
  SupportedTokens,
  tokenAmountToWei,
} from '../../utils/tokens';
import { sendTxFromAddress } from '../../utils/tx';
import type { Enviroment } from './enviroment';

export async function setAllowance(
  enviroment: Enviroment,
  owner: Address,
  allowedAddress: Address,
  token: SupportedTokens,
  amount: number,
): Promise<ethers.providers.TransactionReceipt> {
  const tokenAddress = getTokenAddress(token, enviroment.network);

  const contract = new Contract(
    tokenAddress,
    ERC20,
    enviroment.provider,
  ) as any as IERC20;

  const txData = await contract.populateTransaction.approve(
    allowedAddress,
    tokenAmountToWei(token, amount),
  );

  return sendTxFromAddress(txData, owner, enviroment.provider);
}
