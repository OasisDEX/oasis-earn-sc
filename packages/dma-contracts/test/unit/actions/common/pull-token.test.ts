import { testBlockNumber } from '@dma-contracts/test/config'
import { initialiseConfig } from '@dma-contracts/test/fixtures'
import { ADDRESSES } from '@dma-deployments/addresses'
import { Network } from '@dma-deployments/types/network'
import { calldataTypes } from '@dma-library'
import { Contract } from '@ethersproject/contracts'
import { ONE, TEN, TEN_THOUSAND } from '@oasisdex/dma-common/constants'
import { restoreSnapshot } from '@oasisdex/dma-common/test-utils'
import { RuntimeConfig } from '@oasisdex/dma-common/types/common'
import { amountToWei, approve, balanceOf } from '@oasisdex/dma-common/utils/common'
import { swapUniswapTokens } from '@oasisdex/dma-common/utils/swap'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { loadFixture } from 'ethereum-waffle'
import { ethers } from 'ethers'

// TODO: Fix broken test
describe.skip('PullToken Action | Unit', () => {
  const AMOUNT = new BigNumber(1000)
  let config: RuntimeConfig
  let pullToken: Contract
  let pullTokenActionAddress: string

  before(async () => {
    ;({ config } = await loadFixture(initialiseConfig))
    const { snapshot } = await restoreSnapshot({
      config,
      provider: config.provider,
      blockNumber: testBlockNumber,
    })

    pullToken = snapshot.deployed.system.common.pullToken
    pullTokenActionAddress = snapshot.deployed.system.common.pullToken.address
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
    await restoreSnapshot({ config, provider: config.provider, blockNumber: testBlockNumber })
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
