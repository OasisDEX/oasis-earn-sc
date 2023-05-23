import { ADDRESSES } from '@deploy-configurations/addresses'
import { Network } from '@deploy-configurations/types/network'
import { FIFTY, ZERO } from '@dma-common/constants'
import { expect } from '@dma-common/test-utils'
import { balanceOf } from '@dma-common/utils/balances'
import { loadFixture } from 'ethereum-waffle'

import {
  BORROW_OPERATION,
  deployedContracts,
  DEPOSIT_OPERATION,
  PAYBACK_OPERATION,
  vOptUSDC,
} from './l2-tests-helper' // TODO: UPDATE TEST

// TODO: UPDATE TEST
describe.skip('Payback Action | E2E', () => {
  it('should payback borrowed funds from the protocol in total', async () => {
    const { balanceConfig, opExecutor, depositActions, borrowActions, paybackActions } =
      await loadFixture(deployedContracts)

    await opExecutor.executeOp(depositActions, DEPOSIT_OPERATION, {
      gasLimit: 4000000,
    })

    const usdcBalanceBeforeBorrow = await balanceOf(
      ADDRESSES[Network.OPTIMISM].common.USDC,
      opExecutor.address,
      {
        ...balanceConfig,
        decimals: 6,
      },
    )

    await opExecutor.executeOp(borrowActions, BORROW_OPERATION, {
      gasLimit: 4000000,
    })

    const usdcBalanceAfterBorrow = await balanceOf(
      ADDRESSES[Network.OPTIMISM].common.USDC,
      opExecutor.address,
      {
        ...balanceConfig,
        decimals: 6,
      },
    )

    const vUsdcBalanceAfterBorrow = await balanceOf(vOptUSDC, opExecutor.address, {
      ...balanceConfig,
      decimals: 6,
    })

    expect.toBeEqual(vUsdcBalanceAfterBorrow, FIFTY)
    expect.toBeEqual(usdcBalanceAfterBorrow, usdcBalanceBeforeBorrow.plus(FIFTY))

    await opExecutor.executeOp(paybackActions, PAYBACK_OPERATION, {
      gasLimit: 4000000,
    })

    const usdcBalanceAfterPayback = await balanceOf(
      ADDRESSES[Network.OPTIMISM].common.USDC,
      opExecutor.address,
      {
        ...balanceConfig,
        decimals: 6,
      },
    )

    const vUsdcBalanceAfterPayback = await balanceOf(vOptUSDC, opExecutor.address, {
      ...balanceConfig,
      decimals: 6,
    })
    expect.toBeEqual(usdcBalanceAfterPayback, usdcBalanceBeforeBorrow)
    expect.toBeEqual(vUsdcBalanceAfterPayback, ZERO)
  })
})
