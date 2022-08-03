import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'

import { ADDRESSES } from '../../helpers/addresses'
import { ONE, TEN_THOUSAND, ZERO } from '../../helpers/constants'
import { createDeploy, DeployFunction } from '../../helpers/deploy'
import init, { resetNode } from '../../helpers/init'
import { swapUniswapTokens } from '../../helpers/swap/uniswap'
import { BalanceOptions, RuntimeConfig } from '../../helpers/types/common'
import { amountToWei, balanceOf, send } from '../../helpers/utils'
import { calldataTypes } from '../../packages/oasis-actions/src/actions/types/actions'

describe('SendToken Action', () => {
  const BLOCK_NUMBER = 14798701
  const AMOUNT = new BigNumber(1000)
  const AMOUNT_TO_WEI = amountToWei(AMOUNT).toFixed(0)
  let config: RuntimeConfig
  let deploy: DeployFunction
  let sendToken: Contract
  let sendTokenActionAddress: string

  before(async () => {
    config = await init()
    deploy = await createDeploy({ config, debug: false })
  })

  beforeEach(async () => {
    await resetNode(config.provider, BLOCK_NUMBER)

    const sendTokenDeployment = await deploy('SendToken', [])
    sendToken = sendTokenDeployment[0]
    sendTokenActionAddress = sendTokenDeployment[1]

    await swapUniswapTokens(
      ADDRESSES.main.WETH,
      ADDRESSES.main.DAI,
      amountToWei(ONE).toFixed(0),
      amountToWei(AMOUNT).toFixed(0),
      config.address,
      config,
    )
  })

  it('should send tokens to the sender', async () => {
    const DAI = ADDRESSES.main.DAI
    const balanceOptions: BalanceOptions = { config, debug: false }
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
      [],
    )

    const finalWalletBalance = await balanceOf(DAI, config.address, { config, debug: false })
    contractBalance = await balanceOf(DAI, sendTokenActionAddress, balanceOptions)

    expect(contractBalance.toString()).to.equal(ZERO.toString())
    expect(finalWalletBalance.toString()).to.equal(initialWalletBalance.toString())
  })

  it('should send ETH', async () => {
    const aWallet = await config.provider.getSigner(2).getAddress()

    let aWalletEthBalance = await balanceOf(ADDRESSES.main.ETH, aWallet, { config, debug: false })
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
      [],
      {
        from: config.address,
        value: amountToWei(ONE).toString(),
        gasLimit: 30000000,
      },
    )

    aWalletEthBalance = await balanceOf(ADDRESSES.main.ETH, aWallet, { config, debug: false })
    expect(aWalletEthBalance.toString()).to.equal(amountToWei(TEN_THOUSAND.plus(ONE)).toString())
  })

  it('should fail if it does not have enough ERC20 balance', async () => {
    const DAI = ADDRESSES.main.DAI
    const balanceOptions: BalanceOptions = { config, debug: false }

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
      [],
    )

    await expect(tx).to.be.revertedWith('Dai/insufficient-balance')

    contractBalance = await balanceOf(DAI, sendTokenActionAddress, balanceOptions)
    expect(contractBalance.toString()).to.equal(AMOUNT_TO_WEI)
  })
})
