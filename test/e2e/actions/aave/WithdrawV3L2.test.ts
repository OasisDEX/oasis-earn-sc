import { balanceOf } from '@helpers/utils'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { HUNDRED, ZERO } from '@oasisdex/oasis-actions'

import { expectToBeEqual } from '../../../utils'
import { aDAI, deployedContracts, DEPOSIT_OPERATION, WITHDRAW_OPERATION } from './L2TestsHelper'

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

    expectToBeEqual(balanceAfterDeposit, balanceBeforeDeposit.plus(HUNDRED))

    await opExecutor.executeOp(withdrawActions, WITHDRAW_OPERATION, {
      gasLimit: 4000000,
    })

    const balanceAfterWithdraw = await balanceOf(aDAI, opExecutor.address, balanceConfig)

    // TODO: Probably I can take actual amount from the event....
    expectToBeEqual(balanceAfterWithdraw, ZERO)
  })
})
