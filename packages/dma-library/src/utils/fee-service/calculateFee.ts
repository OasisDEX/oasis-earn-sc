import BigNumber from 'bignumber.js'

import { AUM_FEE_RATE } from './constants'
import { isCloseEvent } from './isCloseEvent'
import { isDeriskEvent } from './isDeriskEvent'
import { isOpenEvent } from './isOpenEvent'
import { isWithdrawEvent } from './isWithdrawEvent'
import type { OasisEvent, OasisPosition } from './types'

export const calculateFee = (position: OasisPosition, toTimestampInSeconds?: number) => {
  const endTimestampInSeconds = toTimestampInSeconds ?? Math.floor(Date.now() / 1000)

  // find open event
  const openEventIndex = position.events.findIndex(isOpenEvent)
  // there is no open events
  if (openEventIndex === -1) {
    throw 'Position is missing open event, not possible to calculate fee'
  }

  let startEventIndex: number
  // there is no closed events
  const closeEventIndex = position.events.findIndex(isCloseEvent)
  if (closeEventIndex === -1) {
    startEventIndex = openEventIndex
  }
  // there is closed event but position was reopened
  else if (closeEventIndex !== position.events.length - 1) {
    startEventIndex = closeEventIndex + 1
  } else {
    throw 'Position is closed, not possible to calculate fee'
  }

  const eventsToCalculate = position.events
    .slice(startEventIndex)
    .filter(event => new BigNumber(getEventSwapAmount(event)).gt(0))
  const [totalFee] = eventsToCalculate.reduce(
    ([accumulatedFee, accumulatedSwapAmount], event, index, arr) => {
      const nextEvent = arr[index + 1]
      const isThisLastEvent = nextEvent === undefined
      // calc fee for the current event period only
      const nextTimestampOrEnd = isThisLastEvent
        ? endTimestampInSeconds
        : new BigNumber(nextEvent.timestamp.toString()).toNumber()

      const eventSwapAmount = getEventSwapAmount(event)
      const newAccumulatedSwapAmount =
        isWithdrawEvent(event) || isDeriskEvent(event)
          ? accumulatedSwapAmount.minus(eventSwapAmount)
          : accumulatedSwapAmount.plus(eventSwapAmount)

      const eventFee = calculateFeeBetweenTimestamps(
        newAccumulatedSwapAmount.toString(),
        event.timestamp, // in seconds
        nextTimestampOrEnd,
      )
      console.log({
        daysPassed: calculateDaysBetweenTimestamps(event.timestamp, nextTimestampOrEnd),
        swapAmount: newAccumulatedSwapAmount.toString() + event.debtToken?.symbol,
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

const getEventSwapAmount = (event: OasisEvent) => {
  let swapAmount = '0'
  if (event.debtToken?.address === event.swapToToken && event.swapToAmount) {
    swapAmount = event.swapToAmount
  } else if (event.debtToken?.address === event.swapFromToken && event.swapFromAmount) {
    swapAmount = event.swapFromAmount
  }
  // if swap amount is zero there is nothing to calculate fee on
  return swapAmount
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

  return feeValue.toString()
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
