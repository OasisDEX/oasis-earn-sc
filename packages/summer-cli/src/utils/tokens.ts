import { ADDRESSES, Address, ADDRESS_ZERO } from '@oasisdex/addresses';
import { SupportedNetowkrs } from './network';
import BigNumber from 'bignumber.js';

export const tokens = [
  'WETH',
  'DAI',
  'USDC',
  'WBTC',
  'STETH',
  'WSTETH',
  'CBETH',
  'USDBC',
] as const;

export type SupportedTokens = (typeof tokens)[number];

export const tokenPrecision: Record<SupportedTokens, number> = {
  WETH: 18,
  DAI: 18,
  USDC: 6,
  WBTC: 8,
  STETH: 18,
  WSTETH: 18,
  CBETH: 18,
  USDBC: 6,
};

export function isSupportedToken(token: string): token is SupportedTokens {
  return tokens.includes(token as any);
}

export const allowedTokensLowerCased = tokens.map<
  Lowercase<(typeof tokens)[number]>
>((token) => token.toLocaleLowerCase() as Lowercase<(typeof tokens)[number]>);

export function getTokenAddress(
  token: SupportedTokens,
  network: SupportedNetowkrs,
): Address {
  const tokenAddress = ADDRESSES[network].common[token];

  if (tokenAddress === ADDRESS_ZERO) {
    throw new Error(`Token ${token} is not supported on network ${network}`);
  }

  return tokenAddress;
}

export function tokenAmountToWei(
  token: SupportedTokens,
  amount: number,
): string {
  const precision = tokenPrecision[token];
  const multiplier = new BigNumber(10).pow(precision);

  return new BigNumber(amount).times(multiplier).toString();
}
