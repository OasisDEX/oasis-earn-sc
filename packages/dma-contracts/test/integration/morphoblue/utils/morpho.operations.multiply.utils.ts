import { Network } from '@deploy-configurations/types/network'
import { asPercentageValue, swapOneInchTokens } from '@dma-common/test-utils'
import { FakeRequestEnv } from '@dma-common/types/common'
import { TestDeploymentSystem } from '@dma-contracts/utils'
import { MorphoBlueOpenOperationArgs, open } from '@dma-library/operations/morphoblue/multiply/open'
import { MorphoMarketInfo } from '@morpho-blue'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { MockExchange } from '@typechain'
import { BigNumber, ContractReceipt } from 'ethers'

import {
  calculateShares,
  collateralToLoanToken,
  getMaxBorrowableAmount,
  getMaxSupplyCollateral,
} from './morpho.direct.utils'
import { executeOperation, getContextFromTestSystem } from './morpho.operations.common.utils'
import { toMorphoBlueMultiplyOpenArgs, toMorphoBlueStrategyAddresses } from './type-casts'

// MULTIPLY
async function calculateOpenMultiplyArgs(
  testSystem: TestDeploymentSystem,
  market: MorphoMarketInfo,
  user: SignerWithAddress,
  multiplyFactor: number,
  amountToSupply?: BigNumber,
  amountToBorrow?: BigNumber,
): Promise<{
  collateralAmount: BigNumber
  multipliedCollateralAmount: BigNumber
  borrowAmount: BigNumber
  multiplyOpenArgs: MorphoBlueOpenOperationArgs
}> {
  const slippage = asPercentageValue(8, 100)
  const FixedPointDecimals = 6
  const FixedPointFactor = BigNumber.from(10).pow(FixedPointDecimals)
  const { morphoSystem, userDPMProxy } = getContextFromTestSystem(testSystem)

  // Deposit calculations
  const collateralAmount = amountToSupply
    ? amountToSupply
    : await getMaxSupplyCollateral(morphoSystem, market)

  const multiplyFactorWithoutDecimals = (multiplyFactor * 10 ** FixedPointDecimals).toFixed(0)
  const multipliedCollateralAmount = collateralAmount
    .mul(multiplyFactorWithoutDecimals)
    .div(FixedPointFactor)
  const multipliedLoanTokenAmount = await collateralToLoanToken(
    morphoSystem,
    market,
    multipliedCollateralAmount,
  )

  const borrowAmount = amountToBorrow
    ? amountToBorrow
    : await getMaxBorrowableAmount(morphoSystem, market, multipliedCollateralAmount)

  const addresses = toMorphoBlueStrategyAddresses(morphoSystem, testSystem.deployment.system)

  const fakeRequestEnv: FakeRequestEnv = {
    mockExchange: testSystem.deployment.system.MockExchange.contract as MockExchange,
    fakeWETH: testSystem.helpers.fakeWETH,
    fakeDAI: testSystem.helpers.fakeDAI,
  }

  const swapResponse = await swapOneInchTokens(
    morphoSystem.tokensDeployment[market.loanToken].contract.address,
    morphoSystem.tokensDeployment[market.collateralToken].contract.address,
    multipliedLoanTokenAmount.toString(),
    testSystem.deployment.system.Swap.contract.address,
    slippage.value.toFixed(),
    undefined,
    fakeRequestEnv,
  )

  const multiplyOpenArgs = toMorphoBlueMultiplyOpenArgs(
    morphoSystem,
    market,
    collateralAmount,
    multipliedLoanTokenAmount,
    swapResponse.tx.data,
    borrowAmount,
    user,
    userDPMProxy.address,
    addresses,
    Network.TEST,
  )

  return {
    collateralAmount,
    multipliedCollateralAmount,
    borrowAmount,
    multiplyOpenArgs,
  }
}

export async function opMorphoBlueOpenMultiply(
  testSystem: TestDeploymentSystem,
  market: MorphoMarketInfo,
  user: SignerWithAddress,
  multiplyFactor: number,
  amountToSupply?: BigNumber,
  amountToBorrow?: BigNumber,
): Promise<{
  success: boolean
  receipt: ContractReceipt
  collateralBalanceBefore: BigNumber
  collateralBalanceAfter: BigNumber
  collateralAmount: BigNumber
  multipliedCollateralAmount: BigNumber
  loanTokenBalanceBefore: BigNumber
  loanTokenBalanceAfter: BigNumber
  borrowAmount: BigNumber
  borrowShares: BigNumber
}> {
  const { system, morphoSystem, userDPMProxy } = getContextFromTestSystem(testSystem)

  // Deposit calculations
  const { collateralAmount, multipliedCollateralAmount, borrowAmount, multiplyOpenArgs } =
    await calculateOpenMultiplyArgs(
      testSystem,
      market,
      user,
      multiplyFactor,
      amountToSupply,
      amountToBorrow,
    )

  const collateralToken = morphoSystem.tokensDeployment[market.collateralToken].contract
  await collateralToken.connect(user).approve(userDPMProxy.address, collateralAmount)
  const collateralBalanceBefore = await collateralToken.balanceOf(user.address)

  const loanToken = morphoSystem.tokensDeployment[market.loanToken].contract
  const loanTokenBalanceBefore = await loanToken.balanceOf(user.address)

  // Prepare calls
  const multiplyOpenCalls = await open(multiplyOpenArgs)

  const { success, receipt } = await executeOperation(
    system,
    user,
    userDPMProxy,
    multiplyOpenCalls.calls,
    multiplyOpenCalls.operationName,
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
    multipliedCollateralAmount,
    loanTokenBalanceBefore,
    loanTokenBalanceAfter,
    borrowAmount,
    borrowShares,
  }
}
