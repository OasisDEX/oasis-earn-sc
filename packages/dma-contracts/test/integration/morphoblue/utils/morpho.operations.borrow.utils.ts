import { Network } from '@deploy-configurations/types/network'
import { TestDeploymentSystem } from '@dma-contracts/utils'
import { borrow, MorphoBlueBorrowArgs } from '@dma-library/operations/morphoblue/borrow/borrow'
import { deposit, MorphoBlueDepositArgs } from '@dma-library/operations/morphoblue/borrow/deposit'
import { depositBorrow } from '@dma-library/operations/morphoblue/borrow/deposit-borrow'
import { openDepositBorrow } from '@dma-library/operations/morphoblue/borrow/open-deposit-and-borrow'
import { paybackWithdraw } from '@dma-library/operations/morphoblue/borrow/payback-withdraw'
import { PositionType } from '@dma-library/types'
import { MorphoMarketInfo } from '@morpho-blue'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { BigNumber, ContractReceipt } from 'ethers'

import {
  calculateShares,
  getMaxBorrowableAmount,
  getMaxSupplyCollateral,
} from './morpho.direct.utils'
import { executeOperation, getContextFromTestSystem } from './morpho.operations.common.utils'
import {
  toMorphoBlueBorrowArgs,
  toMorphoBlueDepositArgs,
  toMorphoBluePaybackWithdrawArgs,
  toMorphoBlueStrategyAddresses,
} from './type-casts'

// Prepare arguments functions
async function calculateDepositArgs(
  testSystem: TestDeploymentSystem,
  market: MorphoMarketInfo,
  user: SignerWithAddress,
  amountToSupply?: BigNumber,
): Promise<{
  collateralAmount: BigNumber
  depositArgs: MorphoBlueDepositArgs
}> {
  const { morphoSystem } = getContextFromTestSystem(testSystem)

  // Deposit calculations
  const collateralAmount = amountToSupply
    ? amountToSupply
    : await getMaxSupplyCollateral(morphoSystem, market)

  const depositArgs = toMorphoBlueDepositArgs(morphoSystem, market, collateralAmount, user)

  return { collateralAmount, depositArgs }
}

async function calculateBorrowArgs(
  testSystem: TestDeploymentSystem,
  market: MorphoMarketInfo,
  user: SignerWithAddress,
  collateralAmount: BigNumber,
  amountToBorrow?: BigNumber,
): Promise<{
  borrowAmount: BigNumber
  borrowArgs: MorphoBlueBorrowArgs
}> {
  const { morphoSystem } = getContextFromTestSystem(testSystem)

  // Borrow calculations
  const borrowAmount = amountToBorrow
    ? amountToBorrow
    : await getMaxBorrowableAmount(morphoSystem, market, collateralAmount)

  const borrowArgs = toMorphoBlueBorrowArgs(morphoSystem, market, borrowAmount, false)

  return { borrowAmount, borrowArgs }
}

// Modify Position Functions
export async function opMorphoBlueDeposit(
  testSystem: TestDeploymentSystem,
  market: MorphoMarketInfo,
  user: SignerWithAddress,
  amountToSupply?: BigNumber,
): Promise<{
  success: boolean
  receipt: ContractReceipt
  collateralBalanceBefore: BigNumber
  collateralBalanceAfter: BigNumber
  collateralAmount: BigNumber
}> {
  const { system, morphoSystem, tokensDeployment, userDPMProxy } =
    getContextFromTestSystem(testSystem)

  const { collateralAmount, depositArgs } = await calculateDepositArgs(
    testSystem,
    market,
    user,
    amountToSupply,
  )

  const collateralToken = tokensDeployment[market.collateralToken].contract
  await collateralToken.connect(user).approve(userDPMProxy.address, collateralAmount)
  const collateralBalanceBefore = await collateralToken.balanceOf(user.address)

  const addresses = toMorphoBlueStrategyAddresses(morphoSystem, testSystem.deployment.system)
  const depositCalls = await deposit(depositArgs, addresses, Network.TEST)

  const { success, receipt } = await executeOperation(
    system,
    user,
    userDPMProxy,
    depositCalls.calls,
    depositCalls.operationName,
  )

  const collateralBalanceAfter = await collateralToken.balanceOf(user.address)

  return {
    success,
    receipt,
    collateralBalanceBefore,
    collateralBalanceAfter,
    collateralAmount,
  }
}

export async function opMorphoBlueBorrow(
  testSystem: TestDeploymentSystem,
  market: MorphoMarketInfo,
  user: SignerWithAddress,
  amountToBorrow?: BigNumber,
): Promise<{
  success: boolean
  receipt: ContractReceipt
  loanTokenBalanceBefore: BigNumber
  loanTokenBalanceAfter: BigNumber
  borrowAmount: BigNumber
  borrowShares: BigNumber
}> {
  const { system, morphoSystem, userDPMProxy } = getContextFromTestSystem(testSystem)

  // Borrow calculations
  const positionBefore = await morphoSystem.morpho.position(market.id, userDPMProxy.address)

  const { borrowAmount, borrowArgs } = await calculateBorrowArgs(
    testSystem,
    market,
    user,
    positionBefore.collateral,
    amountToBorrow,
  )

  const loanToken = morphoSystem.tokensDeployment[market.loanToken].contract
  const loanTokenBalanceBefore = await loanToken.balanceOf(user.address)

  const addresses = toMorphoBlueStrategyAddresses(morphoSystem, testSystem.deployment.system)

  const borrowCalls = await borrow(borrowArgs, addresses, Network.TEST)

  const { success, receipt } = await executeOperation(
    system,
    user,
    userDPMProxy,
    borrowCalls.calls,
    borrowCalls.operationName,
  )

  const marketStatus = await morphoSystem.morpho.market(market.id)
  const borrowShares = calculateShares(marketStatus, borrowAmount)
  const loanTokenBalanceAfter = await loanToken.balanceOf(user.address)

  return {
    success,
    receipt,
    loanTokenBalanceBefore,
    loanTokenBalanceAfter,
    borrowAmount,
    borrowShares,
  }
}

export async function opMorphoBlueDepositBorrow(
  testSystem: TestDeploymentSystem,
  market: MorphoMarketInfo,
  user: SignerWithAddress,
  amountToSupply?: BigNumber,
  amountToBorrow?: BigNumber,
): Promise<{
  success: boolean
  receipt: ContractReceipt
  collateralBalanceBefore: BigNumber
  collateralBalanceAfter: BigNumber
  collateralAmount: BigNumber
  loanTokenBalanceBefore: BigNumber
  loanTokenBalanceAfter: BigNumber
  borrowAmount: BigNumber
  borrowShares: BigNumber
}> {
  const { system, morphoSystem, userDPMProxy } = getContextFromTestSystem(testSystem)

  // Deposit calculations
  const { collateralAmount, depositArgs } = await calculateDepositArgs(
    testSystem,
    market,
    user,
    amountToSupply,
  )

  // Borrow calculations
  const { borrowAmount, borrowArgs } = await calculateBorrowArgs(
    testSystem,
    market,
    user,
    collateralAmount,
    amountToBorrow,
  )

  const collateralToken = morphoSystem.tokensDeployment[market.collateralToken].contract
  await collateralToken.connect(user).approve(userDPMProxy.address, collateralAmount)
  const collateralBalanceBefore = await collateralToken.balanceOf(user.address)

  const loanToken = morphoSystem.tokensDeployment[market.loanToken].contract
  const loanTokenBalanceBefore = await loanToken.balanceOf(user.address)

  // Prepare calls
  const addresses = toMorphoBlueStrategyAddresses(morphoSystem, testSystem.deployment.system)
  const depositBorrowCalls = await depositBorrow(depositArgs, borrowArgs, addresses, Network.TEST)

  const { success, receipt } = await executeOperation(
    system,
    user,
    userDPMProxy,
    depositBorrowCalls.calls,
    depositBorrowCalls.operationName,
  )

  // Retrieve status after the operation
  const marketStatus = await morphoSystem.morpho.market(market.id)
  const borrowShares = calculateShares(marketStatus, borrowAmount)

  const loanTokenBalanceAfter = await loanToken.balanceOf(user.address)
  const collateralBalanceAfter = await collateralToken.balanceOf(user.address)

  return {
    success,
    receipt,
    collateralBalanceBefore,
    collateralBalanceAfter,
    collateralAmount,
    loanTokenBalanceBefore,
    loanTokenBalanceAfter,
    borrowAmount,
    borrowShares,
  }
}

export async function opMorphoBlueOpenDepositBorrow(
  testSystem: TestDeploymentSystem,
  market: MorphoMarketInfo,
  user: SignerWithAddress,
  positionType: PositionType,
  amountToSupply?: BigNumber,
  amountToBorrow?: BigNumber,
): Promise<{
  success: boolean
  receipt: ContractReceipt
  collateralBalanceBefore: BigNumber
  collateralBalanceAfter: BigNumber
  collateralAmount: BigNumber
  loanTokenBalanceBefore: BigNumber
  loanTokenBalanceAfter: BigNumber
  borrowAmount: BigNumber
  borrowShares: BigNumber
}> {
  const { system, morphoSystem, userDPMProxy } = getContextFromTestSystem(testSystem)

  // Deposit calculations
  const { collateralAmount, depositArgs } = await calculateDepositArgs(
    testSystem,
    market,
    user,
    amountToSupply,
  )

  // Borrow calculations
  const { borrowAmount, borrowArgs } = await calculateBorrowArgs(
    testSystem,
    market,
    user,
    collateralAmount,
    amountToBorrow,
  )

  const collateralToken = morphoSystem.tokensDeployment[market.collateralToken].contract
  await collateralToken.connect(user).approve(userDPMProxy.address, collateralAmount)
  const collateralBalanceBefore = await collateralToken.balanceOf(user.address)

  const loanToken = morphoSystem.tokensDeployment[market.loanToken].contract
  const loanTokenBalanceBefore = await loanToken.balanceOf(user.address)

  // Prepare calls
  const addresses = toMorphoBlueStrategyAddresses(morphoSystem, testSystem.deployment.system)
  const depositBorrowCalls = await openDepositBorrow(
    depositArgs,
    borrowArgs,
    { protocol: 'MorphoBlue', positionType },
    addresses,
    Network.TEST,
  )

  const { success, receipt } = await executeOperation(
    system,
    user,
    userDPMProxy,
    depositBorrowCalls.calls,
    depositBorrowCalls.operationName,
  )

  // Retrieve status after the operation
  const marketStatus = await morphoSystem.morpho.market(market.id)
  const borrowShares = calculateShares(marketStatus, borrowAmount)

  const loanTokenBalanceAfter = await loanToken.balanceOf(user.address)
  const collateralBalanceAfter = await collateralToken.balanceOf(user.address)

  return {
    success,
    receipt,
    collateralBalanceBefore,
    collateralBalanceAfter,
    collateralAmount,
    loanTokenBalanceBefore,
    loanTokenBalanceAfter,
    borrowAmount,
    borrowShares,
  }
}

export async function opMorphoBluePaybackWithdraw(
  testSystem: TestDeploymentSystem,
  market: MorphoMarketInfo,
  user: SignerWithAddress,
  repayAmount: BigNumber,
  withdrawAmount: BigNumber,
): Promise<{
  success: boolean
  receipt: ContractReceipt
  collateralBalanceBefore: BigNumber
  collateralBalanceAfter: BigNumber
  loanTokenBalanceBefore: BigNumber
  loanTokenBalanceAfter: BigNumber
}> {
  const { system, morphoSystem, userDPMProxy } = getContextFromTestSystem(testSystem)

  const loanToken = morphoSystem.tokensDeployment[market.loanToken].contract
  await loanToken.connect(user).approve(userDPMProxy.address, repayAmount)
  const loanTokenBalanceBefore = await loanToken.balanceOf(user.address)

  const collateralToken = morphoSystem.tokensDeployment[market.collateralToken].contract
  const collateralBalanceBefore = await collateralToken.balanceOf(user.address)

  const paybackWithdrawArgs = toMorphoBluePaybackWithdrawArgs(
    morphoSystem,
    market,
    repayAmount,
    withdrawAmount,
    user,
    userDPMProxy.address,
  )

  const addresses = toMorphoBlueStrategyAddresses(morphoSystem, testSystem.deployment.system)
  const paybackWithdrawCalls = await paybackWithdraw(paybackWithdrawArgs, addresses, Network.TEST)

  const { success, receipt } = await executeOperation(
    system,
    user,
    userDPMProxy,
    paybackWithdrawCalls.calls,
    paybackWithdrawCalls.operationName,
  )

  const loanTokenBalanceAfter = await loanToken.balanceOf(user.address)
  const collateralBalanceAfter = await collateralToken.balanceOf(user.address)

  return {
    success,
    receipt,
    collateralBalanceBefore,
    collateralBalanceAfter,
    loanTokenBalanceBefore,
    loanTokenBalanceAfter,
  }
}
