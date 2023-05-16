import { ADDRESSES } from '@deploy-configurations/addresses'
import { Network } from '@deploy-configurations/types/network'
import { FIFTY, HUNDRED } from '@dma-common/constants'
import { expect } from '@dma-common/test-utils'
import { balanceOf } from '@dma-common/utils/common'
import { loadFixture } from 'ethereum-waffle'

import { aDAI, BORROW_OPERATION, deployedContracts, DEPOSIT_OPERATION } from './l2-tests-helper'

// TODO: UPDATE TEST
describe.skip('Borrow Action | E2E', () => {
  it('should borrow funds from the protocol', async () => {
    const { balanceConfig, opExecutor, depositActions, borrowActions } = await loadFixture(
      deployedContracts,
    )
    const balanceBeforeDeposit = await balanceOf(aDAI, opExecutor.address, balanceConfig)

    await opExecutor.executeOp(depositActions, DEPOSIT_OPERATION, {
      gasLimit: 4000000,
    })

    const balanceAfterDeposit = await balanceOf(aDAI, opExecutor.address, balanceConfig)

    expect.toBeEqual(balanceAfterDeposit, balanceBeforeDeposit.plus(HUNDRED))

    const balanceBeforeBorrow = await balanceOf(
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

    const balanceAfterBorrow = await balanceOf(
      ADDRESSES[Network.OPTIMISM].common.USDC,
      opExecutor.address,
      {
        ...balanceConfig,
        decimals: 6,
      },
    )

    expect.toBeEqual(balanceAfterBorrow, balanceBeforeBorrow.plus(FIFTY))
  })
})
