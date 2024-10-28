import BigNumber from 'bignumber.js'

import { AUM_FEE_RATE } from './constants'
import { isCloseEvent } from './isCloseEvent'
import { isDeriskEvent } from './isDeriskEvent'
import { isOpenEvent } from './isOpenEvent'
import { isWithdrawEvent } from './isWithdrawEvent'
import type { OasisEvent, OasisPosition } from './types'

export const calculateFee = (position: OasisPosition, toTimestamp?: number) => {
  const endTimestamp = toTimestamp ?? Date.now()

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
    ([accFee, accSwapAmount], event, index, arr) => {
      const nextEvent = arr[index + 1]
      // calc fee for the current event period only
      const nextTimestampOrEnd = nextEvent
        ? new BigNumber(nextEvent.timestamp.toString()).toNumber()
        : endTimestamp
      const eventSwapAmount = getEventSwapAmount(event)
      const newAccSwapAmount =
        isWithdrawEvent(event) || isDeriskEvent(event)
          ? accSwapAmount.minus(eventSwapAmount)
          : accSwapAmount.plus(eventSwapAmount)
      const eventFee = calculateFeeFromTo(
        newAccSwapAmount.toString(),
        event.timestamp,
        nextTimestampOrEnd,
      )

      // if event is derisk, it means fee was paid so we should drop prev fee
      // and start accumulating again from this point and keep the acc swap amount
      if (isDeriskEvent(event)) {
        return [new BigNumber(eventFee), newAccSwapAmount]
      }

      return [accFee.plus(eventFee), newAccSwapAmount]
    },
    [new BigNumber(0), new BigNumber(0)],
  )

  return totalFee.toString()
}

const getEventSwapAmount = (event: OasisEvent) => {
  let swapAmount = '0'
  if (event.swapToToken === event.debtToken && event.swapToAmount) {
    swapAmount = event.swapToAmount
  } else if (event.swapFromToken === event.debtToken && event.swapFromAmount) {
    swapAmount = event.swapFromAmount
  }
  return swapAmount
}

const calculateFeeFromTo = (
  amountInCollateral: string,
  fromTimestamp: bigint,
  toTimestamp: number,
) => {
  const startTimestamp = fromTimestamp
  const endTimestamp = toTimestamp
  const daysPassed = new BigNumber(endTimestamp)
    .minus(startTimestamp.toString())
    .div(1000 * 60 * 60 * 24) // miliseconds per day
    .toNumber()

  const feeValue = new BigNumber(AUM_FEE_RATE).times(daysPassed / 365).times(amountInCollateral)

  return feeValue.toString()
}
