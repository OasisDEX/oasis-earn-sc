import {
  calldataTypes,
} from '@dupa-library'
import IERC20_ABI from '@oasisdex/dupa-contracts/abi/IERC20.json'
import { restoreSnapshot } from '@oasisdex/dupa-common/test-utils'
import { RuntimeConfig } from "@oasisdex/dupa-common/utils/types/common";
import { loadFixture } from 'ethereum-waffle'
import { ethers } from 'hardhat'
import { initialiseConfig } from "@dupa-library/test/fixtures";
import { testBlockNumber } from "@dupa-library/test/config";
import { ADDRESSES } from "@dupa-library/utils/addresses";
import { expect } from '@oasisdex/dupa-common/test-utils'
import BigNumber from "bignumber.js";
import { amountToWei } from "@oasisdex/dupa-common/utils/common";
import { Contract } from "@ethersproject/contracts";

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
