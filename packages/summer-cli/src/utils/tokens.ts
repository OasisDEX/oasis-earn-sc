import { Network } from '@oasisdex/deploy-configurations/types/network';
import { ADDRESSES } from '@oasisdex/deploy-configurations/addresses';
import { Address } from '@oasisdex/deploy-configurations/types/address';
import { SupportedNetowkrs } from './network';
import BigNumber from 'bignumber.js';

export const tokens = [
  'WETH',
  'DAI',
  'USDC',
  'WBTC',
  'STETH',
  'WSTETH',
] as const;

export type SupportedTokens = (typeof tokens)[number];

export const tokenPrecision: Record<SupportedTokens, number> = {
  WETH: 18,
  DAI: 18,
  USDC: 6,
  WBTC: 8,
  STETH: 18,
  WSTETH: 18,
};

export const tokenHolders: Record<
  SupportedTokens,
  Record<SupportedNetowkrs, Address | null>
> = {
  WETH: {
    // in case of WETH we will just wrap ETH
    [Network.MAINNET]: ADDRESSES[Network.MAINNET].common.WETH,
    [Network.GOERLI]: ADDRESSES[Network.GOERLI].common.WETH,
    [Network.BASE]: ADDRESSES[Network.BASE].common.WETH,
    [Network.ARBITRUM]: ADDRESSES[Network.ARBITRUM].common.WETH,
    [Network.OPTIMISM]: ADDRESSES[Network.OPTIMISM].common.WETH,
  },
  DAI: {
    [Network.MAINNET]: '0x60FaAe176336dAb62e284Fe19B885B095d29fB7F',
    [Network.GOERLI]: ADDRESSES[Network.GOERLI].common.DAI,
    [Network.BASE]: ADDRESSES[Network.BASE].common.DAI,
    [Network.ARBITRUM]: ADDRESSES[Network.ARBITRUM].common.DAI,
    [Network.OPTIMISM]: ADDRESSES[Network.OPTIMISM].common.DAI,
  },
  USDC: {
    [Network.MAINNET]: '0xDa9CE944a37d218c3302F6B82a094844C6ECEb17',
    [Network.GOERLI]: ADDRESSES[Network.GOERLI].common.USDC,
    [Network.BASE]: ADDRESSES[Network.BASE].common.USDC,
    [Network.ARBITRUM]: ADDRESSES[Network.ARBITRUM].common.USDC,
    [Network.OPTIMISM]: ADDRESSES[Network.OPTIMISM].common.USDC,
  },
  WBTC: {
    [Network.MAINNET]: '0x7f62f9592b823331E012D3c5DdF2A7714CfB9de2',
    [Network.GOERLI]: ADDRESSES[Network.GOERLI].common.WBTC,
    [Network.BASE]: ADDRESSES[Network.BASE].common.WBTC,
    [Network.ARBITRUM]: ADDRESSES[Network.ARBITRUM].common.WBTC,
    [Network.OPTIMISM]: ADDRESSES[Network.OPTIMISM].common.WBTC,
  },
  STETH: {
    [Network.MAINNET]: '0xa980d4c0C2E48d305b582AA439a3575e3de06f0E',
    [Network.GOERLI]: null,
    [Network.BASE]: null,
    [Network.ARBITRUM]: null,
    [Network.OPTIMISM]: null,
  },
  WSTETH: {
    [Network.MAINNET]: '0x248cCBf4864221fC0E840F29BB042ad5bFC89B5c',
    [Network.GOERLI]: null,
    [Network.BASE]: null,
    [Network.ARBITRUM]: null,
    [Network.OPTIMISM]: null,
  },
};

export function isSupportedToken(token: string): token is SupportedTokens {
  return tokens.includes(token as any);
}

export function getTokenHolder(
  token: SupportedTokens,
  network: SupportedNetowkrs,
): Address {
  const holder = tokenHolders[token][network];

  if (!holder) {
    throw new Error(`Token ${token} is not supported on network ${network}`);
  }

  return holder;
}

export function getTokenAddress(
  token: SupportedTokens,
  network: SupportedNetowkrs,
): Address {
  return ADDRESSES[network].common[token];
}

export function tokenAmountToWei(
  token: SupportedTokens,
  amount: number,
): string {
  const precision = tokenPrecision[token];
  const multiplier = new BigNumber(10).pow(precision);

  return new BigNumber(amount).times(multiplier).toString();
}
