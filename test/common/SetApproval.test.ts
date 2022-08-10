import { ADDRESSES, calldataTypes } from '@oasisdex/oasis-actions'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'

import IERC20_ABI from '../../abi/IERC20.json'
import init, { resetNode } from '../../helpers/init'
import { RuntimeConfig } from '../../helpers/types/common'
import { amountToWei } from '../../helpers/utils'
import { testBlockNumber } from '../config'
import { deploySystem } from '../deploySystem'

describe('SetApproval Action', () => {
  const AMOUNT = new BigNumber(1000)
  let config: RuntimeConfig
  let approval: Contract
  let approvalActionAddress: string

  before(async () => {
    config = await init()
  })

  beforeEach(async () => {
    await resetNode(config.provider, testBlockNumber)

    const { system: _system } = await deploySystem(config)

    approval = _system.common.setApproval
    approvalActionAddress = _system.common.setApproval.address
  })

  it('should set approval', async () => {
    await approval.execute(
      ethers.utils.defaultAbiCoder.encode(
        [calldataTypes.common.Approval],
        [
          {
            asset: ADDRESSES.main.DAI,
            delegator: config.address,
            amount: amountToWei(AMOUNT).toFixed(0),
          },
        ],
      ),
      [0, 0, 0],
    )

    const DAI = new ethers.Contract(ADDRESSES.main.DAI, IERC20_ABI, config.signer)

    const allowance = await DAI.allowance(approvalActionAddress, config.address)

    expect(allowance.toString()).to.equal(amountToWei(AMOUNT).toFixed(0))
  })
})
