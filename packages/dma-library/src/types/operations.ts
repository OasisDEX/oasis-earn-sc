import { Address } from '@deploy-configurations/types/address'
import { Network } from '@deploy-configurations/types/network'
import { OperationNames } from '@dma-common/constants'
import { AaveLikeStrategyAddresses } from '@dma-library/operations/aave-like'
import { MorphoBlueStrategyAddresses } from '@dma-library/operations/morphoblue/addresses'
import { BigNumber } from 'bignumber.js'

import { AjnaStrategyAddresses } from '../operations/ajna'
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

export type WithSwap = {
  swap: {
    fee: number
    data: string | number
    /* Amount to swap in base unit */
    amount: BigNumber
    collectFeeFrom: 'sourceToken' | 'targetToken'
    receiveAtLeast: BigNumber
  }
}

export type WithFlashloan = {
  flashloan: {
    provider: FlashloanProvider
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

export type WithPositionAndLockedCollateral = WithPosition & {
  position: WithPosition['position'] & WithLockedCollateral
}

type WithLockedCollateral = {
  collateral: {
    amount: BigNumber
  }
}

export type WithAaveLikeStrategyAddresses = {
  addresses: AaveLikeStrategyAddresses
}

export type WithAjnaStrategyAddresses = {
  addresses: AjnaStrategyAddresses
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

/**
 * Morpho Blue
 */

export type WithMorphoBlueMarket = {
  morphoBlueMarket: MorphoBlueMarket
}

export type WithMorphpBlueStrategyAddresses = {
  addresses: MorphoBlueStrategyAddresses
}
