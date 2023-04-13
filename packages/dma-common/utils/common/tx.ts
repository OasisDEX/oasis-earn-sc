import IERC20_ABI from '@oasisdex/abis/external/tokens/IERC20.json'
import { ADDRESSES } from '@oasisdex/addresses/src'
import { amountFromWei } from '@utils/common/precision'
import BigNumber from 'bignumber.js'
import { Signer } from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { RuntimeConfig } from '../../types/common'

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
