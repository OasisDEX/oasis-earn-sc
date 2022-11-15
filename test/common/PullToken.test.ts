import { ADDRESSES, calldataTypes, ONE, TEN, TEN_THOUSAND } from '@oasisdex/oasis-actions'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { loadFixture } from 'ethereum-waffle'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'

import { restoreSnapshot } from '../../helpers/restoreSnapshot'
import { swapUniswapTokens } from '../../helpers/swap/uniswap'
import { RuntimeConfig } from '../../helpers/types/common'
import { amountToWei, approve, balanceOf } from '../../helpers/utils'
import { testBlockNumber } from '../config'
import { initialiseConfig } from '../fixtures/setup'

describe('PullToken Action', () => {
  const AMOUNT = new BigNumber(1000)
  let config: RuntimeConfig
  let pullToken: Contract
  let pullTokenActionAddress: string

  before(async () => {
    ;({ config } = await loadFixture(initialiseConfig))
    const snapshot = await restoreSnapshot(config, config.provider, testBlockNumber)

    pullToken = snapshot.deployed.system.common.pullToken
    pullTokenActionAddress = snapshot.deployed.system.common.pullToken.address
  })

  beforeEach(async () => {
    await swapUniswapTokens(
      ADDRESSES.main.WETH,
      ADDRESSES.main.DAI,
      amountToWei(ONE).toFixed(0),
      amountToWei(AMOUNT).toFixed(0),
      config.address,
      config,
    )

    await approve(ADDRESSES.main.DAI, pullTokenActionAddress, amountToWei(AMOUNT), config, false)
  })

  afterEach(async () => {
    await restoreSnapshot(config, config.provider, testBlockNumber)
  })

  it('should pull tokens from the caller', async () => {
    await pullToken.execute(
      ethers.utils.defaultAbiCoder.encode(
        [calldataTypes.common.PullToken],
        [
          {
            amount: amountToWei(AMOUNT).toFixed(0),
            asset: ADDRESSES.main.DAI,
            from: config.address,
          },
        ],
      ),
      [],
    )

    const balance = await balanceOf(ADDRESSES.main.DAI, pullTokenActionAddress, {
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
            asset: ADDRESSES.main.DAI,
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
      ADDRESSES.main.DAI,
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
            asset: ADDRESSES.main.DAI,
            from: config.address,
          },
        ],
      ),
      [],
    )
    await expect(tx).to.be.revertedWith('Dai/insufficient-balance')
  })
})
