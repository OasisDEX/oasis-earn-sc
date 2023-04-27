import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

import { RiskRatio } from '../../../packages/oasis-actions/lib/packages/oasis-actions/src'
import { strategies, ZERO } from '../../../packages/oasis-actions/src'
import { getPoolData } from '../helpers/data'

describe.only('Open multiply', () => {
  it('Opens multiply', async () => {
    const open = await strategies.ajna.multiply.open(
      {
        collateralToken: { symbol: 'ETH', precision: 18 },
        debtToken: { symbol: 'USDC', precision: 18 },
        multiple: new RiskRatio(new BigNumber(2), RiskRatio.TYPE.LTV),
        slippage: new BigNumber(0.01),
        depositedByUser: {
          collateralToken: { amountInBaseUnit: new BigNumber(1) },
          debtToken: { amountInBaseUnit: ZERO },
        },
      },
      {
        getPoolData: getPoolData(),
        getSwapData: () => Promise.resolve({} as any),
        isDPMProxy: true,
        poolAddress: '0x0000000000000000000000000000000000000000',
        poolInfoAddress: '0x0000000000000000000000000000000000000000',
        proxy: '0xproxy',
        provider: ethers.getDefaultProvider('goerli'),
        user: '0xuser',
      },
    )
  })
})
