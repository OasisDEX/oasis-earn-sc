import { ADDRESSES, FIFTY, HUNDRED } from '@dupa-library'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { balanceOf } from 'packages/dupa-common/utils/common'

<<<<<<<< HEAD:packages/dupa-library/test/aave/actions/BorrowV3L2.test.ts
import { expectToBeEqual } from '../../../../dupa-common/test-utils/expect'
========
import { expectToBeEqual } from '../../../utils'
>>>>>>>> dev:test/e2e/actions/aave/BorrowV3L2.test.ts
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
