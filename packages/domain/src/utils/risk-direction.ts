import BigNumber from 'bignumber.js'

export function isRiskIncreasing(targetLTV: BigNumber, currentLTV: BigNumber) {
  let isIncreasingRisk = false
  if (targetLTV.gt(currentLTV)) {
    isIncreasingRisk = true
  }
  return isIncreasingRisk
}
