import { ADDRESSES } from '@deploy-configurations/addresses'
import { Network } from '@deploy-configurations/types/network'
import { ONE, TEN, TEN_THOUSAND } from '@dma-common/constants'
import { swapUniswapTokens } from '@dma-common/test-utils'
import { RuntimeConfig } from '@dma-common/types/common'
import { balanceOf } from '@dma-common/utils/balances'
import { amountToWei } from '@dma-common/utils/common'
import { approve } from '@dma-common/utils/tx'
import { testBlockNumber } from '@dma-contracts/test/config'
import { initialiseConfig } from '@dma-contracts/test/fixtures'
import { restoreSnapshot } from '@dma-contracts/utils'
import { calldataTypes } from '@dma-library'
import { Contract } from '@ethersproject/contracts'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { loadFixture } from 'ethereum-waffle'
import { ethers } from 'ethers'
import hre from 'hardhat'

describe('PullToken Action | Unit', () => {
  const AMOUNT = new BigNumber(1000)
  let config: RuntimeConfig
  let pullToken: Contract
  let pullTokenActionAddress: string

  before(async () => {
    ;({ config } = await loadFixture(initialiseConfig))
    const { snapshot } = await restoreSnapshot({
      hre,
      blockNumber: testBlockNumber,
    })

    pullToken = snapshot.testSystem.deployment.system.PullToken.contract
    pullTokenActionAddress = snapshot.testSystem.deployment.system.PullToken.contract.address
  })

  beforeEach(async () => {
    await swapUniswapTokens(
      ADDRESSES[Network.MAINNET].common.WETH,
      ADDRESSES[Network.MAINNET].common.DAI,
      amountToWei(ONE).toFixed(0),
      amountToWei(AMOUNT).toFixed(0),
      config.address,
      config,
    )

    await approve(
      ADDRESSES[Network.MAINNET].common.DAI,
      pullTokenActionAddress,
      amountToWei(AMOUNT),
      config,
      false,
    )
  })

  afterEach(async () => {
    await restoreSnapshot({ hre, blockNumber: testBlockNumber })
  })

  it('should pull tokens from the caller', async () => {
    await pullToken.execute(
      ethers.utils.defaultAbiCoder.encode(
        [calldataTypes.common.PullToken],
        [
          {
            amount: amountToWei(AMOUNT).toFixed(0),
            asset: ADDRESSES[Network.MAINNET].common.DAI,
            from: config.address,
          },
        ],
      ),
      [],
    )

    const balance = await balanceOf(ADDRESSES[Network.MAINNET].common.DAI, pullTokenActionAddress, {
      config,
      debug: false,
      isFormatted: false,
    })

    expect(balance.toString()).to.equal(amountToWei(AMOUNT).toString())
  })

  it('should fail if there is not enough allowance set', async () => {
    const tx = pullToken.execute(
      ethers.utils.defaultAbiCoder.encode(
        [calldataTypes.common.PullToken],
        [
          {
            amount: amountToWei(AMOUNT.plus(TEN)).toFixed(0),
            asset: ADDRESSES[Network.MAINNET].common.DAI,
            from: config.address,
          },
        ],
      ),
      [],
    )
    await expect(tx).to.be.revertedWith('Dai/insufficient-allowance')
  })

  it('should fail if the caller does not have enough funds', async () => {
    await approve(
      ADDRESSES[Network.MAINNET].common.DAI,
      pullTokenActionAddress,
      amountToWei(AMOUNT.times(TEN)),
      config,
      false,
    )
    const tx = pullToken.execute(
      ethers.utils.defaultAbiCoder.encode(
        [calldataTypes.common.PullToken],
        [
          {
            amount: amountToWei(AMOUNT.times(TEN_THOUSAND)).toFixed(0),
            asset: ADDRESSES[Network.MAINNET].common.DAI,
            from: config.address,
          },
        ],
      ),
      [],
    )
    await expect(tx).to.be.revertedWith('Dai/insufficient-balance')
  })
})
