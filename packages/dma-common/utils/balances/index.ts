import IERC20_ABI from '@abis/external/tokens/IERC20.json'
import { ADDRESSES } from '@deploy-configurations/addresses'
import { Network } from '@deploy-configurations/types/network'
import { BalanceOptions } from '@dma-common/types/common'
import BigNumber from 'bignumber.js'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

export async function balanceOf(
  asset: string,
  address: string,
  options: BalanceOptions,
  hre?: HardhatRuntimeEnvironment,
  network: Network = Network.MAINNET,
): Promise<BigNumber> {
  let balance
  const { provider, signer } = options.config
  const ethers = hre ? hre.ethers : (await import('hardhat')).ethers

  // TODO: Hacky fix. Should pass addresses as params
  if (network !== Network.MAINNET && network !== Network.OPTIMISM) {
    throw new Error('Unsupported network')
  }

  const ETHByNetwork = {
    [Network.MAINNET]: ADDRESSES[Network.MAINNET].common.ETH,
    [Network.OPTIMISM]: ADDRESSES[Network.OPTIMISM].common.ETH,
  }

  if (asset === ETHByNetwork[network]) {
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
