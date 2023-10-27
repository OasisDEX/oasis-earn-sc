import IERC20_ABI from '@abis/external/tokens/IERC20.json'
import { ADDRESSES } from '@deploy-configurations/addresses'
import { Network } from '@deploy-configurations/types/network'
import { expect } from '@dma-common/test-utils'
import { RuntimeConfig } from '@dma-common/types/common'
import { amountToWei } from '@dma-common/utils/common'
import { testBlockNumber } from '@dma-contracts/test/config'
import { initialiseConfig } from '@dma-contracts/test/fixtures'
import { restoreSnapshot } from '@dma-contracts/utils'
import { calldataTypes } from '@dma-library'
import { Contract } from '@ethersproject/contracts'
import BigNumber from 'bignumber.js'
import { loadFixture } from 'ethereum-waffle'
import hre, { ethers } from 'hardhat'

describe('SetApproval Action | Unit', () => {
  const AMOUNT = new BigNumber(1000)
  let config: RuntimeConfig
  let approval: Contract
  let approvalActionAddress: string

  before(async () => {
    ;({ config } = await loadFixture(initialiseConfig))

    const { snapshot } = await restoreSnapshot({
      hre,
      blockNumber: testBlockNumber,
    })

    approval = snapshot.testSystem.deployment.system.SetApproval.contract
    approvalActionAddress = snapshot.testSystem.deployment.system.SetApproval.contract.address
  })

  afterEach(async () => {
    await restoreSnapshot({ hre, blockNumber: testBlockNumber })
  })

  it('should set approval', async () => {
    await approval.execute(
      ethers.utils.defaultAbiCoder.encode(
        [calldataTypes.common.Approval],
        [
          {
            asset: ADDRESSES[Network.MAINNET].common.DAI,
            delegate: config.address,
            amount: amountToWei(AMOUNT).toFixed(0),
          },
        ],
      ),
      [0, 0, 0],
    )

    const DAI = new ethers.Contract(
      ADDRESSES[Network.MAINNET].common.DAI,
      IERC20_ABI,
      config.signer,
    )

    const allowance = await DAI.allowance(approvalActionAddress, config.address)

    expect(allowance.toString()).to.equal(amountToWei(AMOUNT).toFixed(0))
  })
})
