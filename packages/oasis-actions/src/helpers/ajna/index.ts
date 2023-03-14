import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

import poolAbi from '../../../../../abi/external/ajna/ajnaPoolERC20.json'
import { getAjnaValidations } from '../../strategies/ajna/earn/validations'
import { AjnaEarnPosition } from '../../types/ajna'
import { AjnaPool } from '../../types/ajna/AjnaPool'
import {
  Address,
  AjnaDependencies,
  AjnaEarnActions,
  AjnaError,
  AjnaWarning,
  Strategy,
} from '../../types/common'

export interface AjnaEarnArgs {
  poolAddress: Address
  dpmProxyAddress: Address
  quoteAmount: BigNumber
  quoteTokenPrecision: number
  price: BigNumber
  position: AjnaEarnPosition
}

export const prepareAjnaPayload = <T extends { pool: AjnaPool }>({
  dependencies,
  args,
  targetPosition,
  errors,
  warnings,
  data,
}: {
  dependencies: AjnaDependencies
  targetPosition: T
  errors: AjnaError[]
  warnings: AjnaWarning[]
  data: string
  args: {
    position: T
    quoteAmount: BigNumber
    quoteTokenPrecision: number
  }
}): Strategy<T> => {
  const isDepositingEth =
    args.position.pool.collateralToken.toLowerCase() === dependencies.WETH.toLowerCase()

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
      value: isDepositingEth
        ? ethers.utils.parseEther(args.quoteAmount.toString()).toString()
        : '0',
    },
  }
}

export const getAjnaEarnActionOutput = async ({
  targetPosition,
  data,
  dependencies,
  args,
  action,
}: {
  targetPosition: AjnaEarnPosition
  data: string
  dependencies: AjnaDependencies
  args: AjnaEarnArgs
  action: AjnaEarnActions
}) => {
  const pool = new ethers.Contract(args.poolAddress, poolAbi, dependencies.provider)
  const [poolDebt] = await pool.debtInfo()

  const afterLupIndex =
    action === 'withdraw'
      ? await pool.depositIndex(
          new BigNumber(poolDebt.toString()).plus(args.quoteAmount.shiftedBy(18)).toString(),
        )
      : undefined

  const { errors, warnings } = getAjnaValidations({
    price: args.price,
    quoteAmount: args.quoteAmount,
    position: args.position,
    simulation: targetPosition,
    afterLupIndex,
    action,
  })

  return prepareAjnaPayload({
    dependencies,
    args,
    targetPosition,
    errors,
    warnings,
    data,
  })
}
