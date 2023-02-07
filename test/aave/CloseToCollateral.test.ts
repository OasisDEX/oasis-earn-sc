import assert from 'node:assert'

import { ADDRESSES, CONTRACT_NAMES, strategies, ZERO } from '@oasisdex/oasis-actions'
import { BigNumber } from 'bignumber.js'
import { expect } from 'chai'
import { loadFixture } from 'ethereum-waffle'

import { executeThroughDPMProxy, executeThroughProxy } from '../../helpers/deploy'
import { getOneInchCall } from '../../helpers/swap/OneInchCall'
import { amountFromWei, balanceOf } from '../../helpers/utils'
import { getSystemWithAAVEPositions, SystemWithAAVEPositions } from '../fixtures'
import { expectToBeEqual } from '../utils'

const EXPECT_DEBT_BEING_PAID_BACK = 'Expect debt being paid back'
const EXPECT_FEE_BEING_COLLECTED = 'Expect fee being collected'

describe('Close Position to collateral', () => {
  const slippage = new BigNumber(0.01) // 1%
  let fixture: SystemWithAAVEPositions

  before(async () => {
    fixture = await loadFixture(getSystemWithAAVEPositions({ use1inch: false }))
    // Since we deploy the system without using 1inch, there fore the swap that's
    // assigned is uniswap. In our tests we would like to use the actual swap with 1inch.
    await fixture.registry.removeEntry(CONTRACT_NAMES.common.SWAP)
    await fixture.registry.addEntry(CONTRACT_NAMES.common.SWAP, fixture.system.common.swap.address)
  })

  it('DPMProxy | Collateral - ETH ( 18 precision ) | Debt - USDC ( 6 precision )', async () => {
    const position = fixture.dpmPositions['ETH/USDC Multiply']
    assert(position, 'Unsupported position')

    const { provider, signer } = fixture.config
    const { proxy, getPosition } = position
    const { addresses } = fixture.strategiesDependencies
    const { collateral: collateralToken, debt: debtToken } = await getPosition()

    const currentPosition = await strategies.aave.view(
      {
        collateralToken,
        debtToken,
        proxy,
      },
      { addresses, provider },
    )

    const closeStrategy = await strategies.aave.close(
      {
        collateralToken,
        debtToken,
        slippage,
        collateralAmountLockedInProtocolInWei: currentPosition.collateral.amount,
      },
      {
        addresses,
        provider,
        currentPosition,
        getSwapData: getOneInchCall(fixture.system.common.swap.address),
        proxy,
        user: fixture.config.address,
        isDPMProxy: true,
        shouldCloseToCollateral: true,
      },
    )

    const feeRecipientBalanceBeforeTx = await getBalanceOf(
      ADDRESSES.main.feeRecipient,
      addresses[debtToken.symbol],
      debtToken.precision,
    )

    await executeThroughDPMProxy(
      proxy,
      {
        address: fixture.system.common.operationExecutor.address,
        calldata: fixture.system.common.operationExecutor.interface.encodeFunctionData(
          'executeOp',
          [closeStrategy.transaction.calls, closeStrategy.transaction.operationName],
        ),
      },
      signer,
      '',
    )

    const USDC_VARIABLE_DEBT = '0x619beb58998eD2278e08620f97007e1116D5D25b'
    const debtBalance = await getBalanceOf(proxy, USDC_VARIABLE_DEBT, 6)
    expectToBeEqual(debtBalance, ZERO, undefined, EXPECT_DEBT_BEING_PAID_BACK)

    const feeRecipientBalanceAfterTx = await getBalanceOf(
      ADDRESSES.main.feeRecipient,
      addresses[debtToken.symbol],
      debtToken.precision,
    )

    expect(feeRecipientBalanceAfterTx.gt(feeRecipientBalanceBeforeTx), EXPECT_FEE_BEING_COLLECTED)
      .to.be.true
  })

  it('DPMProxy | Collateral - WBTC ( 8 precision ) | Debt - USDC ( 6 precision )', async () => {
    const position = fixture.dpmPositions['WBTC/USDC Multiply']
    assert(position, 'Unsupported position')

    const { address: user, provider, signer } = fixture.config
    const { proxy, getPosition } = position
    const { addresses } = fixture.strategiesDependencies
    const { collateral: collateralToken, debt: debtToken } = await getPosition()

    const currentPosition = await strategies.aave.view(
      {
        collateralToken,
        debtToken,
        proxy,
      },
      { addresses, provider },
    )

    const closeStrategy = await strategies.aave.close(
      {
        collateralToken,
        debtToken,
        slippage,
        collateralAmountLockedInProtocolInWei: currentPosition.collateral.amount,
      },
      {
        addresses,
        provider,
        currentPosition,
        getSwapData: getOneInchCall(fixture.system.common.swap.address),
        proxy,
        user: fixture.config.address,
        isDPMProxy: true,
        shouldCloseToCollateral: true,
      },
    )
    const userCollateralBalanceBeforeTx = await getBalanceOf(user, collateralToken.address)
    const feeRecipientBalanceBeforeTx = await getBalanceOf(
      ADDRESSES.main.feeRecipient,
      addresses[debtToken.symbol],
      debtToken.precision,
    )

    await executeThroughDPMProxy(
      proxy,
      {
        address: fixture.system.common.operationExecutor.address,
        calldata: fixture.system.common.operationExecutor.interface.encodeFunctionData(
          'executeOp',
          [closeStrategy.transaction.calls, closeStrategy.transaction.operationName],
        ),
      },
      signer,
      '',
    )

    const userCollateralBalanceAfterTx = await getBalanceOf(user, collateralToken.address)

    const expectedBalance = userCollateralBalanceBeforeTx.plus(
      currentPosition.collateral.amount.minus(closeStrategy.simulation.swap.fromTokenAmount),
    )

    expectToBeEqual(
      expectedBalance,
      userCollateralBalanceAfterTx,
      undefined,
      EXPECT_DEBT_BEING_PAID_BACK,
    )

    const USDC_VARIABLE_DEBT = '0x619beb58998eD2278e08620f97007e1116D5D25b'
    const debtBalance = await getBalanceOf(proxy, USDC_VARIABLE_DEBT, 6)
    expectToBeEqual(debtBalance, ZERO)

    const feeRecipientBalanceAfterTx = await getBalanceOf(
      ADDRESSES.main.feeRecipient,
      addresses[debtToken.symbol],
      debtToken.precision,
    )
    expect(feeRecipientBalanceAfterTx.gt(feeRecipientBalanceBeforeTx), EXPECT_FEE_BEING_COLLECTED)
      .to.be.true
  })

  it('DSPRoxy | Collateral - STETH ( 18 precision ) | Debt - ETH ( 18 precision )', async () => {
    const position = fixture.dsProxyPosition
    assert(position, 'Unsupported position')

    const { address: user, provider, signer } = fixture.config
    const { proxy, getPosition } = position
    const { addresses } = fixture.strategiesDependencies
    const { collateral: collateralToken, debt: debtToken } = await getPosition()

    const currentPosition = await strategies.aave.view(
      {
        collateralToken,
        debtToken,
        proxy,
      },
      { addresses, provider },
    )

    const closeStrategy = await strategies.aave.close(
      {
        collateralToken,
        debtToken,
        slippage,
        collateralAmountLockedInProtocolInWei: currentPosition.collateral.amount,
      },
      {
        addresses,
        provider,
        currentPosition,
        getSwapData: getOneInchCall(fixture.system.common.swap.address),
        proxy,
        user: fixture.config.address,
        isDPMProxy: false,
        shouldCloseToCollateral: true,
      },
    )

    const userCollateralBalanceBeforeTx = await getBalanceOf(user, collateralToken.address)
    const feeRecipientBalanceBeforeTx = await getBalanceOf(
      ADDRESSES.main.feeRecipient,
      addresses['WETH'],
      debtToken.precision,
    )
    await executeThroughProxy(
      proxy,
      {
        address: fixture.system.common.operationExecutor.address,
        calldata: fixture.system.common.operationExecutor.interface.encodeFunctionData(
          'executeOp',
          [closeStrategy.transaction.calls, closeStrategy.transaction.operationName],
        ),
      },
      signer,
      '',
    )

    const userCollateralBalanceAfterTx = await getBalanceOf(user, collateralToken.address)
    const feeRecipientBalanceAfterTx = await getBalanceOf(
      ADDRESSES.main.feeRecipient,
      addresses['WETH'],
      debtToken.precision,
    )

    const expectedBalance = userCollateralBalanceBeforeTx.plus(
      currentPosition.collateral.amount.minus(closeStrategy.simulation.swap.fromTokenAmount),
    )

    // Given the nature of stETH, there is 1 WEI remaining within astETH and cannot be withdrawn
    // thus there is a difference if we compare the two numbers up to the last wei.
    // Using 16 precision will still give us accurate results.
    // It's 16 and not 17 because if there is the following case:
    // 1967693420651624420 -> (to 17) 1.96769342065162442
    // 1967693420651624419 -> (to 17) 1.96769342065162441
    // So 16 is a safe bet.
    expectToBeEqual(
      amountFromWei(expectedBalance).toFixed(16),
      amountFromWei(userCollateralBalanceAfterTx).toFixed(16),
      undefined,
      EXPECT_DEBT_BEING_PAID_BACK,
    )

    expect(feeRecipientBalanceAfterTx.gt(feeRecipientBalanceBeforeTx), EXPECT_FEE_BEING_COLLECTED)
      .to.be.true
  })

  async function getBalanceOf(user: string, assetAddress: string, precision = 18) {
    return await balanceOf(assetAddress, user, {
      config: fixture.config,
      debug: false,
      isFormatted: false,
      decimals: precision,
    })
  }
})
