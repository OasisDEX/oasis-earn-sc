import { Address } from '@deploy-configurations/types/address'
import { Network } from '@deploy-configurations/types/network'
import { OperationNames } from '@dma-common/constants'
import { BigNumber } from 'bignumber.js'

import { AAVEStrategyAddresses } from '../operations/aave/v2'
import { AAVEV3StrategyAddresses } from '../operations/aave/v3'
import { AjnaStrategyAddresses } from '../operations/ajna'
import { ActionCall } from './action-call'
import { FlashloanProvider } from './common'
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

export type WithDeposit = {
  deposit: {
    address: Address
    /* Amount to deposit in base unit */
    amount: BigNumber
  }
}

export type WithOptionalDeposit = Partial<WithDeposit>

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
    /*
     * @deprecated Please use `token` instead
     */
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

export type WithAaveV2StrategyAddresses = {
  addresses: AAVEStrategyAddresses
}

export type WithAaveV3StrategyAddresses = {
  addresses: AAVEV3StrategyAddresses
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
