import BigNumber from 'bignumber.js'

export function determineRiskDirection(targetLTV: BigNumber, currentLTV: BigNumber) {
  let isIncreasingRisk = false
  if (targetLTV.gt(currentLTV)) {
    isIncreasingRisk = true
  }
  return isIncreasingRisk
}
