import { ADDRESSES, calldataTypes } from '@oasisdex/oasis-actions'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { loadFixture } from 'ethereum-waffle'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'

import IERC20_ABI from '../../abi/IERC20.json'
import { restoreSnapshot } from '../../helpers/restoreSnapshot'
import { RuntimeConfig } from '../../helpers/types/common'
import { amountToWei } from '../../helpers/utils'
import { testBlockNumber } from '../config'
import { initialiseConfig } from '../fixtures/setup'

describe('SetApproval Action', () => {
  const AMOUNT = new BigNumber(1000)
  let config: RuntimeConfig
  let approval: Contract
  let approvalActionAddress: string

  before(async () => {
    ;({ config } = await loadFixture(initialiseConfig))

    const { snapshot } = await restoreSnapshot({
      config,
      provider: config.provider,
      blockNumber: testBlockNumber,
    })

    approval = snapshot.deployed.system.common.setApproval
    approvalActionAddress = snapshot.deployed.system.common.setApproval.address
  })

  afterEach(async () => {
    await restoreSnapshot({ config, provider: config.provider, blockNumber: testBlockNumber })
  })

  it('should set approval', async () => {
    await approval.execute(
      ethers.utils.defaultAbiCoder.encode(
        [calldataTypes.common.Approval],
        [
          {
            asset: ADDRESSES.main.DAI,
            delegate: config.address,
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
