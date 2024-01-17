import { ADDRESS_ZERO } from '@deploy-configurations/constants'

export const commonDefaults = {
  ARB: {
    name: 'ARB',
    address: ADDRESS_ZERO,
  },
  MKR: {
    name: 'MKR',
    address: ADDRESS_ZERO,
  },
  OP: {
    name: 'OP',
    address: ADDRESS_ZERO,
  },
  SUSD: {
    name: 'SUSD',
    address: ADDRESS_ZERO,
  },
} as const
