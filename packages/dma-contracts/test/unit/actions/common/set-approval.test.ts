import { testBlockNumber } from '@dma-contracts/test/config'
import { initialiseConfig } from '@dma-contracts/test/fixtures'
import { Contract } from '@ethersproject/contracts'
import IERC20_ABI from '@oasisdex/abis/external/tokens/IERC20.json'
import { expect, restoreSnapshot } from '@oasisdex/dma-common/test-utils'
import { RuntimeConfig } from '@oasisdex/dma-common/types/common'
import { amountToWei } from '@oasisdex/dma-common/utils/common'
import { ADDRESSES } from '@oasisdex/dma-deployments'
import { Network } from '@oasisdex/dma-deployments/types/network'
import { calldataTypes } from '@oasisdex/dma-library'
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
