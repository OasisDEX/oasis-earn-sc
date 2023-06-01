import { Address } from '@deploy-configurations/types/address'

export function areAddressesEqual(address1: Address, address2: Address): boolean {
  return address1.toLowerCase() === address2.toLowerCase()
}
