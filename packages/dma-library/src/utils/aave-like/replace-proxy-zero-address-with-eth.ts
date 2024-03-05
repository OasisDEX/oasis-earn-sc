import { ADDRESS_ZERO } from '@deploy-configurations/constants'

// helper function to avoid passing zero address when reading data from protocol
// address zero in some cases has data on chain which leads to miss leading values on UI
// while opening position
export const replaceProxyZeroAddressWithEth = (proxy: string) =>
  proxy.toLowerCase() === ADDRESS_ZERO.toLowerCase()
    ? '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
    : proxy
