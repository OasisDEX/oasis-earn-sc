import { ADDRESSES, CONTRACT_NAMES, strategies, ZERO } from '@oasisdex/oasis-actions'
import { BigNumber } from 'bignumber.js'
import { expect } from 'chai'
import { loadFixture } from 'ethereum-waffle'
import assert from 'node:assert'
import { executeThroughProxy } from '../../helpers/deploy'
import { ServiceRegistry } from '../../helpers/serviceRegistry'
import { getOneInchCall } from '../../helpers/swap/OneInchCall'
import { balanceOf } from '../../helpers/utils'
import { getSystemWithAAVEPositions, SystemWithAAVEPositions } from '../fixtures'
import { expectToBeEqual } from '../utils'

// TODO: Probably create a mapping that will be used in tests for each underlying asset -> aToken, stable and variable debt token
const ETH = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const USDC_STABLE_DEBT = '0xE4922afAB0BbaDd8ab2a88E0C79d884Ad337fcA6'
const USDC_VARIABLE_DEBT = '0x619beb58998eD2278e08620f97007e1116D5D25b'
const stETH = '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84'
const astETH = '0x1982b2F5814301d4e9a8b0201555376e62F82428'
const aWETH = '0x030bA81f1c18d280636F32af80b9AAd02Cf0854e'
const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
const WETH_STABLE_DEBT = '0x4e977830ba4bd783C0BB7F15d3e243f73FF57121'
const WETH_VARIABLE_DEBT = '0xF63B34710400CAd3e044cFfDcAb00a0f32E33eCf'

// Description
// So what we'd like to do is to add ther 0.2% to the amount that is going to be swapped for the amount to cover debt
// The remaining value should be transferred to us instead of fee.
// There should be no fee applied on the swap.

// Finding:
// Basically  the amount that is shown when called `balanceOf` before a new block being mined will the display the same
// amount that's being depositted.
// Since I execute some operations on serviceRegistry and query the balance after that,
// it shows the deposited amount + interest rate
describe('Close Position to collateral', () => {
  const slippage = new BigNumber(0.002) // 0.2%
  let fixture: SystemWithAAVEPositions

  before(async () => {
    fixture = await loadFixture(getSystemWithAAVEPositions({ use1inch: true }))
  })

  it.skip('with debt token precision different than 18', async () => {
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
    const userCollateralBalanceBeforeTx = await getBalanceOf(user, ETH)
    const feeRecipientBalanceBeforeTx = await getBalanceOf(
      ADDRESSES.main.feeRecipient,
      addresses[debtToken.symbol],
      debtToken.precision,
    )

    const [, receipt] = await executeThroughProxy(
      fixture.system.common.dsProxy.address,
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

    console.log('Receipt', receipt.gasUsed.toString())

    const userCollateralBalanceAfterTx = await getBalanceOf(user, ETH)

    const expectedBalance = userCollateralBalanceBeforeTx.plus(
      currentPosition.collateral.amount.minus(closeStrategy.simulation.swap.fromTokenAmount),
    )
    // TODO somehow make this work for ETH. Even when I take into account the gas used in the tx it still doesn't add up.
    // expectToBeEqual(expectedBalance, userCollateralBalanceAfterTx)

    // TODO make this more configurable and based on the position
    const debtBalance = await getBalanceOf(proxy, USDC_VARIABLE_DEBT, 6)
    expectToBeEqual(debtBalance, ZERO)

    const feeRecipientBalanceAfterTx = await getBalanceOf(
      ADDRESSES.main.feeRecipient,
      addresses[debtToken.symbol],
      debtToken.precision,
    )
    expect(feeRecipientBalanceAfterTx.gt(feeRecipientBalanceBeforeTx)).to.be.true
  })

  it('with collateral token precision different than 18', async () => {
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
        isDPMProxy: false,
        shouldCloseToCollateral: true,
      },
    )
    const userCollateralBalanceBeforeTx = await getBalanceOf(user, ETH)
    const feeRecipientBalanceBeforeTx = await getBalanceOf(
      ADDRESSES.main.feeRecipient,
      addresses[debtToken.symbol],
      debtToken.precision,
    )

    const [, receipt] = await executeThroughProxy(
      fixture.system.common.dsProxy.address,
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

    console.log('Receipt', receipt.gasUsed.toString())

    const userCollateralBalanceAfterTx = await getBalanceOf(user, ETH)

    const expectedBalance = userCollateralBalanceBeforeTx.plus(
      currentPosition.collateral.amount.minus(closeStrategy.simulation.swap.fromTokenAmount),
    )
    // TODO somehow make this work for ETH. Even when I take into account the gas used in the tx it still doesn't add up.
    // expectToBeEqual(expectedBalance, userCollateralBalanceAfterTx)

    // TODO make this more configurable and based on the position
    const debtBalance = await getBalanceOf(proxy, USDC_VARIABLE_DEBT, 6)
    expectToBeEqual(debtBalance, ZERO)

    const feeRecipientBalanceAfterTx = await getBalanceOf(
      ADDRESSES.main.feeRecipient,
      addresses[debtToken.symbol],
      debtToken.precision,
    )
    expect(feeRecipientBalanceAfterTx.gt(feeRecipientBalanceBeforeTx)).to.be.true
  })

  async function printBalances(proxy: string, user: string) {
    await printBalance(ETH, 'ETH', user)
    await printBalance(WETH, 'WETH', user)
    await printBalance(WETH, 'WETH', proxy)
    await printBalance(USDC, 'USDC', user, 6)
    await printBalance(aWETH, 'aWETH', user)
    await printBalance(aWETH, 'aWETH', proxy)
    await printBalance(USDC_STABLE_DEBT, 'USDC_STABLE', proxy, 6)
    await printBalance(USDC_VARIABLE_DEBT, 'USDC_VARIABLE', proxy, 6)
    await printBalance(USDC, 'USDC', ADDRESSES.main.feeRecipient, 6)
  }
  async function printBalance(
    assetAddress: string,
    assetName: string,
    user: string,
    decimals = 18,
  ) {
    let balance = await balanceOf(assetAddress, user, {
      config: fixture.config,
      debug: false,
      isFormatted: false,
      decimals,
    })

    console.log(`Balance  ${assetName}: ${balance.toString()}`)
  }

  async function getBalanceOf(user: string, assetAddress: string, precision: number = 18) {
    return await balanceOf(assetAddress, user, {
      config: fixture.config,
      debug: false,
      isFormatted: false,
      decimals: precision,
    })
  }
})
