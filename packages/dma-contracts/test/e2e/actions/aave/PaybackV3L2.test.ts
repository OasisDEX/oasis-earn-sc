import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { ADDRESSES } from '@oasisdex/addresses/src'
import { FIFTY, ZERO } from '@oasisdex/dma-common/constants'
import { expect } from '@oasisdex/dma-common/test-utils'
import { balanceOf } from '@oasisdex/dma-common/utils/common'

import {
  BORROW_OPERATION,
  deployedContracts,
  DEPOSIT_OPERATION,
  PAYBACK_OPERATION,
  vOptUSDC,
} from './L2TestsHelper'

describe('Payback Action | E2E', () => {
  it('should payback borrowed funds from the protocol in total', async () => {
    const { balanceConfig, opExecutor, depositActions, borrowActions, paybackActions } =
      await loadFixture(deployedContracts)

    await opExecutor.executeOp(depositActions, DEPOSIT_OPERATION, {
      gasLimit: 4000000,
    })

    const usdcBalanceBeforeBorrow = await balanceOf(ADDRESSES.optimism.USDC, opExecutor.address, {
      ...balanceConfig,
      decimals: 6,
    })

    await opExecutor.executeOp(borrowActions, BORROW_OPERATION, {
      gasLimit: 4000000,
    })

    const usdcBalanceAfterBorrow = await balanceOf(ADDRESSES.optimism.USDC, opExecutor.address, {
      ...balanceConfig,
      decimals: 6,
    })

    const vUsdcBalanceAfterBorrow = await balanceOf(vOptUSDC, opExecutor.address, {
      ...balanceConfig,
      decimals: 6,
    })

    expect.toBeEqual(vUsdcBalanceAfterBorrow, FIFTY)
    expect.toBeEqual(usdcBalanceAfterBorrow, usdcBalanceBeforeBorrow.plus(FIFTY))

    await opExecutor.executeOp(paybackActions, PAYBACK_OPERATION, {
      gasLimit: 4000000,
    })

    const usdcBalanceAfterPayback = await balanceOf(ADDRESSES.optimism.USDC, opExecutor.address, {
      ...balanceConfig,
      decimals: 6,
    })

    const vUsdcBalanceAfterPayback = await balanceOf(vOptUSDC, opExecutor.address, {
      ...balanceConfig,
      decimals: 6,
    })
    expect.toBeEqual(usdcBalanceAfterPayback, usdcBalanceBeforeBorrow)
    expect.toBeEqual(vUsdcBalanceAfterPayback, ZERO)
  })
})
