import poolAbi from '@oasisdex/abis/external/protocols/ajna/ajnaPoolERC20.json'
import { Address } from '@oasisdex/dma-common/types/address'
import {
  AjnaDependencies,
  AjnaEarnActions,
  AjnaError,
  AjnaPool,
  AjnaWarning,
  Strategy,
} from '@oasisdex/domain/protocols/ajna'
import { getAjnaValidations } from '@oasisdex/domain/protocols/ajna/validation'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

import { AjnaEarnPosition } from '../../types/ajna'

export interface AjnaEarnArgs {
  poolAddress: Address
  dpmProxyAddress: Address
  collateralAmount: BigNumber
  quoteAmount: BigNumber
  quoteTokenPrecision: number
  price: BigNumber
  position: AjnaEarnPosition
  collateralPrice: BigNumber
  quotePrice: BigNumber
  isStakingNft?: boolean
}

export const prepareAjnaPayload = <T extends { pool: AjnaPool }>({
  dependencies,
  targetPosition,
  errors,
  warnings,
  data,
  txValue,
}: {
  dependencies: AjnaDependencies
  targetPosition: T
  errors: AjnaError[]
  warnings: AjnaWarning[]
  data: string
  txValue: string
}): Strategy<T> => {
  return {
    simulation: {
      swaps: [],
      errors,
      warnings,
      targetPosition,
      position: targetPosition,
    },
    tx: {
      to: dependencies.ajnaProxyActions,
      data,
      value: txValue,
    },
  }
}

export const getAjnaEarnActionOutput = async ({
  targetPosition,
  data,
  dependencies,
  args,
  action,
  txValue,
}: {
  targetPosition: AjnaEarnPosition
  data: string
  dependencies: AjnaDependencies
  args: AjnaEarnArgs
  action: AjnaEarnActions
  txValue: string
}) => {
  const pool = new ethers.Contract(args.poolAddress, poolAbi, dependencies.provider)
  const [poolDebt] = await pool.debtInfo()

  const afterLupIndex =
    action === 'withdraw-earn'
      ? await pool.depositIndex(
          new BigNumber(poolDebt.toString()).plus(args.quoteAmount.shiftedBy(18)).toString(),
        )
      : undefined

  const { errors, warnings } = getAjnaValidations({
    price: args.price,
    quoteAmount: args.quoteAmount,
    quoteTokenPrecision: args.quoteTokenPrecision,
    position: args.position,
    simulation: targetPosition,
    afterLupIndex,
    action,
  })

  return prepareAjnaPayload({
    dependencies,
    targetPosition,
    errors,
    warnings,
    data,
    txValue,
  })
}

export const resolveAjnaEthAction = (isUsingEth: boolean, amount: BigNumber) =>
  isUsingEth ? ethers.utils.parseEther(amount.toString()).toString() : '0'

export const calculateAjnaApyPerDays = (amount: BigNumber, apy: BigNumber, days: number) =>
  // converted to numbers because BigNumber doesn't handle power with decimals
  amount
    .times(new BigNumber(Math.E ** apy.times(days).div(365).toNumber()))
    .minus(amount)
    .div(amount)
