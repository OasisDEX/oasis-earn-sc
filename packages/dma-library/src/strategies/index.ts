import { aave } from './aave'
import { ajna } from './ajna'

export { AaveVersion, getAaveTokenAddress } from './aave'

export const strategies: {
  aave: typeof aave
  ajna: typeof ajna
} = {
  aave,
  ajna,
}
