import assert from 'node:assert'

import { Network } from '@deploy-configurations/types/network'
import { ChainIdByNetwork } from '@deploy-configurations/utils/network'
import { ZERO } from '@dma-common/constants'
import {
  expect,
  getOneInchCall,
  optimismLiquidityProviders,
  resolveOneInchVersion,
} from '@dma-common/test-utils'
import { balanceOf } from '@dma-common/utils/balances'
import { amountFromWei, isMainnetByNetwork, isOptimismByNetwork } from '@dma-common/utils/common'
import { executeThroughDPMProxy, executeThroughProxy } from '@dma-common/utils/execute'
import { SystemWithAavePositions, systemWithAavePositions } from '@dma-contracts/test/fixtures'
import {
  getSupportedAaveV3Strategies,
  systemWithAaveV3Positions,
} from '@dma-contracts/test/fixtures/system/system-with-aave-v3-positions'
import { SystemWithAAVEV3Positions } from '@dma-contracts/test/fixtures/types/env'
import { strategies } from '@dma-library'
import BigNumber from 'bignumber.js'
import { loadFixture } from 'ethereum-waffle'

const networkFork = process.env.NETWORK_FORK as Network
const EXPECT_DEBT_BEING_PAID_BACK = 'Expect debt being paid back'
const EXPECT_FEE_BEING_COLLECTED = 'Expect fee being collected'

describe.skip('Close AAVEv2 Position to collateral | E2E', () => {
  const slippage = new BigNumber(0.01) // 1%
  let fixture: SystemWithAavePositions
  let feeRecipient: string

  before(async function () {
    // No AAVE V2 on Optimism
    if (isOptimismByNetwork(networkFork)) this.skip()
    fixture = await loadFixture(
      systemWithAavePositions({
        use1inch: true,
        configExtensionPaths: [`./test/swap.conf.ts`],
        network: networkFork,
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
        network: networkFork,
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
    expect.toBeEqual(debtBalance, ZERO, undefined, EXPECT_DEBT_BEING_PAID_BACK)

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
        network: networkFork,
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
        network: networkFork,
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

describe.skip('Close AAVEv3 Position to collateral', () => {
  const slippage = new BigNumber(0.01) // 1%
  let fixture: SystemWithAAVEV3Positions
  let feeRecipient: string

  const supportedStrategies = getSupportedAaveV3Strategies(networkFork)

  before(async function () {
    fixture = await loadFixture(
      systemWithAaveV3Positions({
        use1inch: true,
        network: networkFork,
        systemConfigPath: `./test/${networkFork}.conf.ts`,
        configExtensionPaths: [`./test/swap.conf.ts`],
      }),
    )
    feeRecipient = fixture.dsSystem.config.common.FeeRecipient.address
    if (!feeRecipient) throw new Error('Fee recipient is not set')
  })

  it('DPMProxy | Collateral - ETH ( 18 precision ) | Debt - USDC ( 6 precision )', async function () {
    const strategyName = 'ETH/USDC Multiply'
    const position = fixture.dpmPositions[strategyName]
    if (!supportedStrategies.find(s => s.name === strategyName)) {
      /*
       * If the strategy is not supported based on network then just skip
       * Rather than fail
       */
      this.skip()
    }
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
        network: networkFork,
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
    expect.toBeEqual(debtBalance, ZERO, undefined, EXPECT_DEBT_BEING_PAID_BACK)

    const feeRecipientBalanceAfterTx = await getBalanceOf(
      feeRecipient,
      addresses['USDC'],
      debtToken.precision,
    )

    expect(feeRecipientBalanceAfterTx.gt(feeRecipientBalanceBeforeTx), EXPECT_FEE_BEING_COLLECTED)
      .to.be.true
  })

  it('DPM | Collateral - WSTETH ( 18 precision ) | Debt - ETH ( 18 precision )', async function () {
    const strategyName = 'WSTETH/ETH Earn'
    const position = fixture.dpmPositions[strategyName]
    if (!supportedStrategies.find(s => s.name === strategyName)) {
      /*
       * If the strategy is not supported based on network then just skip
       * Rather than fail
       */
      this.skip()
    }
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
        network: networkFork,
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
