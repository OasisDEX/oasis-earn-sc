import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { balanceOf } from '@oasisdex/dupa-common/utils/common'

import { expect } from '@oasisdex/dupa-common/test-utils'
import { aDAI, deployedContracts, DEPOSIT_OPERATION, WITHDRAW_OPERATION } from './L2TestsHelper'
import { HUNDRED, ZERO } from '@oasisdex/dupa-common/constants'

describe('Withdraw Action', () => {
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
