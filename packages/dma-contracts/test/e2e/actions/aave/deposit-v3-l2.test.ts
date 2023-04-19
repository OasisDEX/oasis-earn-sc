import { HUNDRED } from '@oasisdex/dma-common/constants'
import { expect } from '@oasisdex/dma-common/test-utils'
import { balanceOf } from '@oasisdex/dma-common/utils/common'
import { loadFixture } from 'ethereum-waffle'

import { aDAI, deployedContracts, DEPOSIT_OPERATION } from './l2-tests-helper'

// TODO: UPDATE TEST
describe.skip('Deposit Action | E2E', () => {
  it('should supply funds to the protocol', async () => {
    const { balanceConfig, opExecutor, depositActions } = await loadFixture(deployedContracts)

    const balanceBeforeDeposit = await balanceOf(aDAI, opExecutor.address, balanceConfig)

    await opExecutor.executeOp(depositActions, DEPOSIT_OPERATION, {
      gasLimit: 4000000,
    })

    const balanceAfterDeposit = await balanceOf(aDAI, opExecutor.address, balanceConfig)

    expect.toBeEqual(balanceAfterDeposit, balanceBeforeDeposit.plus(HUNDRED))
  })
})
