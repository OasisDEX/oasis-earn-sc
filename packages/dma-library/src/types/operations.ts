import { Address } from '@deploy-configurations/types/address'
import { Network } from '@deploy-configurations/types/network'
import { OperationNames } from '@dma-common/constants'
import { AaveLikeStrategyAddresses } from '@dma-library/operations/aave-like'
import { MorphoBlueStrategyAddresses } from '@dma-library/operations/morphoblue/addresses'
import { BigNumber } from 'bignumber.js'

import { SummerStrategyAddresses } from '../operations/ajna'
import { AaveLikePosition } from './aave-like'
import { ActionCall } from './action-call'
import { FlashloanProvider } from './common'
import { MorphoBlueMarket } from './morphoblue'
import { PositionType } from './position-type'

export interface IOperation {
  calls: ActionCall[]
  operationName: OperationNames
}

export type WithCollateral = {
  collateral: {
    address: Address
    isEth: boolean
  }
}

export type WithCollateralAndWithdrawal = {
  collateral: WithCollateral['collateral'] & WithWithdrawal
}

export type WithDebt = {
  debt: {
    address: Address
    isEth: boolean
  }
}

export type WithDebtAndBorrow = {
  debt: WithDebt['debt'] & WithBorrowing
}

export type WithBorrowing = {
  borrow: {
    /* Amount to borrow in base unit */
    amount: BigNumber
  }
}

export type WithWithdrawal = {
  withdrawal: {
    /* Amount to withdraw in base unit */
    amount: BigNumber
  }
}

export type WithOptionalDeposit = Partial<{
  deposit: {
    address: Address
    /* Amount to deposit in base unit */
    amount: BigNumber
  }
}>

export type WithSwapParameters = {
  swap: {
    fee: number
    data: string | number
    collectFeeFrom: 'sourceToken' | 'targetToken'
    receiveAtLeast: BigNumber
  }
}

export type WithSwapAmount = {
  swap: {
    /* Amount to swap in base unit */
    amount: BigNumber
  }
}

export type WithSwap = WithSwapParameters & WithSwapAmount

export type WithFlashloanProvider = {
  flashloan: {
    provider: FlashloanProvider
  }
}

export type WithFlashloan = WithFlashloanProvider & {
  flashloan: {
    token: {
      amount: BigNumber
      address: Address
    }
    /** @deprecated Please use `token` instead **/
    amount: BigNumber
  }
}

export type WithOptionalFlashloan = Partial<WithFlashloan>

export type WithProxy = {
  proxy: {
    address: string
    owner: string
    isDPMProxy: boolean
  }
}

export type WithPosition = {
  position: {
    type: PositionType
  }
}

export type WithUserCollateral = {
  user: WithCollateral & {
    collateral: {
      amount: BigNumber
    }
  }
}

export type WithUserDebt = {
  user: WithDebt & {
    amount: BigNumber
  }
}

export type WithLockedCollateral = {
  collateral: {
    amount: BigNumber
  }
}

export type WithBorrowedDebt = {
  debt: {
    amount: BigNumber
  }
}

export type WithAaveLikePosition = {
  position: AaveLikePosition
}

export type WithPositionAndLockedCollateral = WithPosition & {
  position: WithPosition['position'] & WithLockedCollateral
}

export type WithAaveLikeStrategyAddresses = {
  addresses: AaveLikeStrategyAddresses
}

export type WithSummerStrategyAddresses = {
  addresses: SummerStrategyAddresses
}

export type WithEMode = {
  /*
   * Categories are voted on by the community and categorised as an integer
   * 0 is the default category with no special treatment
   * */
  emode: {
    categoryId: number
  }
}

export type WithAjnaBucketPrice = {
  price: BigNumber
}

export type WithNetwork = {
  network: Network
}

export type WithPaybackAll = {
  isPaybackAll: boolean
}

export type WithWithdrawAll = {
  isWithdrawAll: boolean
}

/**
 * Morpho Blue
 */

export type WithMorphoBlueMarket = {
  morphoBlueMarket: MorphoBlueMarket
}

export type WithMorphpBlueStrategyAddresses = {
  addresses: MorphoBlueStrategyAddresses
}

/**
 * Refinance
 */
export type WithPositionProduct = {
  position: WithPosition['position'] & WithDebt & WithCollateral
}

export type WithPositionAmounts = {
  position: WithBorrowedDebt & WithLockedCollateral
}

export type WithPositionStatus = WithPositionProduct & WithPositionAmounts

export type WithStorageIndex = {
  lastStorageIndex: number
}

export type WithNewPosition = {
  newPosition: WithPosition['position'] &
    WithDebt &
    WithBorrowedDebt &
    WithCollateral &
    WithLockedCollateral
}

export type WithOptionalActionCalls = {
  calls?: ActionCall[]
}

export type WithCloseToOpenSwap = {
  swapCloseToOpen: WithSwap['swap']
}

export type WithAfterOpenSwap = {
  swapAfterOpen: WithSwap['swap']
}

export type WithAToken = {
  aToken: {
    address: Address
    amount: BigNumber
  }
}

export type WithVDToken = {
  vdToken: {
    address: Address
  }
}
