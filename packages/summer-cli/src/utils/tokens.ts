import { ADDRESSES, Address } from '@oasisdex/addresses';
import { Network, SupportedNetowkrs } from './network';
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
    [Network.GOERLI]: '0x112EC3b862AB061609Ef01D308109a6691Ee6a2d',
    [Network.BASE]: '0xc68a33de9ceac7bdaed242ae1dc40d673ed4f643',
    [Network.ARBITRUM]: '0x2d070ed1321871841245d8ee5b84bd2712644322',
    [Network.OPTIMISM]: '0x1eed63efba5f81d95bfe37d82c8e736b974f477b',
  },
  USDC: {
    [Network.MAINNET]: '0xDa9CE944a37d218c3302F6B82a094844C6ECEb17',
    [Network.GOERLI]: '0xF2f86B76d1027f3777c522406faD710419C80bbB',
    [Network.BASE]: '0x20fe51a9229eef2cf8ad9e89d91cab9312cf3b7a',
    [Network.ARBITRUM]: '0xf89d7b9c864f589bbf53a82105107622b35eaa40',
    [Network.OPTIMISM]: '0xc8373edfad6d5c5f600b6b2507f78431c5271ff5',
  },
  WBTC: {
    [Network.MAINNET]: '0x7f62f9592b823331E012D3c5DdF2A7714CfB9de2',
    [Network.GOERLI]: '0xa473CdDD6E4FAc72481dc36f39A409D86980D187',
    [Network.BASE]: null,
    [Network.ARBITRUM]: null,
    [Network.OPTIMISM]: null,
  },
  STETH: {
    [Network.MAINNET]: '0xa980d4c0C2E48d305b582AA439a3575e3de06f0E',
    [Network.GOERLI]: '0xB613E78E2068d7489bb66419fB1cfa11275d14da',
    [Network.BASE]: null,
    [Network.ARBITRUM]: null,
    [Network.OPTIMISM]: null,
  },
  WSTETH: {
    [Network.MAINNET]: '0x248cCBf4864221fC0E840F29BB042ad5bFC89B5c',
    [Network.GOERLI]: '0xa5F1d7D49F581136Cf6e58B32cBE9a2039C48bA1',
    [Network.BASE]: null,
    [Network.ARBITRUM]: null,
    [Network.OPTIMISM]: null,
  },
};

export function isSupportedToken(token: string): token is SupportedTokens {
  return tokens.includes(token as any);
}

export const allowedTokensLowerCased = tokens.map<
  Lowercase<(typeof tokens)[number]>
>((token) => token.toLocaleLowerCase() as Lowercase<(typeof tokens)[number]>);

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
