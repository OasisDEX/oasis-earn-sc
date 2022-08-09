import { JsonRpcProvider } from '@ethersproject/providers'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { Contract, Signer } from 'ethers'
import { ethers } from 'hardhat'

import CDPManagerABI from '../../abi/dss-cdp-manager.json'
import ERC20ABI from '../../abi/IERC20.json'
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

    const blockNumber = 13274574
    resetNode(provider, blockNumber)

    const { system: _system, registry: _registry } = await deploySystem(config)
    system = _system
    registry = _registry
  })

  const flashloanAmount = amountToWei(new BigNumber(1000000))
  const depositAmount = amountToWei(new BigNumber(200000))
  const borrowAmount = amountToWei(new BigNumber(5))

  const testName = `should open stEth position`

  it(testName, async () => {

    
    // Transfer stETH to exchange for Swap

    const toImpersonate = "0xdc24316b9ae028f1497c275eb9192a3ea0f67022"; 
    await provider.send('hardhat_impersonateAccount', [toImpersonate])
    const account = ethers.provider.getSigner(toImpersonate)
    const accountAddress =  await account.getAddress()
    stETH = new ethers.Contract(ADDRESSES.main.stETH, ERC20ABI, provider).connect(account)
    const bal = await stETH.balanceOf(accountAddress);
    await stETH.transfer(system.common.exchange.address, bal);
    await provider.send('hardhat_stopImpersonatingAccount', [toImpersonate]);


    // PULL TOKEN ACTION
    const pullToken = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.common.PULL_TOKEN),
      [calldataTypes.common.PullToken],
      [
        {
          amount: depositAmount.toFixed(0),
          asset: ADDRESSES.main.DAI,
          from: address,
        },
      ],
    )

    //  PULL TOKEN ACTION
    const pullBorrowedFundsIntoProxy = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.common.PULL_TOKEN),
      [calldataTypes.common.PullToken],
      [
        {
          amount: flashloanAmount.toFixed(0),
          asset: ADDRESSES.main.DAI,
          from: system.common.operationExecutor.address,
        },
      ],
    )

    // APPROVE LENDING POOL
    const setDaiApprovalOnLendingPool = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.common.SET_APPROVAL),
      [calldataTypes.common.Approval],
      [
        {
          amount: flashloanAmount.plus(depositAmount).toFixed(0),
          asset: ADDRESSES.main.DAI,
          delegator: ADDRESSES.main.aave.MainnetLendingPool,
        },
      ],
    )

    // DEPOSIT IN AAVE
    const depositDaiInAAVE = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.aave.DEPOSIT),
      [calldataTypes.aave.Deposit],
      [
        {
          amount: flashloanAmount.plus(depositAmount).toFixed(0),
          asset: ADDRESSES.main.DAI,
        },
      ],
    )

    // BORROW FROM AAVE
    const borrowEthFromAAVE = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.aave.BORROW),
      [calldataTypes.aave.Borrow],
      [
        {
          amount: borrowAmount.toFixed(0),
          asset: ADDRESSES.main.ETH,
        },
      ],
    )

    const swapETHforSTETH = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.test.DUMMY_SWAP),
      [calldataTypes.common.Swap],
      [
        {
          fromAsset: ADDRESSES.main.WETH,
          toAsset: ADDRESSES.main.stETH,
          amount: borrowAmount.toFixed(0),
          receiveAtLeast: amountToWei(1).toFixed(),
          withData: 0,
        },
      ],
    )

    // WITHDRAW TOKENS
    const withdrawDAIFromAAVE = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.aave.WITHDRAW),
      [calldataTypes.aave.Withdraw],
      [
        {
          asset: ADDRESSES.main.DAI,
          amount: flashloanAmount.toFixed(0),
        },
      ],
    )

    // SEND BACK TOKEN FROM PROXY TO EXECUTOR ( FL Borrower )
    const sendBackDAI = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.common.SEND_TOKEN),
      [calldataTypes.common.SendToken],
      [
        {
          asset: ADDRESSES.main.DAI,
          to: system.common.operationExecutor.address,
          amount: flashloanAmount.toFixed(0),
        },
      ],
    )

    // TAKE A FLASHLOAN ACTION
    const takeAFlashloan = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.common.TAKE_A_FLASHLOAN),
      [calldataTypes.common.TakeAFlashLoan],
      [
        {
          amount: flashloanAmount.toFixed(0),
          dsProxyFlashloan: true,
          calls: [
            setDaiApprovalOnLendingPool,
            depositDaiInAAVE,
            borrowEthFromAAVE,
            swapETHforSTETH,
            withdrawDAIFromAAVE,
            sendBackDAI,
          ],
        },
      ],
    )
    
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
    expectToBeEqual(await balanceOf(ADDRESSES.main.aDAI, system.common.dsProxy.address, options), depositAmount.toFixed())
    expectToBeEqual(await balanceOf(ADDRESSES.main.variableDebtWETH, system.common.dsProxy.address, options), borrowAmount.toFixed())
  })
})
