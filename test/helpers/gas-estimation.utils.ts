import { TransactionReceipt } from '@ethersproject/providers'
import BigNumber from 'bignumber.js'
import { BigNumberish } from 'ethers'

/**
 * Returns save() and print() api
 * Save tx details to estimates array
 * Print all gas costs at end of describe block
 * Inside after() call
 */
type GasEstimateHelper = () => {
  save: (testName: string, txReceipt: TransactionReceipt) => void
  print: () => void
}

export const gasEstimateHelper: GasEstimateHelper = () => {
  const shouldUseEstimates = process.env.USE_GAS_ESTIMATES === '1'

  const estimates: {
    test: string
    gasUsed: BigNumberish
    gasPrice: BigNumberish
    [`cost (gwei)`]: BigNumber
  }[] = []

  return {
    save: (testName: string, txReceipt: TransactionReceipt) => {
      if (txReceipt instanceof Error) return null

      estimates.push({
        test: testName,
        gasUsed: txReceipt.gasUsed,
        gasPrice: txReceipt.effectiveGasPrice,
        [`cost (gwei)`]: new BigNumber(txReceipt.gasUsed.toNumber())
          .times(new BigNumber(txReceipt.effectiveGasPrice.toNumber()))
          .div(1e9),
      })
    },
    print: () => {
      shouldUseEstimates &&
        console.table(
          estimates
            .map(e => ({
              ...e,
              gasUsed: e.gasUsed.toString(),
              gasPrice: e.gasPrice.toString(),
              [`cost (gwei)`]: e[`cost (gwei)`].toString(),
            }))
            .reduce((acc, { test, ...x }) => {
              acc[test] = x
              return acc
            }, {}),
          ['gasUsed', 'gasPrice', 'cost (gwei)'],
        )

      console.log('  --- --- --- --- ---')
    },
  }
}
