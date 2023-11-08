import {
  MorphoLLTVPrecision,
  MorphoMarketInfo,
  MorphoPricePrecision,
  MorphoSystem,
} from '@morpho-blue'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { BigNumber, BigNumberish } from 'ethers'

import { applyTaylorCompounded, mulDivDown, toAssetsUp, toSharesUp, wMulDown } from './math-library'

export type MorphoMarketStatus = {
  totalSupplyAssets: BigNumber
  totalSupplyShares: BigNumber
  totalBorrowAssets: BigNumber
  totalBorrowShares: BigNumber
  lastUpdate: BigNumber
  fee: BigNumber
}

export type MorphoMarketPosition = {
  supplyShares: BigNumber
  borrowShares: BigNumber
  collateral: BigNumber
}

export async function getMaxBorrowableAmount(
  morphoSystem: MorphoSystem,
  market: MorphoMarketInfo,
  suppliedCollateral: BigNumberish,
): Promise<BigNumber> {
  const oracle = morphoSystem.oraclesDeployment[market.loanToken][market.collateralToken]
  const priceLoanPerCollateral = await oracle.contract.price()

  const collateralInLoanToken = mulDivDown(
    BigNumber.from(suppliedCollateral),
    priceLoanPerCollateral,
    BigNumber.from(10).pow(MorphoPricePrecision),
  )

  const maxBorrowAmount = mulDivDown(
    collateralInLoanToken,
    market.solidityParams.lltv as BigNumber,
    BigNumber.from(10).pow(MorphoLLTVPrecision),
  )

  return maxBorrowAmount
}

export async function getMaxSupplyCollateral(
  morphoSystem: MorphoSystem,
  market: MorphoMarketInfo,
): Promise<BigNumber> {
  const marketStatus = await morphoSystem.morpho.market(market.id)
  const lltvFactor = BigNumber.from(10).pow(MorphoLLTVPrecision)

  // (Total Supply in Loan Assets) / (Price of Collateral in Loan Assets)
  const loanAmountInCollateral = await loanTokenToCollateral(
    morphoSystem,
    market,
    marketStatus.totalSupplyAssets,
  )

  // (Total Supply in Collateral Assets) / (LLTV)
  const maximumCollateralToSupply = loanAmountInCollateral
    .mul(lltvFactor)
    .div(market.solidityParams.lltv as BigNumber)

  return maximumCollateralToSupply
}

export async function collateralToLoanToken(
  morphoSystem: MorphoSystem,
  market: MorphoMarketInfo,
  collateralAmount: BigNumberish,
): Promise<BigNumber> {
  const oracle = morphoSystem.oraclesDeployment[market.loanToken][market.collateralToken]
  const priceLoanPerCollateral = await oracle.contract.price()
  const priceFactor = BigNumber.from(10).pow(MorphoPricePrecision)

  return BigNumber.from(collateralAmount).mul(priceLoanPerCollateral).div(priceFactor)
}

export async function loanTokenToCollateral(
  morphoSystem: MorphoSystem,
  market: MorphoMarketInfo,
  loanTokenAmount: BigNumberish,
): Promise<BigNumber> {
  const oracle = morphoSystem.oraclesDeployment[market.loanToken][market.collateralToken]
  const priceLoanPerCollateral = await oracle.contract.price()
  const priceFactor = BigNumber.from(10).pow(MorphoPricePrecision)

  return BigNumber.from(loanTokenAmount).mul(priceFactor).div(priceLoanPerCollateral)
}

export function calculateShares(
  marketStatus: MorphoMarketStatus,
  borrowAmount: BigNumber,
): BigNumber {
  return toSharesUp(borrowAmount, marketStatus.totalBorrowAssets, marketStatus.totalBorrowShares)
}

export function calculateInterestOnMarket(
  marketStatus: MorphoMarketStatus,
  interestRate: BigNumber,
  executionTimestamp: BigNumberish,
): BigNumber {
  const elapsedTime = BigNumber.from(executionTimestamp).sub(marketStatus.lastUpdate)

  const compoundedRate = applyTaylorCompounded(interestRate, elapsedTime)

  const interestOnMarket = wMulDown(marketStatus.totalBorrowAssets, compoundedRate)

  return interestOnMarket
}

export function calculateRepayAssetsFromShares(
  marketStatus: MorphoMarketStatus,
  position: MorphoMarketPosition,
  interestRate: BigNumber,
  executionTimestamp: BigNumberish,
): BigNumber {
  const interest = calculateInterestOnMarket(marketStatus, interestRate, executionTimestamp)

  const marketStatusWithInterest = {
    ...marketStatus,
    totalBorrowAssets: marketStatus.totalBorrowAssets.add(interest),
    totalSupplyAssets: marketStatus.totalSupplyAssets.add(interest),
  }

  const assetsAmount = toAssetsUp(
    position.borrowShares,
    marketStatusWithInterest.totalBorrowAssets,
    marketStatusWithInterest.totalBorrowShares,
  )

  return assetsAmount
}

// Modify Position Functions
export async function supplyMaxCollateral(
  morphoSystem: MorphoSystem,
  market: MorphoMarketInfo,
  user: SignerWithAddress,
): Promise<{
  collateralBalanceBefore: BigNumber
  collateralBalanceAfter: BigNumber
  maxCollateral: BigNumber
}> {
  const { morpho, tokensDeployment } = morphoSystem

  const maxCollateral = await getMaxSupplyCollateral(morphoSystem, market)
  const collateralToken = tokensDeployment[market.collateralToken].contract

  const collateralBalanceBefore = await collateralToken.balanceOf(user.address)

  await collateralToken.connect(user).approve(morpho.address, maxCollateral)
  await morpho
    .connect(user)
    .supplyCollateral(market.solidityParams, maxCollateral, user.address, [])

  const collateralBalanceAfter = await collateralToken.balanceOf(user.address)

  return { collateralBalanceBefore, collateralBalanceAfter, maxCollateral }
}

export async function borrowMaxLoanToken(
  morphoSystem: MorphoSystem,
  market: MorphoMarketInfo,
  user: SignerWithAddress,
): Promise<{
  loanTokenBalanceBefore: BigNumber
  loanTokenBalanceAfter: BigNumber
  borrowAmount: BigNumber
  borrowShares: BigNumber
}> {
  const { morpho, tokensDeployment } = morphoSystem

  const marketStatus = await morpho.market(market.id)
  const positionBefore = await morpho.position(market.id, user.address)
  const borrowAmount = await getMaxBorrowableAmount(morphoSystem, market, positionBefore.collateral)
  const loanToken = tokensDeployment[market.loanToken].contract

  const loanTokenBalanceBefore = await loanToken.balanceOf(user.address)

  await morpho
    .connect(user)
    .borrow(market.solidityParams, borrowAmount, 0, user.address, user.address)

  const borrowShares = calculateShares(marketStatus, borrowAmount)
  const loanTokenBalanceAfter = await loanToken.balanceOf(user.address)

  return { loanTokenBalanceBefore, loanTokenBalanceAfter, borrowAmount, borrowShares }
}

export async function repayWithLoanToken(
  morphoSystem: MorphoSystem,
  market: MorphoMarketInfo,
  user: SignerWithAddress,
  repayAmount: BigNumberish,
): Promise<{
  loanTokenBalanceBefore: BigNumber
  loanTokenBalanceAfter: BigNumber
}> {
  const loanToken = morphoSystem.tokensDeployment[market.loanToken].contract
  await loanToken.connect(user).approve(morphoSystem.morpho.address, repayAmount)
  const loanTokenBalanceBefore = await loanToken.balanceOf(user.address)
  expect(loanTokenBalanceBefore).to.be.gte(repayAmount)

  await morphoSystem.morpho
    .connect(user)
    .repay(market.solidityParams, repayAmount, 0, user.address, [])

  const loanTokenBalanceAfter = await loanToken.balanceOf(user.address)

  return { loanTokenBalanceBefore, loanTokenBalanceAfter }
}

export async function repayWithShares(
  morphoSystem: MorphoSystem,
  market: MorphoMarketInfo,
  user: SignerWithAddress,
  expectedExecutionTimestamp?: BigNumberish,
): Promise<{
  loanTokenBalanceBefore: BigNumber
  loanTokenBalanceAfter: BigNumber
  repayAssetsAmount: BigNumber
}> {
  const marketStatus = await morphoSystem.morpho.market(market.id)
  const positionBefore = await morphoSystem.morpho.position(market.id, user.address)
  const interestRate = await morphoSystem.irm.borrowRate(market.solidityParams, marketStatus)

  if (!expectedExecutionTimestamp) {
    expectedExecutionTimestamp = marketStatus.lastUpdate
  }

  const repayAssetsAmount = calculateRepayAssetsFromShares(
    marketStatus,
    positionBefore,
    interestRate,
    expectedExecutionTimestamp,
  )

  const loanToken = morphoSystem.tokensDeployment[market.loanToken].contract
  await loanToken.connect(user).approve(morphoSystem.morpho.address, repayAssetsAmount)
  const loanTokenBalanceBefore = await loanToken.balanceOf(user.address)

  await morphoSystem.morpho
    .connect(user)
    .repay(market.solidityParams, 0, positionBefore.borrowShares, user.address, [])

  const loanTokenBalanceAfter = await loanToken.balanceOf(user.address)

  return { loanTokenBalanceBefore, loanTokenBalanceAfter, repayAssetsAmount }
}

// Expect Functions
export async function expectPosition(
  morphoSystem: MorphoSystem,
  market: MorphoMarketInfo,
  userAddress: string,
  collateral: BigNumberish,
  supplyShares: BigNumberish,
  borrowShares: BigNumberish,
): Promise<void> {
  const position = await morphoSystem.morpho.position(market.id, userAddress)

  expect(position.collateral).to.be.equal(collateral)
  expect(position.supplyShares).to.be.equal(supplyShares)
  expect(position.borrowShares).to.be.equal(borrowShares)
}

export async function expectMarketStatus(
  morphoSystem: MorphoSystem,
  market: MorphoMarketInfo,
  totalSupplyAssets: BigNumberish,
  totalSupplyShares: BigNumberish,
  totalBorrowAssets: BigNumberish,
  totalBorrowShares: BigNumberish,
  fee: BigNumberish,
): Promise<void> {
  const marketStatus = await morphoSystem.morpho.market(market.id)

  expect(marketStatus.totalSupplyAssets).to.be.equal(totalSupplyAssets)
  expect(marketStatus.totalSupplyShares).to.be.equal(totalSupplyShares)
  expect(marketStatus.totalBorrowAssets).to.be.equal(totalBorrowAssets)
  expect(marketStatus.totalBorrowShares).to.be.equal(totalBorrowShares)
  expect(marketStatus.fee).to.be.equal(fee)
}
