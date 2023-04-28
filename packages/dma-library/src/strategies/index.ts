import { aave } from './aave'
import { ajna } from './ajna'

export { AaveVersion } from './aave'
export const strategies: {
  aave: typeof aave
  ajna: typeof ajna
} = {
  aave,
  ajna,
}
