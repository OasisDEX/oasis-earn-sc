import { testBlockNumber } from '@dma-contracts/test/config'
import { initialiseConfig } from '@dma-contracts/test/fixtures'
import { Contract } from '@ethersproject/contracts'
import { ADDRESSES } from '@oasisdex/addresses/src'
import { MAX_UINT, ONE, TEN_THOUSAND, ZERO } from '@oasisdex/dma-common/constants'
import { expect, restoreSnapshot, Snapshot } from '@oasisdex/dma-common/test-utils'
import { BalanceOptions, RuntimeConfig } from '@oasisdex/dma-common/types/common'
import { amountToWei, balanceOf, send } from '@oasisdex/dma-common/utils/common'
import { swapUniswapTokens } from '@oasisdex/dma-common/utils/swap/uniswap'
import { calldataTypes } from '@oasisdex/dma-library/src'
import BigNumber from 'bignumber.js'
import { loadFixture } from 'ethereum-waffle'
import { ethers } from 'hardhat'

describe('SendToken Action | Unit', () => {
  const DAI = ADDRESSES.main.DAI
  const AMOUNT = new BigNumber(1000)
  const AMOUNT_TO_WEI = amountToWei(AMOUNT).toFixed(0)

  let balanceOptions: BalanceOptions
  let config: RuntimeConfig
  let snapshot: Snapshot
  let sendToken: Contract
  let sendTokenActionAddress: string

  before(async () => {
    ;({ config } = await loadFixture(initialiseConfig))
    balanceOptions = { config, debug: false }
    ;({ snapshot } = await restoreSnapshot({
      config,
      provider: config.provider,
      blockNumber: testBlockNumber,
    }))

    sendToken = snapshot.deployed.system.common.sendToken
    sendTokenActionAddress = snapshot.deployed.system.common.sendToken.address
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
  })

  afterEach(async () => {
    await restoreSnapshot({ config, provider: config.provider, blockNumber: testBlockNumber })
  })

  it('should send tokens to the sender', async () => {
    const initialWalletBalance = await balanceOf(DAI, config.address, balanceOptions)

    await send(sendTokenActionAddress, DAI, AMOUNT_TO_WEI)

    let contractBalance = await balanceOf(DAI, sendTokenActionAddress, balanceOptions)

    expect(contractBalance.toString()).to.equal(AMOUNT_TO_WEI)

    await sendToken.execute(
      ethers.utils.defaultAbiCoder.encode(
        [calldataTypes.common.SendToken],
        [
          {
            amount: amountToWei(AMOUNT).toFixed(0),
            asset: ADDRESSES.main.DAI,
            to: config.address,
          },
        ],
      ),
      [0, 0, 0],
    )

    const finalWalletBalance = await balanceOf(DAI, config.address, balanceOptions)
    contractBalance = await balanceOf(DAI, sendTokenActionAddress, balanceOptions)

    expect(contractBalance.toString()).to.equal(ZERO.toString())
    expect(finalWalletBalance.toString()).to.equal(initialWalletBalance.toString())
  })

  it('should send ETH', async () => {
    const aWallet = await config.provider.getSigner(2).getAddress()

    let aWalletEthBalance = await balanceOf(ADDRESSES.main.ETH, aWallet, balanceOptions)
    expect(aWalletEthBalance.toString()).to.equal(amountToWei(TEN_THOUSAND).toString())

    await sendToken.execute(
      ethers.utils.defaultAbiCoder.encode(
        [calldataTypes.common.SendToken],
        [
          {
            amount: amountToWei(ONE).toString(),
            asset: ADDRESSES.main.ETH,
            to: aWallet,
          },
        ],
      ),
      [0, 0, 0],
      {
        from: config.address,
        value: amountToWei(ONE).toString(),
        gasLimit: 30000000,
      },
    )

    aWalletEthBalance = await balanceOf(ADDRESSES.main.ETH, aWallet, balanceOptions)
    expect(aWalletEthBalance.toString()).to.equal(amountToWei(TEN_THOUSAND.plus(ONE)).toString())
  })

  it('should fail if it does not have enough ERC20 balance', async () => {
    await send(sendTokenActionAddress, DAI, AMOUNT_TO_WEI)

    let contractBalance = await balanceOf(DAI, sendTokenActionAddress, balanceOptions)
    expect(contractBalance.toString()).to.equal(AMOUNT_TO_WEI)

    const tx = sendToken.execute(
      ethers.utils.defaultAbiCoder.encode(
        [calldataTypes.common.SendToken],
        [
          {
            amount: amountToWei(AMOUNT.plus(ONE)).toFixed(0),
            asset: ADDRESSES.main.DAI,
            to: config.address,
          },
        ],
      ),
      [0, 0, 0],
    )

    await expect(tx).to.be.revertedWith('Dai/insufficient-balance')

    contractBalance = await balanceOf(DAI, sendTokenActionAddress, balanceOptions)
    expect(contractBalance.toString()).to.equal(AMOUNT_TO_WEI)
  })

  it('should transfer all token amount if the amount is the UINT MAX value', async () => {
    const aWallet = await config.provider.getSigner(2).getAddress()
    await send(sendTokenActionAddress, DAI, AMOUNT_TO_WEI)

    const initialWalletBalance = await balanceOf(DAI, aWallet, balanceOptions)
    expect(initialWalletBalance.toString()).to.equal(ZERO.toString())

    await sendToken.execute(
      ethers.utils.defaultAbiCoder.encode(
        [calldataTypes.common.SendToken],
        [
          {
            amount: MAX_UINT,
            asset: ADDRESSES.main.DAI,
            to: aWallet,
          },
        ],
      ),
      [0, 0, 0],
    )

    const finalWalletBalance = await balanceOf(DAI, aWallet, balanceOptions)
    const contractBalance = await balanceOf(DAI, sendTokenActionAddress, balanceOptions)

    expect(contractBalance.toString()).to.equal(ZERO.toString())
    expect(finalWalletBalance.toString()).to.equal(
      initialWalletBalance.plus(AMOUNT_TO_WEI).toString(),
    )
  })
})
