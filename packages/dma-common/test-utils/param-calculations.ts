import { amountToWei, logDebug } from '@dma-common/utils/common'
import { ADDRESSES } from '@dma-deployments/addresses'
import { Network } from '@dma-deployments/types/network'
import BigNumber from 'bignumber.js'

import { ONE } from '../constants'
import { ExchangeData } from '../types/common'

type IncreaseMultipleParams = [BigNumber, BigNumber, BigNumber] & {
  requiredDebt: BigNumber
  additionalCollateral: BigNumber
  preIncreaseMPTopUp: BigNumber
}

export function calculateParamsIncreaseMP({
  oraclePrice,
  marketPrice,
  oazoFee,
  flashLoanFee,
  currentColl,
  currentDebt,
  requiredCollRatio,
  slippage,
  daiTopUp = new BigNumber(0),
  collTopUp = new BigNumber(0),
  debug = false,
}: {
  oraclePrice: BigNumber
  marketPrice: BigNumber
  oazoFee: BigNumber
  flashLoanFee: BigNumber
  currentColl: BigNumber
  currentDebt: BigNumber
  requiredCollRatio: BigNumber
  daiTopUp?: BigNumber
  collTopUp?: BigNumber
  slippage: BigNumber
  debug?: boolean
}): [BigNumber, BigNumber, BigNumber] & {
  requiredDebt: BigNumber
  additionalCollateral: BigNumber
  preIncreaseMPTopUp: BigNumber
} {
  if (debug) {
    logDebug(
      [
        `oraclePrice: ${oraclePrice.toFixed(2)}`,
        `marketPrice: ${marketPrice.toFixed(2)}`,
        `oazoFee: ${oazoFee.toFixed(5)}`,
        `flashLoanFee: ${flashLoanFee.toFixed(5)}`,
        `currentColl: ${currentColl.toFixed(2)}`,
        `currentDebt: ${currentDebt.toFixed(2)}`,
        `daiTopUp: ${daiTopUp.toFixed(2)}`,
        `collTopUp: ${collTopUp.toFixed(2)}`,
        `requiredCollRatio: ${requiredCollRatio.toFixed(2)}`,
        `slippage: ${slippage.toFixed(2)}`,
      ],
      'calculateParamsIncreaseMP.',
    )
  }

  // collTopUp & daiTopUp
  // Assume the vault position has already been topped up modified
  // Then calculate the new requiredDebt and additional collateral needed
  // To meet our collateralRatio based on the toped up state of a position

  // https://www.overleaf.com/read/dthjzpfsyyzw
  // $X=\frac{MP\cdot(OC\cdot OP) - (CR\cdot D)}{(CR\cdot MP) + (CR\cdot MP \cdot FF) - OP - (OP\cdot OF)}$

  const MP = marketPrice.times(ONE.plus(slippage))
  const OC = currentColl.plus(collTopUp).plus(daiTopUp.div(MP)) // owned collateral
  const OP = oraclePrice
  const CR = requiredCollRatio

  /*
   * TODO: currently flashloan fee is included in required debt
   * which means we can end up borrowing the amount that includes our fee
   * which means we can't pay the fee on the amount borrowed
   */
  const FF = flashLoanFee
  const OF = oazoFee
  const ED = currentDebt // existing debt

  const numerator = MP.times(OC.times(OP)).minus(CR.times(ED))
  const divisor = CR.times(MP).plus(CR.times(MP).times(FF).minus(OP).minus(OP.times(OF)))
  const X = numerator.div(divisor)

  const RD = X.times(ONE.plus(FF))
  const BC = X.times(ONE.minus(OF)).div(MP)

  const debt = RD // RequiredDebt
  const collateral = BC // BorrowedCollateral

  const preIncreaseMPTopUp = collTopUp.plus(daiTopUp.div(MP))

  if (debug) {
    logDebug(
      [
        `debt: ${debt.toFixed(2)}`,
        `collateral: ${collateral.toFixed(2)}`,
        `preIncreaseMPTopUp: ${preIncreaseMPTopUp.toFixed(2)}`,
        `target: collRatio: ${requiredCollRatio}`,
        `generated: collRatio: ${OC.plus(collateral).times(oraclePrice).div(debt)}`,
      ],
      'Computed: calculateParamsIncreaseMP.',
    )
  }

  // https://betterprogramming.pub/this-pattern-will-make-your-react-hooks-cleaner-ca9deba5d58d
  const params = [debt, collateral, preIncreaseMPTopUp] as IncreaseMultipleParams
  params.requiredDebt = debt
  params.additionalCollateral = collateral
  params.preIncreaseMPTopUp = preIncreaseMPTopUp

  return params
}

type DesiredCdpState = {
  requiredDebt: BigNumber
  toBorrowCollateralAmount: BigNumber
  daiTopUp: BigNumber
  fromTokenAmount: BigNumber
  toTokenAmount: BigNumber
  collTopUp: BigNumber
}

type ExchangeDataMock = { to: string; data: number }

export function prepareMultiplyParameters({
  oneInchPayload,
  desiredCdpState,
  toDAI = false,
}: {
  oneInchPayload: ExchangeDataMock
  desiredCdpState: DesiredCdpState
  fundsReceiver: string
  toDAI?: boolean
  cdpId?: number
  skipFL?: boolean
}): {
  exchangeData: ExchangeData
} {
  const exchangeData = {
    fromTokenAddress: toDAI
      ? ADDRESSES[Network.MAINNET].common.WETH
      : ADDRESSES[Network.MAINNET].common.DAI,
    toTokenAddress: toDAI
      ? ADDRESSES[Network.MAINNET].common.DAI
      : ADDRESSES[Network.MAINNET].common.WETH,
    fromTokenAmount: toDAI
      ? amountToWei(desiredCdpState.toBorrowCollateralAmount).toFixed(0)
      : amountToWei(desiredCdpState.requiredDebt).toFixed(0),
    toTokenAmount: toDAI
      ? amountToWei(desiredCdpState.requiredDebt).toFixed(0)
      : amountToWei(desiredCdpState.toBorrowCollateralAmount).toFixed(0),
    minToTokenAmount: toDAI
      ? amountToWei(desiredCdpState.requiredDebt).toFixed(0)
      : amountToWei(desiredCdpState.toBorrowCollateralAmount).toFixed(0),
    // expectedFee: 0,
    exchangeAddress: oneInchPayload.to,
    _exchangeCalldata: oneInchPayload.data,
  }

  return { exchangeData }
}
