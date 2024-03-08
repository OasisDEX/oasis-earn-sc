import { IERC20 } from '@abis/types/index'
import { IERC4626 } from '@typechain/index'
import { BigNumber } from 'bignumber.js'
import { ethers } from 'ethers'

import erc4626abi from '../../../../abis/external/tokens/IERC4626.json'
import { ZERO } from '../../../../dma-common/constants/numbers'
import { AllocationType, Erc4626Position, FeeType } from './types'

export type Erc4646EarnDependencies = {
  provider: ethers.providers.Provider
}
export type Erc4626Args = {
  proxyAddress: string
  user: string
  vaultAddress: string
  quotePrice: BigNumber
}

export async function getErc4626Position(
  { proxyAddress, vaultAddress, quotePrice, user }: Erc4626Args,
  { provider }: Erc4646EarnDependencies,
): Promise<Erc4626Position> {
  const vault = new ethers.Contract(vaultAddress, erc4626abi, provider) as IERC4626
  const depositTokenAddress = await vault.asset()

  const depositToken = new ethers.Contract(depositTokenAddress, erc4626abi, provider) as IERC20
  const decimals = await depositToken.decimals()

  let quoteTokenAmount = new BigNumber(0)

  await vault.balanceOf(proxyAddress).then(async (balance: ethers.BigNumber) => {
    await vault.convertToAssets(balance).then(async (assets: ethers.BigNumber) => {
      quoteTokenAmount = new BigNumber(ethers.utils.formatUnits(assets, decimals).toString())
    })
  })
  const netValue = quoteTokenAmount.multipliedBy(quotePrice)

  return new Erc4626Position(
    { address: vaultAddress, quoteToken: '' },
    user,
    quoteTokenAmount,
    quotePrice,
    netValue,
    { withFees: ZERO, withoutFees: ZERO },
    { withFees: ZERO, withoutFees: ZERO },
    new BigNumber(1214122.13),
    [
      {
        type: AllocationType.LENDING,
        amount: new BigNumber(0),
        additionalInfo: [],
      },
    ],
    [
      {
        token: 'string',
        apyPer1d: new BigNumber(0.001),
        apyPer7d: new BigNumber(0.5),
        apyPer30d: new BigNumber(2),
        apyPer90d: new BigNumber(4),
        apyPer365d: new BigNumber(7),
      },
    ],
    [
      {
        token: 'string',
        amountPer1d: new BigNumber(1),
        amountPer7d: new BigNumber(7),
        amountPer30d: new BigNumber(30),
        amountPer90d: new BigNumber(90),
        amountPer365d: new BigNumber(365),
      },
    ],
    {
      curator: 'string',
      type: FeeType.CURATOR,
      amount: new BigNumber(5),
    },
  )
}
