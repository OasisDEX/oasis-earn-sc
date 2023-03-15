import { balanceOf } from '@helpers/utils'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { ADDRESSES, FIFTY, HUNDRED } from '@oasisdex/oasis-actions'

import { expectToBeEqual } from '../../../utils'
import { aDAI, BORROW_OPERATION, deployedContracts, DEPOSIT_OPERATION } from './L2TestsHelper'

describe('Borrow Action', () => {
  it('should borrow funds from the protocol', async () => {
    const { balanceConfig, opExecutor, depositActions, borrowActions } = await loadFixture(
      deployedContracts,
    )
    const balanceBeforeDeposit = await balanceOf(aDAI, opExecutor.address, balanceConfig)

    await opExecutor.executeOp(depositActions, DEPOSIT_OPERATION, {
      gasLimit: 4000000,
    })

    const balanceAfterDeposit = await balanceOf(aDAI, opExecutor.address, balanceConfig)

    expectToBeEqual(balanceAfterDeposit, balanceBeforeDeposit.plus(HUNDRED))

    const balanceBeforeBorrow = await balanceOf(ADDRESSES.optimism.USDC, opExecutor.address, {
      ...balanceConfig,
      decimals: 6,
    })

    await opExecutor.executeOp(borrowActions, BORROW_OPERATION, {
      gasLimit: 4000000,
    })

    const balanceAfterBorrow = await balanceOf(ADDRESSES.optimism.USDC, opExecutor.address, {
      ...balanceConfig,
      decimals: 6,
    })

    expectToBeEqual(balanceAfterBorrow, balanceBeforeBorrow.plus(FIFTY))
  })
})
