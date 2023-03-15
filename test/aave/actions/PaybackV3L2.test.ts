import { balanceOf } from '@helpers/utils'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { ADDRESSES, FIFTY, ZERO } from '@oasisdex/oasis-actions'

import { expectToBeEqual } from '../../utils'
import {
  BORROW_OPERATION,
  deployedContracts,
  DEPOSIT_OPERATION,
  PAYBACK_OPERATION,
  vOptUSDC,
} from './L2TestsHelper'

describe('Payback Action', () => {
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

    expectToBeEqual(vUsdcBalanceAfterBorrow, FIFTY)
    expectToBeEqual(usdcBalanceAfterBorrow, usdcBalanceBeforeBorrow.plus(FIFTY))

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
    expectToBeEqual(usdcBalanceAfterPayback, usdcBalanceBeforeBorrow)
    expectToBeEqual(vUsdcBalanceAfterPayback, ZERO)
  })
})
