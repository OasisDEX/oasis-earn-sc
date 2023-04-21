import { Address } from './address'

export type Tx = {
  to: Address
  data: string
  value: string
}
