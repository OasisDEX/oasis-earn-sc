import { CONTRACT_NAMES } from '@deploy-configurations/constants'

export const config = {
  mpa: {
    core: {
      Swap: {
        name: 'uSwap',
        deploy: true,
        address: '',
        serviceRegistryName: CONTRACT_NAMES.common.SWAP,
        history: [],
        constructorArgs: [
          '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266', // HH wallet
          '0xC7b548AD9Cf38721810246C079b2d8083aba8909',
          20,
          'address:ServiceRegistry',
        ],
      },
    },
    actions: {},
  },
}