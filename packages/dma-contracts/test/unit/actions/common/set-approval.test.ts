import IERC20_ABI from '@abis/external/tokens/IERC20.json'
import { ADDRESSES } from '@deploy-configurations/addresses'
import { Network } from '@deploy-configurations/types/network'
import { expect, restoreSnapshot } from '@dma-common/test-utils'
import { RuntimeConfig } from '@dma-common/types/common'
import { amountToWei } from '@dma-common/utils/common'
import { testBlockNumber } from '@dma-contracts/test/config'
import { initialiseConfig } from '@dma-contracts/test/fixtures'
import { calldataTypes } from '@dma-library'
import { Contract } from '@ethersproject/contracts'
import BigNumber from 'bignumber.js'
import { loadFixture } from 'ethereum-waffle'
import { ethers } from 'hardhat'

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
