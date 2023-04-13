import IERC20_ABI from '@oasisdex/abis/external/tokens/IERC20.json'
import { ADDRESSES } from '@oasisdex/addresses/src'
import BigNumber from 'bignumber.js'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { BalanceOptions } from '../../types/common'

export async function balanceOf(
  asset: string,
  address: string,
  options: BalanceOptions,
  hre?: HardhatRuntimeEnvironment,
): Promise<BigNumber> {
  let balance
  const { provider, signer } = options.config
  const ethers = hre ? hre.ethers : (await import('hardhat')).ethers
  if (asset === ADDRESSES.mainnet.common.ETH) {
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
