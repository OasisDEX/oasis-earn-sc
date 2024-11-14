import { expect } from 'chai'

import { calculateFee } from '../src/utils/fee-service/calculateFee'
import {
  supportedCloseEvents,
  supportedDeriskEvents,
  supportedOpenEvents,
  supportedWithdrawEvents,
} from '../src/utils/fee-service/constants'
import type { OasisPosition } from '../src/utils/fee-service/types'

const startTimestampInSeconds = 1620000000
const dayInSeconds = 24 * 60 * 60

describe('calculateFee', () => {
  it('should throw for position without open event', () => {
    const position = {
      events: [
        {
          kind: supportedCloseEvents[0],
          timestamp: startTimestampInSeconds,
          swapToToken: 'stETH',
          swapToAmount: '1000',
          swapFromToken: 'wETH',
          swapFromAmount: '1',
          debtToken: 'stETH',
        },
      ],
    } as unknown as OasisPosition

    expect(() => calculateFee(position)).throw(
      'Position is missing open event, not possible to calculate fee',
    )
  })

  it('should throw for closed positions', () => {
    const position = {
      events: [
        {
          kind: supportedOpenEvents[0],
          timestamp: startTimestampInSeconds,
          swapToToken: 'stETH',
          swapToAmount: '1000',
          swapFromToken: 'wETH',
          swapFromAmount: '1',
          debtToken: 'stETH',
        },
        {
          kind: supportedCloseEvents[0],
          timestamp: startTimestampInSeconds + dayInSeconds,
          swapToToken: 'stETH',
          swapToAmount: '1000',
          swapFromToken: 'wETH',
          swapFromAmount: '1',
          debtToken: 'stETH',
        },
      ],
    } as unknown as OasisPosition

    expect(() => calculateFee(position)).throw('Position is closed, not possible to calculate fee')
  })

  it('should calculate fee correctly for open position with zero deposit', () => {
    const position = {
      events: [
        {
          kind: supportedOpenEvents[0],
          timestamp: startTimestampInSeconds,
          swapToToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          swapToAmount: '0',
          swapFromToken: 'wETH',
          swapFromAmount: '0',
          debtToken: {
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            symbol: 'USDC',
            decimals: '6',
          },
        },
      ],
    } as unknown as OasisPosition

    const fee = calculateFee(position, startTimestampInSeconds + dayInSeconds * 100)
    expect(fee).equal('0')
  })

  it('should calculate fee correctly for open position deposit', () => {
    const position = {
      events: [
        {
          kind: supportedOpenEvents[0],
          timestamp: startTimestampInSeconds,
          swapToToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          swapToAmount: '900000',
          swapFromToken: 'wETH',
          swapFromAmount: '1',
          debtToken: {
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            symbol: 'USDC',
            decimals: '6',
          },
        },
      ],
    } as unknown as OasisPosition

    const fee = calculateFee(position, startTimestampInSeconds + dayInSeconds * 100)
    expect(fee).equal('49.31506849315068')
  })

  it('should calculate fee correctly for two deposits', () => {
    const position = {
      events: [
        {
          kind: supportedOpenEvents[0],
          timestamp: startTimestampInSeconds,
          swapToToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          swapToAmount: '90',
          swapFromToken: 'wETH',
          swapFromAmount: '1',
          debtToken: {
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            symbol: 'USDC',
            decimals: '6',
          },
        },
        {
          kind: 'DEPOSIT',
          timestamp: startTimestampInSeconds + dayInSeconds * 10,
          swapToToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          swapToAmount: 900000 - 90,
          swapFromToken: 'wETH',
          swapFromAmount: '1',
          debtToken: {
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            symbol: 'USDC',
            decimals: '6',
          },
        },
      ],
    } as unknown as OasisPosition

    const closeTimestamp = startTimestampInSeconds + dayInSeconds * 110
    const fee = calculateFee(position, closeTimestamp)
    expect(fee).equal('49.3155616438356115068')
  })

  it('should calculate fee correctly for deposits and withdraw', () => {
    const position = {
      events: [
        {
          kind: supportedOpenEvents[0],
          timestamp: startTimestampInSeconds,
          swapToToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          swapToAmount: '90',
          swapFromToken: 'wETH',
          swapFromAmount: '1',
          debtToken: {
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            symbol: 'USDC',
            decimals: '6',
          },
        },
        {
          kind: 'DEPOSIT',
          timestamp: startTimestampInSeconds + dayInSeconds * 10,
          swapToToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          swapToAmount: 900000 - 90,
          swapFromToken: 'wETH',
          swapFromAmount: '1',
          debtToken: {
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            symbol: 'USDC',
            decimals: '6',
          },
        },
        {
          kind: supportedWithdrawEvents[0],
          timestamp: startTimestampInSeconds + dayInSeconds * 110,
          swapToToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          swapToAmount: '450000',
          swapFromToken: 'wETH',
          swapFromAmount: '1',
          debtToken: {
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            symbol: 'USDC',
            decimals: '6',
          },
        },
      ],
    } as unknown as OasisPosition

    const closeTimestamp = startTimestampInSeconds + dayInSeconds * 310
    const fee = calculateFee(position, closeTimestamp)
    expect(fee).eq('98.6306301369862915068')
  })

  it('should calculate fee correctly for deposit in reopened position', () => {
    const position = {
      events: [
        {
          kind: supportedOpenEvents[0],
          timestamp: startTimestampInSeconds,
          swapToToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          swapToAmount: '90',
          swapFromToken: 'wETH',
          swapFromAmount: '1',
          debtToken: {
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            symbol: 'USDC',
            decimals: '6',
          },
        },
        {
          kind: 'DEPOSIT',
          timestamp: startTimestampInSeconds + dayInSeconds * 10,
          swapToToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          swapToAmount: '900000',
          swapFromToken: 'wETH',
          swapFromAmount: '1',
          debtToken: {
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            symbol: 'USDC',
            decimals: '6',
          },
        },
        {
          kind: supportedWithdrawEvents[0],
          timestamp: startTimestampInSeconds + dayInSeconds * 110,
          swapToToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          swapToAmount: '450000',
          swapFromToken: 'wETH',
          swapFromAmount: '1',
          debtToken: {
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            symbol: 'USDC',
            decimals: '6',
          },
        },
        {
          kind: supportedCloseEvents[0],
          timestamp: startTimestampInSeconds + dayInSeconds * 310,
          swapToToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          swapToAmount: '450000',
          swapFromToken: 'wETH',
          swapFromAmount: '1',
          debtToken: {
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            symbol: 'USDC',
            decimals: '6',
          },
        },
        {
          kind: 'DEPOSIT',
          timestamp: startTimestampInSeconds + dayInSeconds * 350,
          swapToToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          swapToAmount: '90000',
          swapFromToken: 'wETH',
          swapFromAmount: '1',
          debtToken: {
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            symbol: 'USDC',
            decimals: '6',
          },
        },
      ],
    } as unknown as OasisPosition

    const closeTimestamp = startTimestampInSeconds + dayInSeconds * 715
    const fee = calculateFee(position, closeTimestamp)
    expect(fee).equal('18')
  })

  it('should calculate fee correctly for deposit and derisk in reopened position', () => {
    const position = {
      events: [
        {
          kind: supportedOpenEvents[0],
          timestamp: startTimestampInSeconds,
          swapToToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          swapToAmount: '90',
          swapFromToken: 'wETH',
          swapFromAmount: '1',
          debtToken: {
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            symbol: 'USDC',
            decimals: '6',
          },
        },
        {
          kind: 'DEPOSIT',
          timestamp: startTimestampInSeconds + dayInSeconds * 10,
          swapToToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          swapToAmount: '900000',
          swapFromToken: 'wETH',
          swapFromAmount: '1',
          debtToken: {
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            symbol: 'USDC',
            decimals: '6',
          },
        },
        {
          kind: supportedWithdrawEvents[0],
          timestamp: startTimestampInSeconds + dayInSeconds * 110,
          swapToToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          swapToAmount: '450000',
          swapFromToken: 'wETH',
          swapFromAmount: '1',
          debtToken: {
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            symbol: 'USDC',
            decimals: '6',
          },
        },
        {
          kind: supportedCloseEvents[0],
          timestamp: startTimestampInSeconds + dayInSeconds * 310,
          swapToToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          swapToAmount: '450000',
          swapFromToken: 'wETH',
          swapFromAmount: '1',
          debtToken: {
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            symbol: 'USDC',
            decimals: '6',
          },
        },
        {
          kind: 'DEPOSIT',
          timestamp: startTimestampInSeconds + dayInSeconds * 350,
          swapToToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          swapToAmount: '90000',
          swapFromToken: 'wETH',
          swapFromAmount: '1',
          debtToken: {
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            symbol: 'USDC',
            decimals: '6',
          },
        },
        {
          kind: supportedDeriskEvents[0],
          timestamp: startTimestampInSeconds + dayInSeconds * 715,
          swapToToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          swapToAmount: '25000',
          swapFromToken: 'wETH',
          swapFromAmount: '1',
          debtToken: {
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            symbol: 'USDC',
            decimals: '6',
          },
        },
      ],
    } as unknown as OasisPosition

    const closeTimestamp = startTimestampInSeconds + dayInSeconds * 750
    const fee = calculateFee(position, closeTimestamp)
    expect(fee).equal('1.2465753424657533')
  })
})
