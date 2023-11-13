import ERC20 from '@oasisdex/abis/external/tokens/IERC20.json';
import { IERC20 } from '@oasisdex/abis/types/ethers-contracts/external/tokens/IERC20';
import { Contract, VoidSigner } from 'ethers';
import {
  SupportedTokens,
  getTokenAddress,
  getTokenHolder,
  tokenAmountToWei,
} from '../../utils/tokens';
import { sendTxFromAddress } from '../../utils/tx'
import type { Enviroment } from './enviroment';

export async function getTokens(
  enviroment: Enviroment,
  token: SupportedTokens,
  amount: number,
): Promise<string> {
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
  )

  const res = await sendTxFromAddress(txData, holder, enviroment.provider)

  return res
}
