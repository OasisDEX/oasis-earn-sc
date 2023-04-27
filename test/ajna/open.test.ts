import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { ethers } from 'ethers'

import { strategies } from '../../packages/oasis-actions/src'
import { getPoolData, getPosition } from './helpers/data'

describe.only('Ajna position validation', () => {
  describe('Validate min debt amount', async () => {
    it('Opening vault with debt less then dust', async () => {
      const depositAmount = new BigNumber(1)
      const debtAmount = new BigNumber(100)

      const open = await strategies.ajna.open(
        {
          collateralAmount: depositAmount,
          collateralPrice: new BigNumber(1700),
          collateralTokenPrecision: 18,
          dpmProxyAddress: '0x0000000000000000000000000000000000000000',
          poolAddress: '0x0000000000000000000000000000000000000000',
          quoteAmount: debtAmount,
          quotePrice: new BigNumber(1),
          quoteTokenPrecision: 6,
        },
        {
          ajnaProxyActions: '0x0000000000000000000000000000000000000000',
          getPoolData: getPoolData(),
          poolInfoAddress: '0x0000000000000000000000000000000000000000',
          provider: ethers.providers.getDefaultProvider('goerli'),
          WETH: '0xWETH',
          getPosition: getPosition(),
        },
      )

      expect(open.simulation.errors[0].name).to.eq('debt-less-then-dust-limit')
    })

    it('Opening vault with debt more then dust', async () => {
      const depositAmount = new BigNumber(2)
      const debtAmount = new BigNumber(600)

      const open = await strategies.ajna.open(
        {
          collateralAmount: depositAmount,
          collateralPrice: new BigNumber(1700),
          collateralTokenPrecision: 18,
          dpmProxyAddress: '0x0000000000000000000000000000000000000000',
          poolAddress: '0x0000000000000000000000000000000000000000',
          quoteAmount: debtAmount,
          quotePrice: new BigNumber(1),
          quoteTokenPrecision: 6,
        },
        {
          ajnaProxyActions: '0x0000000000000000000000000000000000000000',
          getPoolData: getPoolData(),
          poolInfoAddress: '0x0000000000000000000000000000000000000000',
          provider: ethers.providers.getDefaultProvider('goerli'),
          WETH: '0xWETH',
          getPosition: getPosition(),
        },
      )
      expect(open.simulation.errors.length).to.eq(0)
    })

    it('Adjusting vault to debt more under dust limit', async () => {
      const depositAmount = new BigNumber(0)
      const debtAmount = new BigNumber(600)

      const position = await getPosition({
        debt: new BigNumber(1000),
        collateral: new BigNumber(10),
      })(
        {
          proxyAddress: '0x0000000000000000000000000000000000000000',
          collateralPrice: new BigNumber(1700),
          poolAddress: '0x0000000000000000000000000000000000000000',
          quotePrice: new BigNumber(1),
        },
        {
          poolInfoAddress: '0x0000000000000000000000000000000000000000',
          getPoolData: getPoolData(),
          provider: ethers.providers.getDefaultProvider('goerli'),
        },
      )

      const payback = await strategies.ajna.paybackWithdraw(
        {
          collateralAmount: depositAmount,
          collateralTokenPrecision: 18,
          dpmProxyAddress: '0x0000000000000000000000000000000000000000',
          poolAddress: '0x0000000000000000000000000000000000000000',
          quoteAmount: debtAmount,
          quoteTokenPrecision: 6,
          position,
        },
        {
          ajnaProxyActions: '0x0000000000000000000000000000000000000000',
          getPoolData: getPoolData(),
          poolInfoAddress: '0x0000000000000000000000000000000000000000',
          provider: ethers.providers.getDefaultProvider('goerli'),
          WETH: '0xWETH',
          getPosition: getPosition(),
        },
      )

      expect(payback.simulation.errors[0].name).to.eq('debt-less-then-dust-limit')
    })

    it('Adjusting vault to debt more over dust limit', async () => {
      const depositAmount = new BigNumber(0)
      const debtAmount = new BigNumber(100)

      const position = await getPosition({
        debt: new BigNumber(1000),
        collateral: new BigNumber(10),
      })(
        {
          proxyAddress: '0x0000000000000000000000000000000000000000',
          collateralPrice: new BigNumber(1700),
          poolAddress: '0x0000000000000000000000000000000000000000',
          quotePrice: new BigNumber(1),
        },
        {
          poolInfoAddress: '0x0000000000000000000000000000000000000000',
          getPoolData: getPoolData(),
          provider: ethers.providers.getDefaultProvider('goerli'),
        },
      )

      const payback = await strategies.ajna.paybackWithdraw(
        {
          collateralAmount: depositAmount,
          collateralTokenPrecision: 18,
          dpmProxyAddress: '0x0000000000000000000000000000000000000000',
          poolAddress: '0x0000000000000000000000000000000000000000',
          quoteAmount: debtAmount,
          quoteTokenPrecision: 6,
          position,
        },
        {
          ajnaProxyActions: '0x0000000000000000000000000000000000000000',
          getPoolData: getPoolData(),
          poolInfoAddress: '0x0000000000000000000000000000000000000000',
          provider: ethers.providers.getDefaultProvider('goerli'),
          WETH: '0xWETH',
          getPosition: getPosition(),
        },
      )

      expect(payback.simulation.errors.length).to.eq(0)
    })
  })
})
