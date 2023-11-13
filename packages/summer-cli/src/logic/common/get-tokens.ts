import * as ERC20 from '@oasisdex/abis/external/tokens/IERC20.json';
import { IERC20 } from '@oasisdex/abis/types/ethers-contracts/external/tokens/IERC20';
import { Contract } from 'ethers';
import {
  SupportedTokens,
  getTokenAddress,
  getTokenHolder,
  tokenAmountToWei,
} from '../../utils/tokens';
import { Enviroment } from './enviroment';

export async function getTokens(
  enviroment: Enviroment,
  token: SupportedTokens,
  amount: number,
) {
  const holder = getTokenHolder(token, enviroment.network);

  const tokenAddress = getTokenAddress(token, enviroment.network);
  const holderSigner = await enviroment.provier.getSigner(holder);

  const contract = new Contract(
    tokenAddress,
    ERC20,
    holderSigner,
  ) as any as IERC20;

  const tx = await contract.transfer(
    await enviroment.walletSigner.getAddress(),
    tokenAmountToWei(token, amount),
  );

  console.log(tx)
}
