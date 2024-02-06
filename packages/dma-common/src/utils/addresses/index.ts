import { Address } from '@oasisdex/deploy-configurations/types'

export function areAddressesEqual(address1: Address, address2: Address): boolean {
  return address1.toLowerCase() === address2.toLowerCase()
}
