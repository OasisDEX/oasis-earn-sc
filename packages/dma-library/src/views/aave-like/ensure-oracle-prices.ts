import BigNumber from 'bignumber.js'

export function ensureOraclePricesDefined(
  collateralPrice: BigNumber | undefined,
  debtPrice: BigNumber | undefined,
): [BigNumber, BigNumber] {
  if (collateralPrice === undefined || debtPrice === undefined) {
    throw new Error('Cannot determine oracle price')
  }
  return [collateralPrice, debtPrice]
}
