import { HUNDRED } from '@dupa-library'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { balanceOf } from 'packages/dupa-common/utils/common'

<<<<<<<< HEAD:packages/dupa-library/test/aave/actions/DepositV3L2.test.ts
import { expectToBeEqual } from '../../../../dupa-common/test-utils/expect'
========
import { expectToBeEqual } from '../../../utils'
>>>>>>>> dev:test/e2e/actions/aave/DepositV3L2.test.ts
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
