import { IERC4626 } from '@typechain/index'
import { BigNumber } from 'bignumber.js'
import { ethers } from 'ethers'

import erc4626abi from '../../../../abis/external/tokens/IERC4626.json'
import { ZERO } from '../../../../dma-common/constants/numbers'
import { Erc4626Position } from './types'

export type Erc4646EarnDependencies = {
  provider: ethers.providers.Provider
}
export type Erc4626Args = {
  proxyAddress: string
  vaultAddress: string
  quotePrice: BigNumber
}

export async function getErc4626Position(
  { proxyAddress, vaultAddress, quotePrice }: Erc4626Args,
  { provider }: Erc4646EarnDependencies,
): Promise<Erc4626Position> {
  const vault = new ethers.Contract(vaultAddress, erc4626abi, provider) as IERC4626
  let quoteTokenAmount = new BigNumber(0)
  await vault.balanceOf(proxyAddress).then((balance: ethers.BigNumber) => {
    vault.convertToAssets(balance).then((assets: ethers.BigNumber) => {
      quoteTokenAmount = new BigNumber(assets.toString())
    })
  })
  // TODO: implement
  return new Erc4626Position(
    { address: vaultAddress, quoteToken: '' },
    proxyAddress,
    quoteTokenAmount,
    new BigNumber(100000000),
    quotePrice,
    { withFees: ZERO, withoutFees: ZERO },
    { withFees: ZERO, withoutFees: ZERO },
  )
}
