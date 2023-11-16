// export from the addresses library does not work, it seems like it's just a type not a value
export enum Network {
  MAINNET = 'mainnet',
  GOERLI = 'goerli',
  HARDHAT = 'hardhat',
  OPTIMISM = 'optimism',
  ARBITRUM = 'arbitrum',
  BASE = 'base',
  LOCAL = 'local',
  TENDERLY = 'tenderly',
}

export const networkById = {
  '1': Network.MAINNET,
  '5': Network.GOERLI,
  '8453': Network.BASE,
  '42161': Network.ARBITRUM,
  '10': Network.OPTIMISM,
} as const;

export type SupportedNetowkrs = (typeof networkById)[keyof typeof networkById];

export function chainIdToSupportedNetowrk(
  chainId: string,
): SupportedNetowkrs | undefined {
  return networkById[chainId.toString() as keyof typeof networkById];
}

export function getSupportedNetwork(chainId: string): SupportedNetowkrs {
  const netowrkCandidate = chainIdToSupportedNetowrk(chainId);

  if (!netowrkCandidate) {
    throw new Error(`Unsupported network with chainId ${chainId}`);
  }

  return netowrkCandidate;
}
