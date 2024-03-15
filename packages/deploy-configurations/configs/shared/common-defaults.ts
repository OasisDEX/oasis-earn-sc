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
  USDE: {
    name: 'USDE',
    address: ADDRESS_ZERO,
  },
  RPL: {
    name: 'RPL',
    address: ADDRESS_ZERO,
  },
  SUSDE: {
    name: 'SUSDE',
    address: ADDRESS_ZERO,
  },
  CSETH: {
    name: 'CSETH',
    address: ADDRESS_ZERO,
  },
  DETH: {
    name: 'DETH',
    address: ADDRESS_ZERO,
  },
  EZETH: {
    name: 'EZETH',
    address: ADDRESS_ZERO,
  },
  MEVETH: {
    name: 'MEVETH',
    address: ADDRESS_ZERO,
  },
  MPETH: {
    name: 'MPETH',
    address: ADDRESS_ZERO,
  },
  UNIETH: {
    name: 'UNIETH',
    address: ADDRESS_ZERO,
  },
  XETH: {
    name: 'XETH',
    address: ADDRESS_ZERO,
  },
  PYUSD: {
    name: 'PYUSD',
    address: ADDRESS_ZERO,
  },
} as const
