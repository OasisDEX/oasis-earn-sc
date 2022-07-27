import { JsonRpcProvider } from '@ethersproject/providers'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { Contract, Signer } from 'ethers'
import { ethers } from 'hardhat'

import CDPManagerABI from '../../abi/dss-cdp-manager.json'
import ERC20ABI from '../../abi/IERC20.json'
import { makeActions } from '../../helpers/actions'
import { ADDRESSES } from '../../helpers/addresses'
import { CONTRACT_NAMES, OPERATION_NAMES } from '../../helpers/constants'
import { executeThroughProxy } from '../../helpers/deploy'
import { gasEstimateHelper } from '../../helpers/gasEstimation'
import init, { resetNode } from '../../helpers/init'
import { getLastVault, getVaultInfo } from '../../helpers/maker/vault'
import { swapOneInchTokens } from '../../helpers/swap/1inch'
import { swapUniswapTokens } from '../../helpers/swap/uniswap'
import { calldataTypes } from '../../helpers/types/actions'
import { RuntimeConfig } from '../../helpers/types/common'
import { ActionFactory, amountToWei, approve, balanceOf } from '../../helpers/utils'
import { ServiceRegistry } from '../../helpers/wrappers/serviceRegistry'
import { DeployedSystemInfo, deploySystem } from '../deploySystem'
import { expectToBeEqual } from '../utils'

const createAction = ActionFactory.create

let DAI: Contract
let WETH: Contract
let stETH: Contract

describe(`Operations | AAVE | ${OPERATION_NAMES.aave.OPEN_POSITION}`, async () => {
  let provider: JsonRpcProvider
  let signer: Signer
  let address: string
  let system: DeployedSystemInfo
  let registry: ServiceRegistry
  let config: RuntimeConfig
  let options: any

  before(async () => {
    config = await init()
    provider = config.provider
    signer = config.signer
    address = config.address

    options = {
      debug: true,
      config,
    }

    const blockNumber = 15191046
    resetNode(provider, blockNumber)

    const { system: _system, registry: _registry } = await deploySystem(config)
    system = _system
    registry = _registry
  })

  const flashloanAmount = amountToWei(new BigNumber(1000000))
  const depositAmount = amountToWei(new BigNumber(200000))
  const borrowAmount = amountToWei(new BigNumber(5))

  const testName = `should open stEth position`

  it.only(testName, async () => {
    // Transfer stETH to exchange for Swap

    const toImpersonate = '0xdc24316b9ae028f1497c275eb9192a3ea0f67022'
    await provider.send('hardhat_impersonateAccount', [toImpersonate])
    const account = ethers.provider.getSigner(toImpersonate)
    const accountAddress = await account.getAddress()
    stETH = new ethers.Contract(ADDRESSES.main.stETH, ERC20ABI, provider).connect(account)
    const bal = await stETH.balanceOf(accountAddress)
    await stETH.transfer(system.common.exchange.address, bal)
    await provider.send('hardhat_stopImpersonatingAccount', [toImpersonate])

    const actions = makeActions(registry)

    // PULL TOKEN ACTION
    const pullToken = await actions.pullToken({
      amount: depositAmount,
      asset: ADDRESSES.main.DAI,
      from: address,
    })

    // APPROVE LENDING POOL
    const setDaiApprovalOnLendingPool = await actions.setApproval({
      amount: flashloanAmount.plus(depositAmount),
      asset: ADDRESSES.main.DAI,
      delegator: ADDRESSES.main.aave.MainnetLendingPool,
    })

    // DEPOSIT IN AAVE
    const depositDaiInAAVE = await actions.aaveDeposit({
      amount: flashloanAmount.plus(depositAmount),
      asset: ADDRESSES.main.DAI,
    })

    // BORROW FROM AAVE
    const borrowEthFromAAVE = await actions.aaveBorrow({
      amount: borrowAmount,
      asset: ADDRESSES.main.ETH,
    })

    const swapETHforSTETH = await actions.swap({
      fromAsset: ADDRESSES.main.WETH,
      toAsset: ADDRESSES.main.stETH,
      amount: borrowAmount,
      receiveAtLeast: amountToWei(1),
      fee: 0,
      withData: 0,
      collectFeeInFromToken: true,
    })

    // WITHDRAW TOKENS
    const withdrawDAIFromAAVE = await actions.aaveWithdraw({
      asset: ADDRESSES.main.DAI,
      amount: flashloanAmount,
    })

    // SEND BACK TOKEN FROM PROXY TO EXECUTOR ( FL Borrower )
    const sendBackDAI = await actions.sendToken({
      asset: ADDRESSES.main.DAI,
      to: system.common.operationExecutor.address,
      amount: flashloanAmount,
    })

    // TAKE A FLASHLOAN ACTION
    const takeAFlashloan = await actions.takeAFlashLoan({
      flashloanAmount,
      borrower: system.common.operationExecutor.address,
      dsProxyFlashloan: true,
      calls: [
        setDaiApprovalOnLendingPool,
        depositDaiInAAVE,
        borrowEthFromAAVE,
        swapETHforSTETH,
        withdrawDAIFromAAVE,
        sendBackDAI,
      ],
    })

    await approve(ADDRESSES.main.DAI, system.common.dsProxy.address, depositAmount, config, true)

    await executeThroughProxy(
      system.common.dsProxy.address,
      {
        address: system.common.operationExecutor.address,
        calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
          [pullToken, takeAFlashloan],
          OPERATION_NAMES.common.CUSTOM_OPERATION,
        ]),
      },
      signer,
    )

    expectToBeEqual(await balanceOf(ADDRESSES.main.ETH, system.common.dsProxy.address, options), 0)
    expectToBeEqual(
      await balanceOf(ADDRESSES.main.aDAI, system.common.dsProxy.address, options),
      depositAmount.toFixed(),
    )
    expectToBeEqual(
      await balanceOf(ADDRESSES.main.variableDebtWETH, system.common.dsProxy.address, options),
      borrowAmount.toFixed(),
    )
  })
})
