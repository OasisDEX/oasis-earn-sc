import { balanceOf } from '@helpers/utils'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { HUNDRED } from '@oasisdex/oasis-actions'

import { expectToBeEqual } from '../../../utils'
import { aDAI, deployedContracts, DEPOSIT_OPERATION } from './L2TestsHelper'

describe('Deposit Action', () => {
  it('should supply funds to the protocol', async () => {
    const { balanceConfig, opExecutor, depositActions } = await loadFixture(deployedContracts)

    const balanceBeforeDeposit = await balanceOf(aDAI, opExecutor.address, balanceConfig)

    await opExecutor.executeOp(depositActions, DEPOSIT_OPERATION, {
      gasLimit: 4000000,
    })

    const balanceAfterDeposit = await balanceOf(aDAI, opExecutor.address, balanceConfig)

    expectToBeEqual(balanceAfterDeposit, balanceBeforeDeposit.plus(HUNDRED))
  })
})
