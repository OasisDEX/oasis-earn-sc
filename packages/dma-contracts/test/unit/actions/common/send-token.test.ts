import { ADDRESSES } from '@deploy-configurations/addresses'
import { Network } from '@deploy-configurations/types/network'
import { MAX_UINT, ONE, TEN_MILLION, ZERO } from '@dma-common/constants'
import { expect, swapUniswapTokens } from '@dma-common/test-utils'
import { BalanceOptions, RuntimeConfig } from '@dma-common/types/common'
import { balanceOf } from '@dma-common/utils/balances'
import { amountToWei } from '@dma-common/utils/common'
import { send } from '@dma-common/utils/tx'
import { testBlockNumber } from '@dma-contracts/test/config'
import { restoreSnapshot, Snapshot } from '@dma-contracts/utils'
import { calldataTypes } from '@dma-library'
import { Contract } from '@ethersproject/contracts'
import BigNumber from 'bignumber.js'
import hre, { ethers } from 'hardhat'

describe('SendToken Action | Unit', () => {
  const DAI = ADDRESSES[Network.MAINNET].common.DAI
  const AMOUNT = new BigNumber(1000)
  const AMOUNT_TO_WEI = amountToWei(AMOUNT).toFixed(0)

  let config: RuntimeConfig
  let balanceOptions: BalanceOptions
  let snapshot: Snapshot
  let sendToken: Contract
  let sendTokenActionAddress: string

  before(async () => {
    ;({ snapshot } = await restoreSnapshot({
      hre,
      blockNumber: testBlockNumber,
    }))

    config = snapshot.config
    balanceOptions = { config, debug: false }

    sendToken = snapshot.testSystem.deployment.system.SendToken.contract
    sendTokenActionAddress = snapshot.testSystem.deployment.system.SendToken.contract.address
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
  })

  afterEach(async () => {
    await restoreSnapshot({ hre, blockNumber: testBlockNumber })
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
            asset: ADDRESSES[Network.MAINNET].common.DAI,
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

    let aWalletEthBalance = await balanceOf(
      ADDRESSES[Network.MAINNET].common.ETH,
      aWallet,
      balanceOptions,
    )
    expect(aWalletEthBalance.toString()).to.equal(amountToWei(TEN_MILLION).toString())

    await sendToken.execute(
      ethers.utils.defaultAbiCoder.encode(
        [calldataTypes.common.SendToken],
        [
          {
            amount: amountToWei(ONE).toString(),
            asset: ADDRESSES[Network.MAINNET].common.ETH,
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

    aWalletEthBalance = await balanceOf(
      ADDRESSES[Network.MAINNET].common.ETH,
      aWallet,
      balanceOptions,
    )
    expect(aWalletEthBalance.toString()).to.equal(amountToWei(TEN_MILLION.plus(ONE)).toString())
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
            asset: ADDRESSES[Network.MAINNET].common.DAI,
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
            asset: ADDRESSES[Network.MAINNET].common.DAI,
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
