import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'

import { ADDRESSES } from '../../helpers/addresses'
import { ONE, TEN } from '../../helpers/constants'
import { createDeploy, DeployFunction } from '../../helpers/deploy'
import init, { resetNode } from '../../helpers/init'
import { swapUniswapTokens } from '../../helpers/swap/uniswap'
import { RuntimeConfig } from '../../helpers/types/common'
import { amountToWei, approve, balanceOf } from '../../helpers/utils'
import { calldataTypes } from '../../packages/@oasis:actions/src/actions/types/actions'

describe('PullToken Action', () => {
  const BLOCK_NUMBER = 14798701
  const AMOUNT = new BigNumber(1000)
  let config: RuntimeConfig
  let deploy: DeployFunction
  let pullToken: Contract
  let pullTokenActionAddress: string

  before(async () => {
    config = await init()
    deploy = await createDeploy({ config, debug: false })
  })

  beforeEach(async () => {
    await resetNode(config.provider, BLOCK_NUMBER)
    const deployed = await deploy('PullToken', [])
    pullToken = deployed[0]
    pullTokenActionAddress = deployed[1]

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
            amount: amountToWei(AMOUNT.times(TEN)).toFixed(0),
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
