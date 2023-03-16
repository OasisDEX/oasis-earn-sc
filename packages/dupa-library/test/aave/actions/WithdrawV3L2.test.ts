import { HUNDRED, ZERO } from '@dupa-library/helpers/constants'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { balanceOf } from 'packages/dupa-common/utils/common'

import { expectToBeEqual } from '../../../../dupa-common/test-utils/expect'
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
