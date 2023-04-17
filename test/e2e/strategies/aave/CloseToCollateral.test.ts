import assert from 'node:assert'

import { executeThroughDPMProxy, executeThroughProxy } from '@helpers/deploy'
import { ChainIdByNetwork, Network } from '@helpers/network'
import {
  getOneInchCall,
  optimismLiquidityProviders,
  resolveOneInchVersion,
} from '@helpers/swap/OneInchCall'
import { amountFromWei, balanceOf } from '@helpers/utils'
import { strategies, ZERO } from '@oasisdex/oasis-actions/src'
import { BigNumber } from 'bignumber.js'
import { expect } from 'chai'
import { loadFixture } from 'ethereum-waffle'

import { getSystemWithAavePositions, SystemWithAAVEPositions } from '../../../fixtures'
import { getSystemWithAaveV3Positions } from '../../../fixtures/system/getSystemWithAaveV3Positions'
import { SystemWithAAVEV3Positions } from '../../../fixtures/types/systemWithAAVEPositions'
import { isMainnetByNetwork, isOptimismByNetwork } from '../../../test-utils/addresses'
import { expectToBeEqual } from '../../../utils'

const networkFork = process.env.NETWORK_FORK as Network
const EXPECT_DEBT_BEING_PAID_BACK = 'Expect debt being paid back'
const EXPECT_FEE_BEING_COLLECTED = 'Expect fee being collected'

describe('Close AAVEv2 Position to collateral', () => {
  const slippage = new BigNumber(0.01) // 1%
  let fixture: SystemWithAAVEPositions
  let feeRecipient: string

  before(async function () {
    // No AAVE V2 on Optimism
    if (isOptimismByNetwork(networkFork)) this.skip()
    fixture = await loadFixture(getSystemWithAavePositions({ use1inch: true }))
    feeRecipient = fixture.dsSystem.config.common.FeeRecipient.address
    if (!feeRecipient) throw new Error('Fee recipient is not set')
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
        positionType: position?.__positionType,
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
      feeRecipient,
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
    expectToBeEqual(debtBalance, ZERO, undefined, EXPECT_DEBT_BEING_PAID_BACK)

    const feeRecipientBalanceAfterTx = await getBalanceOf(
      feeRecipient,
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
        positionType: position?.__positionType,
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
      feeRecipient,
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
      feeRecipient,
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
        positionType: position?.__positionType,
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
      feeRecipient,
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
      feeRecipient,
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
    expectToBeEqual(
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
  let feeRecipient: string

  before(async () => {
    fixture = await loadFixture(
      getSystemWithAaveV3Positions({
        use1inch: true,
        network: networkFork,
        systemConfigPath: `./test-configs/${networkFork}.conf.ts`,
        configExtentionsPaths: [`./test-configs/swap.conf.ts`],
      }),
    )
    feeRecipient = fixture.dsSystem.config.common.FeeRecipient.address
    if (!feeRecipient) throw new Error('Fee recipient is not set')
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
        positionType: position?.__positionType,
      },
      {
        addresses,
        provider,
        currentPosition,
        getSwapData: getOneInchCall(
          fixture.system.Swap.contract.address,
          // We remove Balancer to avoid re-entrancy errors when also using Balancer FL
          isOptimismByNetwork(networkFork)
            ? optimismLiquidityProviders.filter(l => l !== 'OPTIMISM_BALANCER_V2')
            : [],
          ChainIdByNetwork[networkFork],
          resolveOneInchVersion(networkFork),
        ),
        proxy,
        user: fixture.config.address,
        isDPMProxy: true,
      },
    )

    const feeRecipientBalanceBeforeTx = await getBalanceOf(
      feeRecipient,
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

    const USDC_VARIABLE_DEBT_OPTIMISM = '0xFCCf3cAbbe80101232d343252614b6A3eE81C989'
    const USDC_VARIABLE_DEBT_MAINNET = '0x619beb58998eD2278e08620f97007e1116D5D25b'
    const USDC_VARIABLE_DEBT = isMainnetByNetwork(networkFork)
      ? USDC_VARIABLE_DEBT_MAINNET
      : USDC_VARIABLE_DEBT_OPTIMISM

    const debtBalance = await getBalanceOf(proxy, USDC_VARIABLE_DEBT, 6)
    expectToBeEqual(debtBalance, ZERO, undefined, EXPECT_DEBT_BEING_PAID_BACK)

    const feeRecipientBalanceAfterTx = await getBalanceOf(
      feeRecipient,
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
        positionType: position?.__positionType,
      },
      {
        addresses,
        provider,
        currentPosition,
        getSwapData: getOneInchCall(
          fixture.system.Swap.contract.address,
          // We remove Balancer to avoid re-entrancy errors when also using Balancer FL
          isOptimismByNetwork(networkFork)
            ? optimismLiquidityProviders.filter(l => l !== 'OPTIMISM_BALANCER_V2')
            : [],
          ChainIdByNetwork[networkFork],
          resolveOneInchVersion(networkFork),
        ),
        proxy,
        user: fixture.config.address,
        isDPMProxy: true,
      },
    )

    const userCollateralBalanceBeforeTx = await getBalanceOf(user, collateralToken.address)
    const feeRecipientBalanceBeforeTx = await getBalanceOf(
      feeRecipient,
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
      feeRecipient,
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
    expectToBeEqual(
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
