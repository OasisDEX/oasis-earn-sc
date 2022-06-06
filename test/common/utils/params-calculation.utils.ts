import BigNumber from 'bignumber.js'
import { isError, tryF } from 'ts-try'
import MAINNET_ADRESSES from '../../../addresses/mainnet.json'
import { WETH_ADDRESS } from '../../utils'
import { one, ten, zero } from '../cosntants'
import { logDebug } from './test.utils'

// TODO:
export function addressRegistryFactory(
  multiplyProxyActionsInstanceAddress: string,
  exchangeInstanceAddress: string,
) {
  return {
    jug: '0x19c0976f590D67707E62397C87829d896Dc0f1F1',
    manager: '0x5ef30b9986345249bc32d8928B7ee64DE9435E39',
    multiplyProxyActions: multiplyProxyActionsInstanceAddress,
    lender: '0x1EB4CF3A948E7D72A198fe073cCb8C7a948cD853',
    feeRecepient: '0x79d7176aE8F93A04bC73b9BC710d4b44f9e362Ce',
    exchange: exchangeInstanceAddress,
  }
}

export function amountToWei(amount: BigNumber.Value, precision = 18) {
  return new BigNumber(amount || 0).times(new BigNumber(10).pow(precision))
}

// TODO: change
export function amountFromWei(amount: BigNumber.Value, precision = 18) {
  return new BigNumber(amount || 0).div(new BigNumber(10).pow(precision))
}

export function calculateParamsIncreaseMP(
  oraclePrice: BigNumber,
  marketPrice: BigNumber,
  oazoFee: BigNumber,
  flashLoanFee: BigNumber,
  currentColl: BigNumber,
  currentDebt: BigNumber,
  requiredCollRatio: BigNumber,
  slippage: BigNumber,
  depositDai = new BigNumber(0),
  debug = false,
) {
  if (debug) {
    logDebug(
      [
        `oraclePrice: ${oraclePrice.toFixed(2)}`,
        `marketPrice: ${marketPrice.toFixed(2)}`,
        `oazoFee: ${oazoFee.toFixed(5)}`,
        `flashLoanFee: ${flashLoanFee.toFixed(5)}`,
        `currentColl: ${currentColl.toFixed(2)}`,
        `currentDebt: ${currentDebt.toFixed(2)}`,
        `requiredCollRatio: ${requiredCollRatio.toFixed(2)}`,
        `slippage: ${slippage.toFixed(2)}`,
      ],
      'calculateParamsIncreaseMP.',
    )
  }

  const marketPriceSlippage = marketPrice.times(one.plus(slippage))
  const debt = marketPriceSlippage
    .times(currentColl.times(oraclePrice).minus(requiredCollRatio.times(currentDebt)))
    .plus(oraclePrice.times(depositDai).minus(oraclePrice.times(depositDai).times(oazoFee)))
    .div(
      marketPriceSlippage
        .times(requiredCollRatio)
        .times(one.plus(flashLoanFee))
        .minus(oraclePrice.times(one.minus(oazoFee))),
    )
  const collateral = debt.times(one.minus(oazoFee)).div(marketPriceSlippage)

  if (debug) {
    logDebug(
      [`debt: ${debt.toFixed(2)}`, `collateral: ${collateral.toFixed(2)}`],
      'Computed: calculateParamsIncreaseMP.',
    )
  }
  return [debt, collateral]
}

export function calculateParamsDecreaseMP(
  oraclePrice: BigNumber,
  marketPrice: BigNumber,
  oazoFee: BigNumber,
  flashLoanFee: BigNumber,
  currentColl: BigNumber,
  currentDebt: BigNumber,
  requiredCollRatio: BigNumber,
  slippage: BigNumber,
  debug = false,
) {
  if (debug) {
    logDebug(
      [
        `oraclePrice ${oraclePrice.toFixed(2)}`,
        `marketPrice ${marketPrice.toFixed(2)}`,
        `oazoFee ${oazoFee.toFixed(5)}`,
        `flashLoanFee ${flashLoanFee.toFixed(5)}`,
        `currentColl ${currentColl.toFixed(2)}`,
        `currentDebt ${currentDebt.toFixed(2)}`,
        `requiredCollRatio ${requiredCollRatio.toFixed(2)}`,
        `slippage ${slippage.toFixed(2)}`,
      ],
      'calculateParamsDecreaseMP.',
    )
  }
  const marketPriceSlippage = marketPrice.times(one.minus(slippage))
  const debt = currentColl
    .times(oraclePrice)
    .times(marketPriceSlippage)
    .minus(requiredCollRatio.times(currentDebt).times(marketPriceSlippage))
    .div(
      oraclePrice
        .times(one.plus(flashLoanFee).plus(oazoFee).plus(oazoFee.times(flashLoanFee)))
        .minus(marketPriceSlippage.times(requiredCollRatio)),
    )
  const collateral = debt.times(one.plus(oazoFee).plus(flashLoanFee)).div(marketPriceSlippage)
  if (debug) {
    console.log('Computed: calculateParamsDecreaseMP.debt', debt.toFixed(2))
    console.log('Computed: calculateParamsDecreaseMP.collateral', collateral.toFixed(2))
  }
  return [debt, collateral]
}

// TODO:
export function packMPAParams(cdpData: any, exchangeData: any, registry: any) {
  const registryClone = { ...registry }
  delete registryClone.feeRecepient

  return [exchangeData, cdpData, registryClone]
}

export function ensureWeiFormat(
  input: BigNumber.Value, // TODO:
  interpretBigNum = true,
) {
  const bn = new BigNumber(input)

  const result = tryF(() => {
    if (interpretBigNum && bn.lt(ten.pow(9))) {
      return bn.times(ten.pow(18))
    }

    return bn
  })

  if (isError(result)) {
    throw Error(`Error running \`ensureWeiFormat\` with input ${input.toString()}: ${result}`)
  }

  return result.decimalPlaces(0).toFixed(0)
}

export function prepareBasicParams(
  gemAddress: string,
  debtDelta: any,
  collateralDelta: any,
  providedCollateral: any,
  oneInchPayload: any,
  existingCDP: any,
  fundsReciver: string,
  toDAI = false,
  skipFL = false,
) {
  debtDelta = ensureWeiFormat(debtDelta)
  collateralDelta = ensureWeiFormat(collateralDelta)
  providedCollateral = ensureWeiFormat(providedCollateral)

  const exchangeData = {
    fromTokenAddress: toDAI ? gemAddress : MAINNET_ADRESSES.MCD_DAI,
    toTokenAddress: toDAI ? MAINNET_ADRESSES.MCD_DAI : gemAddress,
    fromTokenAmount: toDAI ? collateralDelta : debtDelta,
    toTokenAmount: toDAI ? debtDelta : collateralDelta,
    minToTokenAmount: toDAI ? debtDelta : collateralDelta,
    exchangeAddress: oneInchPayload.to,
    _exchangeCalldata: oneInchPayload.data,
  }

  const cdpData = {
    skipFL: skipFL,
    gemJoin: MAINNET_ADRESSES.MCD_JOIN_ETH_A,
    cdpId: existingCDP ? existingCDP.id : 0,
    ilk: existingCDP
      ? existingCDP.ilk
      : '0x0000000000000000000000000000000000000000000000000000000000000000',
    borrowCollateral: collateralDelta,
    requiredDebt: debtDelta,
    depositDai: 0,
    depositCollateral: providedCollateral,
    withdrawDai: 0,
    withdrawCollateral: 0,
    fundsReceiver: fundsReciver,
    methodName: '0x0000000000000000000000000000000000000000000000000000000000000000',
  }

  return {
    exchangeData,
    cdpData,
  }
}

export function prepareMultiplyParameters(
  oneInchPayload: any, // TODO:
  desiredCdpState: any, // TODO:
  multiplyProxyActionsInstanceAddress: string,
  exchangeInstanceAddress: string,
  fundsReceiver: string,
  toDAI = false,
  cdpId = 0,
  skipFL = false,
) {
  const exchangeData = {
    fromTokenAddress: toDAI ? WETH_ADDRESS : MAINNET_ADRESSES.MCD_DAI,
    toTokenAddress: toDAI ? MAINNET_ADRESSES.MCD_DAI : WETH_ADDRESS,
    fromTokenAmount: toDAI
      ? amountToWei(desiredCdpState.toBorrowCollateralAmount).toFixed(0)
      : amountToWei(desiredCdpState.requiredDebt).toFixed(0),
    toTokenAmount: toDAI
      ? amountToWei(desiredCdpState.requiredDebt).toFixed(0)
      : amountToWei(desiredCdpState.toBorrowCollateralAmount).toFixed(0),
    minToTokenAmount: toDAI
      ? amountToWei(desiredCdpState.requiredDebt).toFixed(0)
      : amountToWei(desiredCdpState.toBorrowCollateralAmount).toFixed(0),
    expectedFee: 0,
    exchangeAddress: oneInchPayload.to,
    _exchangeCalldata: oneInchPayload.data,
  }

  const cdpData = {
    skipFL: skipFL,
    gemJoin: MAINNET_ADRESSES.MCD_JOIN_ETH_A,
    cdpId,
    ilk: '0x0000000000000000000000000000000000000000000000000000000000000000',
    fundsReceiver: fundsReceiver,
    borrowCollateral: amountToWei(desiredCdpState.toBorrowCollateralAmount).toFixed(0),
    requiredDebt: amountToWei(desiredCdpState.requiredDebt).toFixed(0),
    depositDai: amountToWei(desiredCdpState.providedDai).toFixed(0),
    depositCollateral: amountToWei(desiredCdpState.providedCollateral).toFixed(0),
    withdrawDai: amountToWei(desiredCdpState.withdrawDai).toFixed(0),
    withdrawCollateral: amountToWei(desiredCdpState.withdrawCollateral).toFixed(0),
    methodName: '',
  }

  const params = packMPAParams(
    cdpData,
    exchangeData,
    addressRegistryFactory(multiplyProxyActionsInstanceAddress, exchangeInstanceAddress),
  )

  return { params, exchangeData, cdpData }
}

export function prepareMultiplyParameters2(
  fromTokenAddress: string,
  toTokenAddress: string,
  oneInchPayload: any, // TODO:
  cdpId: string, // TODO:
  desiredCdpState: any, // TODO:
  multiplyProxyActionsInstanceAddress: string,
  exchangeInstanceAddress: string,
  userAddress: string,
  skipFL = false,
  join = MAINNET_ADRESSES.MCD_JOIN_ETH_A,
  precision = 18,
  reversedSwap = false,
) {
  const exchangeData = {
    fromTokenAddress,
    toTokenAddress,
    fromTokenAmount: amountToWei(
      desiredCdpState.fromTokenAmount,
      reversedSwap ? precision : 18,
    ).toFixed(0),
    toTokenAmount: amountToWei(
      desiredCdpState.toTokenAmount,
      !reversedSwap ? precision : 18,
    ).toFixed(0),
    minToTokenAmount: amountToWei(
      desiredCdpState.toTokenAmount,
      !reversedSwap ? precision : 18,
    ).toFixed(0),
    exchangeAddress: oneInchPayload.to,
    _exchangeCalldata: oneInchPayload.data,
  }

  const cdpData = {
    skipFL,
    gemJoin: join,
    cdpId: cdpId,
    ilk: '0x0000000000000000000000000000000000000000000000000000000000000000',
    fundsReceiver: userAddress,
    borrowCollateral: amountToWei(desiredCdpState.toBorrowCollateralAmount, precision).toFixed(0),
    requiredDebt: amountToWei(desiredCdpState.requiredDebt).toFixed(0),
    depositDai: amountToWei(desiredCdpState.providedDai || zero).toFixed(0),
    depositCollateral: amountToWei(desiredCdpState.providedCollateral || zero, precision).toFixed(
      0,
    ),
    withdrawDai: amountToWei(desiredCdpState.withdrawDai || zero).toFixed(0),
    withdrawCollateral: amountToWei(desiredCdpState.withdrawCollateral || zero, precision).toFixed(
      0,
    ),
    methodName: '',
  }

  const params = [
    exchangeData,
    cdpData,
    addressRegistryFactory(multiplyProxyActionsInstanceAddress, exchangeInstanceAddress),
  ]

  return params
}
