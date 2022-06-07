import BigNumber from 'bignumber.js'
import ADDRESSES from '../../../addresses/mainnet.json'
import { ONE } from '../../../helpers/constants'
import { exchangeFromDAI, exchangeToDAI } from '../http-apis'

export async function getPayload(
  exchangeData, // TODO:
  beneficiary: string,
  slippage: BigNumber.Value,
  fee, // TODO:
  protocols: string[],
) {
  const slippageAdjusted = new BigNumber(slippage).times(100)

  if (exchangeData.fromTokenAddress === ADDRESSES.main.DAI) {
    const response = await exchangeFromDAI(
      exchangeData.toTokenAddress,
      new BigNumber(exchangeData.fromTokenAmount).times(ONE.minus(fee)).toFixed(0),
      slippageAdjusted.toFixed(),
      beneficiary,
      protocols,
    )

    return response?.tx
  }

  const response = await exchangeToDAI(
    exchangeData.fromTokenAddress,
    exchangeData.fromTokenAmount,
    beneficiary,
    slippageAdjusted.toFixed(),
    protocols,
  )

  return response?.tx
}
