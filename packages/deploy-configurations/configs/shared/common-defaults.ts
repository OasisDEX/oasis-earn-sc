import { ADDRESS_ZERO } from '@deploy-configurations/constants'

// defaults for easily adding ADDRESS_ZERO addresses to tokens across all networks
// Just add override of the default for each network if you want to use that token

export const commonDefaults = {
  ARB: {
    name: 'ARB',
    address: ADDRESS_ZERO,
  },
  CRV: {
    name: 'CRV',
    address: ADDRESS_ZERO,
  },
  // For MKR use McdGov instead
  // MKR: {
  //   name: 'MKR',
  //   address: ADDRESS_ZERO,
  // },
  OP: {
    name: 'OP',
    address: ADDRESS_ZERO,
  },
  SUSD: {
    name: 'SUSD',
    address: ADDRESS_ZERO,
  },
  RPL: {
    name: 'RPL',
    address: ADDRESS_ZERO,
  },
} as const
