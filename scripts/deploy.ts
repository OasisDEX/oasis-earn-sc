// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { BigNumber } from 'bignumber.js'
import { ethers } from 'hardhat'

import { ADDRESSES } from '../helpers/addresses'
import { CONTRACT_LABELS, ZERO } from '../helpers/constants'
import { deploy, executeThroughProxy } from '../helpers/deploy'
import init from '../helpers/init'
// Helper functions
import { getOrCreateProxy } from '../helpers/proxy'
import { swapOneInchTokens } from '../helpers/swap/1inch'
import { swapUniswapTokens } from '../helpers/swap/uniswap'
import { calldataTypes } from '../helpers/types/actions'
import { ActionFactory, amountToWei, approve, balanceOf, ServiceRegistry } from '../helpers/utils'

const createAction = ActionFactory.create

// AMOUNTS
const flashloanAmount = amountToWei(new BigNumber(1000000))
const depositAmount = amountToWei(new BigNumber(200000))
const borrowAmount = amountToWei(new BigNumber(5))

async function main() {
  const config = await init()
  const { signer, address } = config
  const proxyAddress = await getOrCreateProxy(signer)

  console.log(`DEBUG: Wallet Address: ${address}`)
  console.log(`DEBUG: Proxy Address: ${proxyAddress}`)

  const options = {
    debug: true,
    config,
  }

  await balanceOf(ADDRESSES.main.ETH, address, options)

  console.log('DEBUG SWAPPING...')
  const daiBalance = await balanceOf(ADDRESSES.main.DAI, address, options)
  if (new BigNumber(daiBalance).lte(ZERO)) {
    await swapUniswapTokens(
      ADDRESSES.main.WETH,
      ADDRESSES.main.DAI,
      ethers.utils.parseEther('200').toString(),
      ethers.utils.parseEther('0.1').toString(),
      address,
      config,
    )
  }
  console.log('DEBUG DEPLOYING ....')

  // ServiceRegistry SETUP:
  const [, serviceRegistryAddress] = await deploy('ServiceRegistry', [0], options)
  const registry: ServiceRegistry = new ServiceRegistry(serviceRegistryAddress, signer)
  registry.addEntry(CONTRACT_LABELS.maker.FLASH_MINT_MODULE, ADDRESSES.main.fmm)

  // DEPLOYING Operation Executor
  const [operationExecutor, operationExecutorAddress] = await deploy(
    'OperationExecutor',
    [serviceRegistryAddress],
    options,
  )
  registry.addEntry(CONTRACT_LABELS.common.OPERATION_EXECUTOR, operationExecutorAddress)

  // DEPLOYING ACTIONS
  const [, pullTokenActionAddress] = await deploy('PullToken', [], options)
  const [, sendTokenAddress] = await deploy('SendToken', [], options)
  const [, setApprovalAddress] = await deploy('SetApproval', [], options)
  const [, flActionAddress] = await deploy('TakeFlashloan', [serviceRegistryAddress], options)
  const [, depositInAAVEAddress] = await deploy('DepositInAAVE', [serviceRegistryAddress], options)
  const [, borrowFromAAVEAddress] = await deploy(
    'BorrowFromAAVE',
    [serviceRegistryAddress],
    options,
  )
  const [, swapOnOninchAddress] = await deploy('SwapOnOneInch', [serviceRegistryAddress], options)
  const [, withdrawFromAAVEAddress] = await deploy(
    'WithdrawFromAAVE',
    [serviceRegistryAddress],
    options,
  )
  const [, operationStorageAddress] = await deploy('OperationStorage', [], options)
  const [, dummyActionAddress] = await deploy('DummyAction', [serviceRegistryAddress], options)

  //SETUP REGISTRY ENTRIES:
  console.log('DEBUG SETTING UP REGISTRY ENTRIES...')
  await registry.addEntry(CONTRACT_LABELS.common.OPERATION_STORAGE, operationStorageAddress)
  const dummyActionHash = await registry.addEntry('DUMMY_ACTION', dummyActionAddress)
  const pullTokenHash = await registry.addEntry(
    CONTRACT_LABELS.common.PULL_TOKEN,
    pullTokenActionAddress,
  )
  const sendTokenHash = await registry.addEntry(CONTRACT_LABELS.common.SEND_TOKEN, sendTokenAddress)
  const setApprovalHash = await registry.addEntry(
    CONTRACT_LABELS.common.SET_APPROVAL,
    setApprovalAddress,
  )
  const takeAFlashloanHash = await registry.addEntry(
    CONTRACT_LABELS.common.TAKE_A_FLASHLOAN,
    flActionAddress,
  )
  const depositInAAVEHash = await registry.addEntry(
    CONTRACT_LABELS.aave.DEPOSIT_IN_AAVE,
    depositInAAVEAddress,
  )
  const borrowFromAAVEHash = await registry.addEntry(
    CONTRACT_LABELS.aave.BORROW_FROM_AAVE,
    borrowFromAAVEAddress,
  )
  const withdrawFromAAVEHash = await registry.addEntry(
    CONTRACT_LABELS.aave.WITHDRAW_FROM_AAVE,
    withdrawFromAAVEAddress,
  )
  const swapOnOneInchHash = await registry.addEntry(
    CONTRACT_LABELS.common.SWAP_ON_ONE_INCH,
    swapOnOninchAddress,
  )
  await registry.addEntry(
    CONTRACT_LABELS.aave.AAVE_LENDING_POOL,
    ADDRESSES.main.AAVEMainnetLendingPool,
  )
  await registry.addEntry(CONTRACT_LABELS.aave.AAVE_WETH_GATEWAY, ADDRESSES.main.AAVEWETHGateway)
  await registry.addEntry(CONTRACT_LABELS.common.WETH, ADDRESSES.main.WETH)
  await registry.addEntry(CONTRACT_LABELS.common.DAI, ADDRESSES.main.DAI)
  await registry.addEntry(
    CONTRACT_LABELS.common.ONE_INCH_AGGREGATOR,
    ADDRESSES.main.oneInchAggregator,
  )

  // DUMMY ACTION
  const dummyAction = createAction(dummyActionHash, [], [])
  // PULL TOKEN ACTION
  const pullToken = createAction(
    pullTokenHash,
    [calldataTypes.common.PullToken],
    [
      {
        amount: depositAmount.toFixed(0),
        asset: ADDRESSES.main.DAI,
        from: address,
      },
    ],
  )
  //  --- ACTIONS IN THE FLASHLOAN SCOPE ---
  //  PULL TOKEN ACTION
  const pullBorrowedFundsIntoProxy = createAction(
    pullTokenHash,
    [calldataTypes.common.PullToken],
    [
      {
        amount: flashloanAmount.toFixed(0),
        asset: ADDRESSES.main.DAI,
        from: operationExecutorAddress,
      },
    ],
  )

  // APPROVE LENDING POOL
  const setDaiApprovalOnLendingPool = createAction(
    setApprovalHash,
    [calldataTypes.common.Approval],
    [
      {
        amount: flashloanAmount.plus(depositAmount).toFixed(0),
        asset: ADDRESSES.main.DAI,
        delegator: ADDRESSES.main.AAVEMainnetLendingPool,
      },
    ],
  )

  // DEPOSIT IN AAVE
  const depositDaiInAAVE = createAction(
    depositInAAVEHash,
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
    borrowFromAAVEHash,
    [calldataTypes.aave.Generate],
    [
      {
        amount: borrowAmount.toFixed(0),
        asset: ADDRESSES.main.ETH,
      },
    ],
  )

  // SWAP TOKENS
  const response = await swapOneInchTokens(
    ADDRESSES.main.WETH,
    ADDRESSES.main.stETH,
    borrowAmount.toFixed(0),
    proxyAddress,
    '10',
  )

  const swapETHforSTETH = createAction(
    swapOnOneInchHash,
    [calldataTypes.common.Swap],
    [
      {
        fromAsset: ADDRESSES.main.WETH,
        toAsset: ADDRESSES.main.stETH,
        amount: borrowAmount.toFixed(0),
        receiveAtLeast: amountToWei(1).toFixed(), // just a number :D
        withData: response.tx.data,
      },
    ],
  )

  // WITHDRAW TOKENS
  const withdrawDAIFromAAVE = createAction(
    withdrawFromAAVEHash,
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
    sendTokenHash,
    [calldataTypes.common.SendToken],
    [
      {
        asset: ADDRESSES.main.DAI,
        to: operationExecutorAddress,
        amount: flashloanAmount.toFixed(0),
      },
    ],
  )
  //  --------------------------------------

  // TAKE A FLASHLOAN ACTION
  const takeAFlashloan = createAction(
    takeAFlashloanHash,
    [calldataTypes.common.TakeAFlashLoan],
    [
      {
        amount: flashloanAmount.toFixed(0),
        borrower: operationExecutorAddress,
        calls: [
          pullBorrowedFundsIntoProxy,
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

  await approve(ADDRESSES.main.DAI, proxyAddress, depositAmount, config, true)

  await executeThroughProxy(
    proxyAddress,
    {
      address: operationExecutorAddress,
      calldata: operationExecutor.interface.encodeFunctionData('executeOp', [
        [pullToken, takeAFlashloan, dummyAction],
      ]),
    },
    signer,
  )

  console.log('DEBUG: Deposited ( DAI )')
  await balanceOf(ADDRESSES.main.aDAI, proxyAddress, options)
  console.log('DEBUG: Debt ( ETH )')
  await balanceOf(ADDRESSES.main.ETH, proxyAddress, options)
  console.log('DEBUG: Debt ( WETH )')
  await balanceOf(ADDRESSES.main.WETH, proxyAddress, options)
  console.log('DEBUG: OWNED ( stETH )')
  await balanceOf(ADDRESSES.main.stETH, proxyAddress, options)
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
