import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { HUNDRED, ZERO } from '@oasisdex/dma-common/constants'
import { expect } from '@oasisdex/dma-common/test-utils'
import { balanceOf } from '@oasisdex/dma-common/utils/common'

import { aDAI, deployedContracts, DEPOSIT_OPERATION, WITHDRAW_OPERATION } from './l2-tests-helper'

// TODO: UPDATE TEST
describe.skip('Withdraw Action | E2E', () => {
  // TODO: create a test scenario for specific amount
  it('should withdraw all funds from the protocol', async () => {
    const { balanceConfig, opExecutor, depositActions, withdrawActions } = await loadFixture(
      deployedContracts,
    )

    const balanceBeforeDeposit = await balanceOf(aDAI, opExecutor.address, balanceConfig)

    await opExecutor.executeOp(depositActions, DEPOSIT_OPERATION, {
      gasLimit: 4000000,
    })

    const balanceAfterDeposit = await balanceOf(aDAI, opExecutor.address, balanceConfig)

    expect.toBeEqual(balanceAfterDeposit, balanceBeforeDeposit.plus(HUNDRED))

    await opExecutor.executeOp(withdrawActions, WITHDRAW_OPERATION, {
      gasLimit: 4000000,
    })

    const balanceAfterWithdraw = await balanceOf(aDAI, opExecutor.address, balanceConfig)

    // TODO: Probably I can take actual amount from the event....
    expect.toBeEqual(balanceAfterWithdraw, ZERO)
  })
})
