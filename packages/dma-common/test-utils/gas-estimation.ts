import { TransactionReceipt } from '@ethersproject/providers'
import BigNumber from 'bignumber.js'
import { BigNumberish } from 'ethers'

/**
 * Returns save() and print() api
 * Save tx details to estimates array
 * Print all gas costs at end of describe block
 * Inside after() call
 */
export type GasEstimateHelper = {
  save: (txReceipt: TransactionReceipt, testName?: string) => void
  print: () => void
}

export const gasEstimateHelper: () => GasEstimateHelper = () => {
  const shouldUseEstimates = process.env.REPORT_GAS === '1'

  const estimates: {
    test?: string
    gasUsed: BigNumberish
    gasPrice: BigNumberish
    [`cost (gwei)`]: BigNumber
  }[] = []

  return {
    save: (txReceipt: TransactionReceipt, testName?: string) => {
      if (txReceipt instanceof Error) return null

      estimates.push({
        gasUsed: txReceipt.gasUsed,
        gasPrice: txReceipt.effectiveGasPrice,
        [`cost (gwei)`]: new BigNumber(txReceipt.gasUsed.toNumber())
          .times(new BigNumber(txReceipt.effectiveGasPrice.toNumber()))
          .div(1e9),
        ...(testName ? { test: testName } : {}),
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
            .reduce((acc, { test, ...x }, idx) => {
              test ? (acc[test] = x) : (acc[idx] = x)
              return acc
            }, {} as Record<string, unknown>),
          ['gasUsed', 'gasPrice', 'cost (gwei)'],
        )

      shouldUseEstimates && console.log('  --- --- --- --- ---')
    },
  }
}
