import BigNumber from 'bignumber.js'
import { Signer } from 'ethers'
import { ethers } from 'hardhat'
import { isError, tryF } from 'ts-try'

import CTOKEN_ABI from '../abi/CErc20.json'
import IERC20_ABI from '../abi/IERC20.json'
import { ONE, TEN } from '../helpers/constants'
import { BalanceOptions, RuntimeConfig } from '../helpers/types/common'
import { ADDRESSES } from './addresses'

export async function balanceOf(
  asset: string,
  address: string,
  options: BalanceOptions,
): Promise<string | BigNumber> {
  let balance = undefined
  const { provider, signer } = options.config
  if (asset === ADDRESSES.main.ETH) {
    balance = await provider.getBalance(address)
  } else {
    const ERC20Asset = new ethers.Contract(asset, IERC20_ABI, signer)
    balance = await ERC20Asset.balanceOf(address)
  }

  if (options.isFormatted) {
    const decimals = options.decimals ? options.decimals : 18
    return ethers.utils.formatUnits(balance.toString(), decimals)
  }

  if (options.debug) {
    console.log(`DEBUG: Account ${address}'s balance for ${asset} is: ${balance}`)
  }

  return new BigNumber(balance.toString())
}

export async function balanceOfUnderlying(asset: string, address: string, options: BalanceOptions) {
  const { signer } = options.config
  const CERC20Asset = new ethers.Contract(asset, CTOKEN_ABI, signer)
  const balance = await CERC20Asset.callStatic.balanceOfUnderlying(address)
  const decimals = options.decimals ? options.decimals : 18
  const formattedBalance = ethers.utils.formatUnits(balance.toString(), decimals)

  if (options.debug) {
    console.log(
      `DEBUG: Account ${address}'s balance for underlying ${asset} is: ${formattedBalance.toString()}`,
    )
  }

  return formattedBalance
}

export async function approve(
  asset: string,
  spender: string,
  amount: BigNumber,
  config: RuntimeConfig,
  debug?: boolean,
) {
  const instance = new ethers.Contract(asset, IERC20_ABI, config.signer)
  await instance.approve(spender, amount.toString(), {
    gasLimit: 3000000,
  })

  if (debug) {
    console.log(`DEBUG: Approved ${amountFromWei(amount).toString()} on ${asset} for ${spender}`)
  }
}

export async function send(to: string, tokenAddr: string, amount: string, signer?: Signer) {
  if (to === ADDRESSES.main.ETH) {
    const tx = await signer?.sendTransaction({
      from: await signer.getAddress(),
      to,
      value: amount,
      gasLimit: 30000000,
    })
    await tx?.wait()
  } else {
    const tokenContract = await ethers.getContractAt(IERC20_ABI, tokenAddr)

    const transferTx = await tokenContract.transfer(to, amount)
    await transferTx.wait()
  }
}

type PositionCalculationResult = {
  ownDepositAmount: BigNumber
  lendAmount: BigNumber
  borrowAmount: BigNumber
  flashloanAmount: BigNumber
}

// TODO - This needs to be changed based on the new calculations for AAVE
export function calculatePositionParams(
  ownDepositAmount: BigNumber,
  debug?: boolean,
): PositionCalculationResult {
  // minCR = 77%  1/ 0.77 = ~1.2987 = 129.87%
  // ownDeposit = 100k
  // lendAmount = (ownDeposit / (minCR - 100%)) * minCR
  // borrowAmount = (ownDeposit / (minCR - 100%)) * 100%
  const minCR = ONE.div(new BigNumber(0.77))
  const lendAmount = ownDepositAmount.div(minCR.minus(ONE)).times(minCR).decimalPlaces(18)
  const borrowAmount = ownDepositAmount.div(minCR.minus(ONE)).times(ONE).decimalPlaces(18)
  const flashloanAmount = lendAmount.minus(ownDepositAmount).decimalPlaces(18)

  if (debug) {
    console.log(`DEBUG: User can deposit ${ownDepositAmount.toFixed(6)}`)
    console.log(`DEBUG: User can lend ${lendAmount.toFixed(6)}`)
    console.log(`DEBUG: User can borrow ${borrowAmount.toFixed(6)}`)
    console.log(`DEBUG: User will take ${flashloanAmount.toFixed(6)} of flash loan`)
  }

  return {
    ownDepositAmount: amountToWei(ownDepositAmount),
    lendAmount: amountToWei(lendAmount),
    borrowAmount: amountToWei(borrowAmount),
    flashloanAmount: amountToWei(flashloanAmount),
  }
}

export function amountToWei(amount: BigNumber.Value, precision = 18) {
  BigNumber.config({ EXPONENTIAL_AT: 30 })
  return new BigNumber(amount || 0).times(new BigNumber(10).pow(precision))
}

export function amountFromWei(amount: BigNumber.Value, precision = 18) {
  return new BigNumber(amount || 0).div(new BigNumber(10).pow(precision))
}

export function ensureWeiFormat(
  input: BigNumber.Value, // TODO:
  interpretBigNum = true,
) {
  const bn = new BigNumber(input)

  const result = tryF(() => {
    if (interpretBigNum && bn.lt(TEN.pow(9))) {
      return bn.times(TEN.pow(18))
    }

    return bn
  })

  if (isError(result)) {
    throw Error(`Error running \`ensureWeiFormat\` with input ${input.toString()}: ${result}`)
  }

  return result.decimalPlaces(0).toFixed(0)
}

export function logDebug(lines: string[], prefix = '') {
  lines.forEach(line => console.log(`${prefix}${line}`))
}

export function asPercentageValue(value: BigNumber.Value, base: BigNumber.Value) {
  const val = new BigNumber(value)

  return {
    get value() {
      return val
    },

    asDecimal: val.div(base),
  }
}
