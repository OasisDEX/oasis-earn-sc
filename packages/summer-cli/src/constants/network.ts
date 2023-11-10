
import { Network } from "@deploy-configurations"

export const networkById = {
  "1": Network.MAINNET,
  "5": Network.GOERLI,
  "8453": Network.BASE,
  "42161": Network.ARBITRUM,
  "10": Network.OPTIMISM,
} as const;

export type SupportedNetowkrs = typeof networkById[keyof typeof networkById];

export function chainIdToSupportedNetowrk(chainId: string): SupportedNetowkrs | undefined {
  return networkById[chainId.toString() as keyof typeof networkById]
}