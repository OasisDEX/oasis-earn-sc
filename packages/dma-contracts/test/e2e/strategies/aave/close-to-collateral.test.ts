import assert from 'node:assert'

import { executeThroughDPMProxy, executeThroughProxy } from '@dma-common/utils/execute'
import { SystemWithAavePositions, systemWithAavePositions } from '@dma-contracts/test/fixtures'
import { systemWithAaveV3Positions } from '@dma-contracts/test/fixtures/system/system-with-aave-v3-positions'
import { SystemWithAAVEV3Positions } from '@dma-contracts/test/fixtures/types/system-with-aave-positions'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { ADDRESSES } from '@oasisdex/addresses'
import { CONTRACT_NAMES, ZERO } from '@oasisdex/dma-common/constants'
import { expect } from '@oasisdex/dma-common/test-utils'
import { amountFromWei, balanceOf } from '@oasisdex/dma-common/utils/common'
import { getOneInchCall } from '@oasisdex/dma-common/utils/swap'
import { Network } from '@oasisdex/dma-deployments/types/network'
import { strategies } from '@oasisdex/dma-library'
import BigNumber from 'bignumber.js'

const networkFork = process.env.NETWORK_FORK as Network
const EXPECT_DEBT_BEING_PAID_BACK = 'Expect debt being paid back'
const EXPECT_FEE_BEING_COLLECTED = 'Expect fee being collected'

// TODO: update test
describe.skip('Close AAVEv2 Position to collateral | E2E', () => {
  const slippage = new BigNumber(0.01) // 1%
  let fixture: SystemWithAavePositions

  before(async () => {
    fixture = await loadFixture(systemWithAavePositions({ use1inch: true }))
    // Since we deploy the system without using 1inch the local system assigned swap contract is uniswap.
    // In our tests we would like to use the actual swap with 1inch.
    await fixture.registry.removeEntry(CONTRACT_NAMES.common.SWAP)
    await fixture.registry.addEntry(
      CONTRACT_NAMES.common.SWAP,
      fixture.system.Swap.contract.address,
    )
  })

  it('DPMProxy | Collateral - ETH ( 18 precision ) | Debt - USDC ( 6 precision )', async () => {
    const position = fixture.dpmPositions['ETH/USDC Multiply']
    assert(position, 'Unsupported position')

    const { provider, signer } = fixture.config
    const { proxy, getPosition } = position
    const { addresses } = fixture.strategiesDependencies
    const { collateral: collateralToken, debt: debtToken } = await getPosition()

    if (debtToken.symbol === 'WSTETH') throw new Error('Unsupported debt token')
    if (collateralToken.symbol === 'WSTETH') throw new Error('Unsupported collateral token')

    const currentPosition = await strategies.aave.v2.view(
      {
        collateralToken,
        debtToken,
        proxy,
      },
      { addresses, provider },
    )

    const closeStrategy = await strategies.aave.v2.close(
      {
        collateralToken,
        debtToken,
        slippage,
        collateralAmountLockedInProtocolInWei: currentPosition.collateral.amount,
        shouldCloseToCollateral: true,
      },
      {
        addresses,
        provider,
        currentPosition,
        getSwapData: getOneInchCall(fixture.system.Swap.contract.address),
        proxy,
        user: fixture.config.address,
        isDPMProxy: true,
      },
    )

    const feeRecipientBalanceBeforeTx = await getBalanceOf(
      ADDRESSES[Network.MAINNET].common.FeeRecipient,
      addresses[debtToken.symbol],
      debtToken.precision,
    )

    await executeThroughDPMProxy(
      proxy,
      {
        address: fixture.system.OperationExecutor.contract.address,
        calldata: fixture.system.OperationExecutor.contract.interface.encodeFunctionData(
          'executeOp',
          [closeStrategy.transaction.calls, closeStrategy.transaction.operationName],
        ),
      },
      signer,
      '',
    )

    const USDC_VARIABLE_DEBT = '0x619beb58998eD2278e08620f97007e1116D5D25b'
    const debtBalance = await getBalanceOf(proxy, USDC_VARIABLE_DEBT, 6)
    expect.toBeEqual(debtBalance, ZERO, undefined, EXPECT_DEBT_BEING_PAID_BACK)

    const feeRecipientBalanceAfterTx = await getBalanceOf(
      ADDRESSES[Network.MAINNET].common.FeeRecipient,
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

    if (debtToken.symbol === 'WSTETH') throw new Error('Unsupported debt token')
    if (collateralToken.symbol === 'WSTETH') throw new Error('Unsupported collateral token')

    const currentPosition = await strategies.aave.v2.view(
      {
        collateralToken,
        debtToken,
        proxy,
      },
      { addresses, provider },
    )

    const closeStrategy = await strategies.aave.v2.close(
      {
        collateralToken,
        debtToken,
        slippage,
        collateralAmountLockedInProtocolInWei: currentPosition.collateral.amount,
        shouldCloseToCollateral: true,
      },
      {
        addresses,
        provider,
        currentPosition,
        getSwapData: getOneInchCall(fixture.system.Swap.contract.address),
        proxy,
        user: fixture.config.address,
        isDPMProxy: true,
      },
    )
    const userCollateralBalanceBeforeTx = await getBalanceOf(user, collateralToken.address)
    const feeRecipientBalanceBeforeTx = await getBalanceOf(
      ADDRESSES[Network.MAINNET].common.FeeRecipient,
      addresses[debtToken.symbol],
      debtToken.precision,
    )

    await executeThroughDPMProxy(
      proxy,
      {
        address: fixture.system.OperationExecutor.contract.address,
        calldata: fixture.system.OperationExecutor.contract.interface.encodeFunctionData(
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

    expect.toBeEqual(
      expectedBalance,
      userCollateralBalanceAfterTx,
      undefined,
      EXPECT_DEBT_BEING_PAID_BACK,
    )

    const USDC_VARIABLE_DEBT = '0x619beb58998eD2278e08620f97007e1116D5D25b'
    const debtBalance = await getBalanceOf(proxy, USDC_VARIABLE_DEBT, 6)
    expect.toBeEqual(debtBalance, ZERO)

    const feeRecipientBalanceAfterTx = await getBalanceOf(
      ADDRESSES[Network.MAINNET].common.FeeRecipient,
      addresses[debtToken.symbol],
      debtToken.precision,
    )
    expect(feeRecipientBalanceAfterTx.gt(feeRecipientBalanceBeforeTx), EXPECT_FEE_BEING_COLLECTED)
      .to.be.true
  })

  it('DSProxy | Collateral - STETH ( 18 precision ) | Debt - ETH ( 18 precision )', async () => {
    const position = fixture.dsProxyPosition
    assert(position, 'Unsupported position')

    const { address: user, provider, signer } = fixture.config
    const { proxy, getPosition } = position
    const { addresses } = fixture.strategiesDependencies
    const { collateral: collateralToken, debt: debtToken } = await getPosition()

    const currentPosition = await strategies.aave.v2.view(
      {
        collateralToken,
        debtToken,
        proxy,
      },
      { addresses, provider },
    )

    const closeStrategy = await strategies.aave.v2.close(
      {
        collateralToken,
        debtToken,
        slippage,
        collateralAmountLockedInProtocolInWei: currentPosition.collateral.amount,
        shouldCloseToCollateral: true,
      },
      {
        addresses,
        provider,
        currentPosition,
        getSwapData: getOneInchCall(fixture.system.Swap.contract.address),
        proxy,
        user: fixture.config.address,
        isDPMProxy: false,
      },
    )

    const userCollateralBalanceBeforeTx = await getBalanceOf(user, collateralToken.address)
    const feeRecipientBalanceBeforeTx = await getBalanceOf(
      ADDRESSES[Network.MAINNET].common.FeeRecipient,
      addresses['WETH'],
      debtToken.precision,
    )

    await executeThroughProxy(
      proxy,
      {
        address: fixture.system.OperationExecutor.contract.address,
        calldata: fixture.system.OperationExecutor.contract.interface.encodeFunctionData(
          'executeOp',
          [closeStrategy.transaction.calls, closeStrategy.transaction.operationName],
        ),
      },
      signer,
      '',
    )

    const userCollateralBalanceAfterTx = await getBalanceOf(user, collateralToken.address)
    const feeRecipientBalanceAfterTx = await getBalanceOf(
      ADDRESSES[Network.MAINNET].common.FeeRecipient,
      addresses['WETH'],
      debtToken.precision,
    )

    const expectedBalance = userCollateralBalanceBeforeTx.plus(
      currentPosition.collateral.amount.minus(closeStrategy.simulation.swap.fromTokenAmount),
    )
    const feeWalletChange = feeRecipientBalanceAfterTx.minus(feeRecipientBalanceBeforeTx)

    // The precision of the two comparison amounts has been lowered to 8.
    // This is because in the time between us getting the current position
    // And executing the transaction, the collateral accrues interest.
    // When we withdraw the collateral with the MAX_UINT flag we get a different collateral amount
    // To the amount we had earlier after querying the position
    // By lowering the sensitivity of the comparison we can avoid this issue
    expect.toBeEqual(
      amountFromWei(expectedBalance).toFixed(8),
      amountFromWei(userCollateralBalanceAfterTx).toFixed(8),
      undefined,
      EXPECT_DEBT_BEING_PAID_BACK,
    )

    expect(closeStrategy.simulation.swap.tokenFee.gt(feeWalletChange), EXPECT_FEE_BEING_COLLECTED)
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

describe('Close AAVEv3 Position to collateral', () => {
  const slippage = new BigNumber(0.01) // 1%
  let fixture: SystemWithAAVEV3Positions

  before(async () => {
    fixture = await loadFixture(
      systemWithAaveV3Positions({
        use1inch: true,
        network: networkFork,
        systemConfigPath: `${networkFork}.conf.ts`,
      }),
    )
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

    if (debtToken.symbol === 'WSTETH') throw new Error('Unsupported debt token')
    if (collateralToken.symbol === 'WSTETH') throw new Error('Unsupported collateral token')

    const currentPosition = await strategies.aave.v3.view(
      {
        collateralToken,
        debtToken,
        proxy,
      },
      { addresses, provider },
    )

    const closeStrategy = await strategies.aave.v3.close(
      {
        collateralToken,
        debtToken,
        slippage,
        collateralAmountLockedInProtocolInWei: currentPosition.collateral.amount,
        shouldCloseToCollateral: true,
      },
      {
        addresses,
        provider,
        currentPosition,
        getSwapData: getOneInchCall(fixture.system.Swap.contract.address),
        proxy,
        user: fixture.config.address,
        isDPMProxy: true,
      },
    )

    const feeRecipientBalanceBeforeTx = await getBalanceOf(
      ADDRESSES[Network.MAINNET].common.FeeRecipient,
      addresses['USDC'],
      debtToken.precision,
    )

    await executeThroughDPMProxy(
      proxy,
      {
        address: fixture.system.OperationExecutor.contract.address,
        calldata: fixture.system.OperationExecutor.contract.interface.encodeFunctionData(
          'executeOp',
          [closeStrategy.transaction.calls, closeStrategy.transaction.operationName],
        ),
      },
      signer,
      '',
    )

    const USDC_VARIABLE_DEBT = '0x619beb58998eD2278e08620f97007e1116D5D25b'
    const debtBalance = await getBalanceOf(proxy, USDC_VARIABLE_DEBT, 6)
    expect.toBeEqual(debtBalance, ZERO, undefined, EXPECT_DEBT_BEING_PAID_BACK)

    const feeRecipientBalanceAfterTx = await getBalanceOf(
      ADDRESSES[Network.MAINNET].common.FeeRecipient,
      addresses['USDC'],
      debtToken.precision,
    )

    expect(feeRecipientBalanceAfterTx.gt(feeRecipientBalanceBeforeTx), EXPECT_FEE_BEING_COLLECTED)
      .to.be.true
  })

  it('DPM | Collateral - WSTETH ( 18 precision ) | Debt - ETH ( 18 precision )', async () => {
    const position = fixture.dpmPositions['WSTETH/ETH Earn']
    assert(position, 'Unsupported position')

    const { address: user, provider, signer } = fixture.config
    const { proxy, getPosition } = position
    const { addresses } = fixture.strategiesDependencies
    const { collateral: collateralToken, debt: debtToken } = await getPosition()

    const currentPosition = await strategies.aave.v3.view(
      {
        collateralToken,
        debtToken,
        proxy,
      },
      { addresses, provider },
    )

    const closeStrategy = await strategies.aave.v3.close(
      {
        collateralToken,
        debtToken,
        slippage,
        collateralAmountLockedInProtocolInWei: currentPosition.collateral.amount,
        shouldCloseToCollateral: true,
      },
      {
        addresses,
        provider,
        currentPosition,
        getSwapData: getOneInchCall(fixture.system.Swap.contract.address),
        proxy,
        user: fixture.config.address,
        isDPMProxy: true,
      },
    )

    const userCollateralBalanceBeforeTx = await getBalanceOf(user, collateralToken.address)
    const feeRecipientBalanceBeforeTx = await getBalanceOf(
      ADDRESSES[Network.MAINNET].common.FeeRecipient,
      addresses['WETH'],
      debtToken.precision,
    )
    await executeThroughDPMProxy(
      proxy,
      {
        address: fixture.system.OperationExecutor.contract.address,
        calldata: fixture.system.OperationExecutor.contract.interface.encodeFunctionData(
          'executeOp',
          [closeStrategy.transaction.calls, closeStrategy.transaction.operationName],
        ),
      },
      signer,
      '',
    )

    const userCollateralBalanceAfterTx = await getBalanceOf(user, collateralToken.address)

    const feeRecipientBalanceAfterTx = await getBalanceOf(
      ADDRESSES[Network.MAINNET].common.FeeRecipient,
      addresses['WETH'],
      debtToken.precision,
    )

    const expectedBalance = userCollateralBalanceBeforeTx.plus(
      currentPosition.collateral.amount.minus(closeStrategy.simulation.swap.fromTokenAmount),
    )
    const feeWalletChange = feeRecipientBalanceAfterTx.minus(feeRecipientBalanceBeforeTx)

    // The precision of the two comparison amounts has been lowered to 8.
    // This is because in the time between us getting the current position
    // And executing the transaction, the collateral accrues interest.
    // When we withdraw the collateral with the MAX_UINT flag we get a different collateral amount
    // To the amount we had earlier after querying the position
    // By lowering the sensitivity of the comparison we can avoid this issue
    expect.toBeEqual(
      // Actual
      amountFromWei(userCollateralBalanceAfterTx).toFixed(8),
      // Expected
      amountFromWei(expectedBalance).toFixed(8),
      undefined,
      EXPECT_DEBT_BEING_PAID_BACK,
    )
    expect(closeStrategy.simulation.swap.tokenFee.gt(feeWalletChange), EXPECT_FEE_BEING_COLLECTED)
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