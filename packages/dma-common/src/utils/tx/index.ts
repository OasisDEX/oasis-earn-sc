import { IERC20__factory } from '@oasisdex/abis'
import { ADDRESSES } from '@oasisdex/deploy-configurations/addresses'
import { Network } from '@oasisdex/deploy-configurations/types'
import BigNumber from 'bignumber.js'
import { Signer } from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { RuntimeConfig } from '../../types'
import { amountFromWei } from '../common'

export async function approve(
  asset: string,
  spender: string,
  amount: BigNumber,
  config: RuntimeConfig,
  debug?: boolean,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  hre?: HardhatRuntimeEnvironment,
) {
  const instance = IERC20__factory.connect(asset, config.signer)
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
  if (tokenAddr === ADDRESSES[Network.MAINNET].common.ETH) {
    const tx = await signer?.sendTransaction({
      from: await signer.getAddress(),
      to,
      value: ethers.BigNumber.from(amount),
      gasLimit: 30000000,
    })
    await tx?.wait()
  } else {
    if (signer) {
      const tokenContract = IERC20__factory.connect(tokenAddr, signer)

      const transferTx = await tokenContract.transfer(to, amount)
      await transferTx.wait()
    }
  }
}
