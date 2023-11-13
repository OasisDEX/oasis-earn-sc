import ERC20 from '@oasisdex/abis/external/tokens/IERC20.json';
import { IERC20 } from '@oasisdex/abis/types/ethers-contracts/tokens/IERC20';
import { Contract, TransactionReceipt } from 'ethers';
import {
  SupportedTokens,
  getTokenAddress,
  tokenAmountToWei,
} from '../../utils/tokens';
import { sendTxFromAddress } from '../../utils/tx';
import type { Enviroment } from './enviroment';
import { Address } from '@oasisdex/addresses';

export async function setAllowance(
  enviroment: Enviroment,
  owner: Address,
  allowedAddress: Address,
  token: SupportedTokens,
  amount: number,
): Promise<TransactionReceipt> {
  const tokenAddress = getTokenAddress(token, enviroment.network);

  const contract = new Contract(
    tokenAddress,
    ERC20,
    enviroment.provider,
  ) as any as IERC20;

  const txData = await contract.approve.populateTransaction(
    allowedAddress,
    tokenAmountToWei(token, amount),
  );

  return sendTxFromAddress(txData, owner, enviroment.provider);
}
