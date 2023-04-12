import { JsonRpcProvider } from '@ethersproject/providers'
import IERC20_ABI from '@oasisdex/abis/external/tokens/IERC20.json'
import { ADDRESSES } from '@oasisdex/addresses'
import BigNumber from 'bignumber.js'
import { Signer } from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { isError, tryF } from 'ts-try'

import { TEN } from '../constants'
import { BalanceOptions, RuntimeConfig } from '../types/common'

export async function balanceOf(
  asset: string,
  address: string,
  options: BalanceOptions,
  hre?: HardhatRuntimeEnvironment,
): Promise<BigNumber> {
  let balance
  const { provider, signer } = options.config
  const ethers = hre ? hre.ethers : (await import('hardhat')).ethers
  if (asset === ADDRESSES.main.ETH) {
    balance = new BigNumber((await provider.getBalance(address)).toString())
  } else {
    const ERC20Asset = new ethers.Contract(asset, IERC20_ABI, signer)
    balance = await ERC20Asset.balanceOf(address)
  }

  if (options.isFormatted && balance) {
    const decimals = options.decimals ? options.decimals : 18
    return new BigNumber(ethers.utils.formatUnits(balance.toString(), decimals))
  }

  if (options.debug) {
    console.log(`DEBUG: Account ${address}'s balance for ${asset} is: ${balance}`)
  }

  return new BigNumber(balance.toString())
}

export async function approve(
  asset: string,
  spender: string,
  amount: BigNumber,
  config: RuntimeConfig,
  debug?: boolean,
  hre?: HardhatRuntimeEnvironment,
) {
  const ethers = hre ? hre.ethers : (await import('hardhat')).ethers
  const instance = new ethers.Contract(asset, IERC20_ABI, config.signer)
  await instance.approve(spender, amount.toString(), {
    gasLimit: 3000000,
  })

  if (debug) {
    console.log(`DEBUG: Approved ${amountFromWei(amount).toString()} on ${asset} for ${spender}`)
  }
}

export async function send(
  to: string,
  tokenAddr: string,
  amount: string,
  signer?: Signer,
  hre?: HardhatRuntimeEnvironment,
) {
  const ethers = hre ? hre.ethers : (await import('hardhat')).ethers
  if (tokenAddr === ADDRESSES.main.ETH) {
    const tx = await signer?.sendTransaction({
      from: await signer.getAddress(),
      to,
      value: ethers.BigNumber.from(amount),
      gasLimit: 30000000,
    })
    await tx?.wait()
  } else {
    const tokenContract = await ethers.getContractAt(IERC20_ABI, tokenAddr)

    const transferTx = await tokenContract.transfer(to, amount)
    await transferTx.wait()
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

export async function getLatestBlock(provider: JsonRpcProvider) {
  return provider.getBlockNumber()
}

export async function getRecentBlock({
  provider,
  offset,
  roundToNearest = 1,
}: {
  provider: JsonRpcProvider
  offset: number
  roundToNearest?: number
}) {
  return getLatestBlock(provider)
    .then(blockNumber => blockNumber - offset)
    .then(blockNumber => Math.floor(blockNumber / roundToNearest) * roundToNearest)
}
