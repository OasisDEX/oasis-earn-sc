import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

import { AUM_FEE_RATE } from './constants'
import { isCloseEvent } from './isCloseEvent'
import { isDeriskEvent } from './isDeriskEvent'
import { isOpenEvent } from './isOpenEvent'
import { isWithdrawEvent } from './isWithdrawEvent'
import type { OasisEvent, OasisPosition } from './types'

const debugEnabled = process.env.DEBUG === 'true'
const log = (...args: any[]) => {
  if (debugEnabled) {
    console.log(...args)
  }
}

export const calculateFee = (position: OasisPosition, toTimestampInSeconds?: number) => {
  const endTimestampInSeconds = toTimestampInSeconds ?? Math.floor(Date.now() / 1000)

  // sorted by timestamp - oldest first
  const eventsAscending = position.events

  // find newest open event
  const openEventIndex = eventsAscending.findLastIndex(isOpenEvent)
  // there is no open events
  if (openEventIndex === -1) {
    throw 'Position is missing open event, not possible to calculate fee'
  }

  let startEventIndex: number
  // find newest close event
  const closeEventIndex = eventsAscending.findLastIndex(isCloseEvent)
  if (closeEventIndex === -1) {
    startEventIndex = openEventIndex
    log('No close event, calculating fee from open event', startEventIndex)
  }
  // close event is not the last event
  else if (closeEventIndex !== eventsAscending.length - 1) {
    startEventIndex = closeEventIndex + 1
    log('Position reopened, calculating fee from last close event', startEventIndex)
  } else {
    throw 'Position is closed, not possible to calculate fee for closed positions'
  }

  const eventsToCalculate = eventsAscending // traverse starting from oldest
    .slice(startEventIndex) // slice events before the start event

  const [totalFee] = eventsToCalculate.reduce(
    ([accumulatedFee, accumulatedSwapAmount], event, index, arr) => {
      // calculations are in wei unit
      const nextEvent = arr[index + 1]
      const isThisLastEvent = nextEvent === undefined
      // calc fee for the current event period only
      const nextTimestampOrEnd = isThisLastEvent
        ? endTimestampInSeconds
        : new BigNumber(nextEvent.timestamp.toString()).toNumber()

      const eventSwapAmount = getEventDebtSwapAmount(event)
      const newAccumulatedSwapAmount =
        isWithdrawEvent(event) || isDeriskEvent(event)
          ? accumulatedSwapAmount.minus(eventSwapAmount)
          : accumulatedSwapAmount.plus(eventSwapAmount)

      const eventFee = calculateFeeBetweenTimestamps(
        newAccumulatedSwapAmount.toString(),
        event.timestamp, // in seconds
        nextTimestampOrEnd,
      )
      const fractions = 10 ** Number(event.debtToken?.decimals)
      log(index, event.kind, {
        periodDays: calculateDaysBetweenTimestamps(event.timestamp, nextTimestampOrEnd),
        periodAssetsUnderManagement:
          newAccumulatedSwapAmount.div(fractions).toString() + ' ' + event.debtToken?.symbol,
        periodFee:
          new BigNumber(eventFee).div(fractions).toString() + ' ' + event.debtToken?.symbol,
      })

      // if event is derisk, it means fee was paid so we should drop prev fee
      // and start accumulating again from this point but keep the accumulated swap
      // as we are calculating fee on assets that are accumulated in the position
      if (isDeriskEvent(event)) {
        return [new BigNumber(eventFee), newAccumulatedSwapAmount]
      }

      // accumulate fee and swap amount and go to next event
      const newAccumulatedFee = accumulatedFee.plus(eventFee)
      return [newAccumulatedFee, newAccumulatedSwapAmount]
    },
    [new BigNumber(0), new BigNumber(0)],
  )

  return totalFee.toString()
}

const getEventDebtSwapAmount = (event: OasisEvent) => {
  let swapAmount = '0'
  if (event.debtToken?.address === event.swapToToken && event.swapToAmount) {
    swapAmount = event.swapToAmount
  } else if (event.debtToken?.address === event.swapFromToken && event.swapFromAmount) {
    swapAmount = event.swapFromAmount
  }
  // if swap amount is zero there is nothing to calculate fee on
  if (event.debtToken?.decimals === undefined) {
    throw 'Decimals are missing for debt token' + event.debtToken?.symbol
  }

  const parsed = safeParseUnits(swapAmount, Number(event.debtToken.decimals))
  return new BigNumber(parsed).toFixed(0)
}

const calculateFeeBetweenTimestamps = (
  amountInCollateral: string,
  fromTimestamp: bigint,
  toTimestamp: number,
) => {
  const startTimestamp = fromTimestamp
  const endTimestamp = toTimestamp
  const daysPassed = calculateDaysBetweenTimestamps(startTimestamp, endTimestamp)

  const feeValue = new BigNumber(AUM_FEE_RATE).times(daysPassed / 365).times(amountInCollateral)

  return feeValue.toFixed(0)
}

function calculateDaysBetweenTimestamps(startTimestamp: bigint, endTimestamp: number) {
  // check timestamps are in seconds
  if (startTimestamp.toString().length != 10 || endTimestamp.toString().length != 10) {
    throw 'Timestamps should be in seconds, received: ' + startTimestamp + ' and ' + endTimestamp
  }

  return new BigNumber(endTimestamp)
    .minus(startTimestamp.toString())
    .div(60 * 60 * 24) // seconds per day
    .toNumber()
}

export const safeParseUnits = (value: string, decimals: number) =>
  ethers.utils.parseUnits(new BigNumber(value).toFixed(decimals), decimals).toString()
