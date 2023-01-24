// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import {
  ActionFactory,
  ADDRESSES,
  calldataTypes,
  CONTRACT_NAMES,
  OPERATION_NAMES,
  ZERO,
} from '@oasisdex/oasis-actions'
import { BigNumber } from 'bignumber.js'
import { ethers } from 'hardhat'

import { createDeploy, executeThroughProxy } from '../helpers/deploy'
import init from '../helpers/init'
// Helper functions
import { getOrCreateProxy } from '../helpers/proxy'
import { ServiceRegistry } from '../helpers/serviceRegistry'
import { swapOneInchTokens } from '../helpers/swap/1inch'
import { swapUniswapTokens } from '../helpers/swap/uniswap'
import { amountToWei, approve, balanceOf } from '../helpers/utils'
import { OperationsRegistry } from '../helpers/wrappers/operationsRegistry'

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

  const deploy = await createDeploy(options)

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
  const [, serviceRegistryAddress] = await deploy(CONTRACT_NAMES.common.SERVICE_REGISTRY, [0])
  const registry: ServiceRegistry = new ServiceRegistry(serviceRegistryAddress, signer)
  registry.addEntry(CONTRACT_NAMES.maker.FLASH_MINT_MODULE, ADDRESSES.main.maker.fmm)

  // DEPLOYING Operations Registry
  const [, operationsRegistryAddress] = await deploy('OperationsRegistry', [])
  const operationsRegistry: OperationsRegistry = new OperationsRegistry(
    operationsRegistryAddress,
    signer,
  )

  // DEPLOYING Operation Executor
  const [operationExecutor, operationExecutorAddress] = await deploy(
    CONTRACT_NAMES.common.OPERATION_EXECUTOR,
    [serviceRegistryAddress],
  )
  registry.addEntry(CONTRACT_NAMES.common.OPERATION_EXECUTOR, operationExecutorAddress)

  // DEPLOYING ACTIONS
  const [, pullTokenActionAddress] = await deploy(CONTRACT_NAMES.common.PULL_TOKEN, [])
  const [, sendTokenAddress] = await deploy(CONTRACT_NAMES.common.SEND_TOKEN, [])
  const [, setApprovalAddress] = await deploy(CONTRACT_NAMES.common.SET_APPROVAL, [
    serviceRegistryAddress,
  ])
  const [, flActionAddress] = await deploy(CONTRACT_NAMES.common.TAKE_A_FLASHLOAN, [
    serviceRegistryAddress,
    ADDRESSES.main.DAI,
  ])
  const [, depositInAAVEAddress] = await deploy(CONTRACT_NAMES.aave.DEPOSIT, [
    serviceRegistryAddress,
  ])
  const [, borrowFromAAVEAddress] = await deploy(CONTRACT_NAMES.aave.BORROW, [
    serviceRegistryAddress,
  ])

  const [, withdrawFromAAVEAddress] = await deploy(CONTRACT_NAMES.aave.WITHDRAW, [
    serviceRegistryAddress,
  ])
  const [, operationStorageAddress] = await deploy(CONTRACT_NAMES.common.OPERATION_STORAGE, [
    serviceRegistryAddress,
    operationExecutor.address,
  ])

  const [, swapAddress] = await deploy(CONTRACT_NAMES.common.SWAP, [
    address,
    ADDRESSES.main.feeRecipient,
    0,
    serviceRegistryAddress,
  ])

  const [, uSwapAddress] = await deploy(CONTRACT_NAMES.test.SWAP, [
    address,
    ADDRESSES.main.feeRecipient,
    0,
    serviceRegistryAddress,
  ])
  const useDummySwap = true

  const [, swapActionAddress] = await deploy(CONTRACT_NAMES.common.SWAP_ACTION, [
    serviceRegistryAddress,
  ])

  const [, wrapActionAddress] = await deploy(CONTRACT_NAMES.common.WRAP_ETH, [
    serviceRegistryAddress,
  ])
  const [, unwrapActionAddress] = await deploy(CONTRACT_NAMES.common.UNWRAP_ETH, [
    serviceRegistryAddress,
  ])

  const [, returnFundsActionAddress] = await deploy(CONTRACT_NAMES.common.RETURN_FUNDS, [])

  //SETUP REGISTRY ENTRIES:
  console.log('DEBUG SETTING UP REGISTRY ENTRIES...')
  await registry.addEntry(CONTRACT_NAMES.common.OPERATION_STORAGE, operationStorageAddress)
  await registry.addEntry(CONTRACT_NAMES.common.OPERATIONS_REGISTRY, operationsRegistryAddress)

  const pullTokenHash = await registry.addEntry(
    CONTRACT_NAMES.common.PULL_TOKEN,
    pullTokenActionAddress,
  )
  const sendTokenHash = await registry.addEntry(CONTRACT_NAMES.common.SEND_TOKEN, sendTokenAddress)
  const setApprovalHash = await registry.addEntry(
    CONTRACT_NAMES.common.SET_APPROVAL,
    setApprovalAddress,
  )
  const takeAFlashloanHash = await registry.addEntry(
    CONTRACT_NAMES.common.TAKE_A_FLASHLOAN,
    flActionAddress,
  )
  const depositInAAVEHash = await registry.addEntry(
    CONTRACT_NAMES.aave.DEPOSIT,
    depositInAAVEAddress,
  )
  const aaveBorrowHash = await registry.addEntry(CONTRACT_NAMES.aave.BORROW, borrowFromAAVEAddress)
  const withdrawFromAAVEHash = await registry.addEntry(
    CONTRACT_NAMES.aave.WITHDRAW,
    withdrawFromAAVEAddress,
  )

  await registry.addEntry(CONTRACT_NAMES.common.SWAP, useDummySwap ? uSwapAddress : swapAddress)

  const swapActionHash = await registry.addEntry(
    CONTRACT_NAMES.common.SWAP_ACTION,
    swapActionAddress,
  )
  await registry.addEntry(CONTRACT_NAMES.maker.MCD_JUG, ADDRESSES.main.maker.jug)
  await registry.addEntry(CONTRACT_NAMES.aave.LENDING_POOL, ADDRESSES.main.aave.MainnetLendingPool)
  await registry.addEntry(CONTRACT_NAMES.aave.WETH_GATEWAY, ADDRESSES.main.aave.WETHGateway)
  await registry.addEntry(CONTRACT_NAMES.common.WETH, ADDRESSES.main.WETH)
  await registry.addEntry(CONTRACT_NAMES.common.DAI, ADDRESSES.main.DAI)
  await registry.addEntry(
    CONTRACT_NAMES.common.ONE_INCH_AGGREGATOR,
    ADDRESSES.main.oneInchAggregator,
  )

  await registry.addEntry(CONTRACT_NAMES.common.WRAP_ETH, wrapActionAddress)
  await registry.addEntry(CONTRACT_NAMES.common.UNWRAP_ETH, unwrapActionAddress)

  await registry.addEntry(CONTRACT_NAMES.common.RETURN_FUNDS, returnFundsActionAddress)

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
        delegator: ADDRESSES.main.aave.MainnetLendingPool,
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
    aaveBorrowHash,
    [calldataTypes.aave.Borrow],
    [
      {
        amount: borrowAmount.toFixed(0),
        asset: ADDRESSES.main.ETH,
        to: proxyAddress,
      },
    ],
  )

  // SWAP TOKENS
  const response = await swapOneInchTokens(
    ADDRESSES.main.WETH,
    ADDRESSES.main.STETH,
    borrowAmount.toFixed(0),
    proxyAddress,
    '10',
  )

  const swapETHforSTETH = createAction(
    swapActionHash,
    [calldataTypes.common.Swap],
    [
      {
        fromAsset: ADDRESSES.main.WETH,
        toAsset: ADDRESSES.main.STETH,
        amount: borrowAmount.toFixed(0),
        receiveAtLeast: amountToWei(1).toFixed(), // just a number :D
        fee: 0,
        withData: response.tx.data,
        collectFeeInFromToken: true,
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
        to: proxyAddress,
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
  await operationsRegistry.addOp(
    OPERATION_NAMES.aave.OPEN_POSITION,
    [
      pullTokenHash,
      takeAFlashloanHash,
      setApprovalHash,
      depositInAAVEHash,
      aaveBorrowHash,
      swapActionHash,
      withdrawFromAAVEHash,
      sendTokenHash,
    ],
    Array(8).fill(false),
  )

  await approve(ADDRESSES.main.DAI, proxyAddress, depositAmount, config, true)

  await executeThroughProxy(
    proxyAddress,
    {
      address: operationExecutorAddress,
      calldata: operationExecutor.interface.encodeFunctionData('executeOp', [
        [pullToken, takeAFlashloan],
        OPERATION_NAMES.aave.OPEN_POSITION,
      ]),
    },
    signer,
  )

  console.log('DEBUG: Deposited ( DAI )')
  await balanceOf(ADDRESSES.main.aDAI, proxyAddress, options)
  console.log('DEBUG: Debt ( ETH )')
  await balanceOf(ADDRESSES.main.ETH, proxyAddress, options)
  console.log('DEBUG: Debt ( WETH )')
  await balanceOf(ADDRESSES.main.variableDebtWETH, proxyAddress, options)
  console.log('DEBUG: OWNED ( stETH )')
  await balanceOf(ADDRESSES.main.STETH, proxyAddress, options)
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
