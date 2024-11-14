// write test that will check if passed string is matching all values in the opNames array
import { expect } from 'chai'

import {
  isCloseEvent,
  isDeriskEvent,
  isOpenEvent,
  isWithdrawEvent,
  supportedCloseEvents,
  supportedDeriskEvents,
  supportedOpenEvents,
  supportedWithdrawEvents,
} from '../src/utils/fee-service'

describe('utils', () => {
  describe('isOpenEvent', () => {
    it('should return true for all open events', () => {
      supportedOpenEvents.forEach(name => {
        const result = isOpenEvent({ kind: name })
        expect(result).equal(true)
      })
    })

    it('should return false for all close event', () => {
      supportedCloseEvents.forEach(name => {
        const result = isOpenEvent({ kind: name })
        expect(result).equal(false)
      })
    })
  })

  describe('isCloseEvent', () => {
    it('should return true for all close events', () => {
      supportedCloseEvents.forEach(name => {
        const result = isCloseEvent({ kind: name })
        expect(result).equal(true)
      })
    })

    it('should return false for all open event', () => {
      supportedOpenEvents.forEach(name => {
        const result = isCloseEvent({ kind: name })
        expect(result).equal(false)
      })
    })
  })

  describe('isWithdrawEvent', () => {
    it('should return true for all withdraw events', () => {
      supportedWithdrawEvents.forEach(name => {
        const result = isWithdrawEvent({ kind: name })
        expect(result).equal(true)
      })
    })

    it('should return false for all open event', () => {
      supportedOpenEvents.forEach(name => {
        const result = isWithdrawEvent({ kind: name })
        expect(result).equal(false)
      })
    })
  })

  describe('isDeriskEvent', () => {
    it('should return true for all derisk events', () => {
      supportedDeriskEvents.forEach(name => {
        const result = isDeriskEvent({ kind: name })
        expect(result).equal(true)
      })
    })

    it('should return false for all open event', () => {
      supportedOpenEvents.forEach(name => {
        const result = isDeriskEvent({ kind: name })
        expect(result).equal(false)
      })
    })
  })
})
