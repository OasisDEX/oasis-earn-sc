import { CONTRACT_NAMES, strategies } from '@oasisdex/oasis-actions'
import { BigNumber } from 'bignumber.js'
import { loadFixture } from 'ethereum-waffle'
import assert from 'node:assert'
import { executeThroughProxy } from '../../helpers/deploy'
import { ServiceRegistry } from '../../helpers/serviceRegistry'
import { getOneInchCall } from '../../helpers/swap/OneInchCall'
import { balanceOf } from '../../helpers/utils'
import { getSystemWithAAVEPositions, SystemWithAAVEPositions } from '../fixtures'

const ETH = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const USDC_STABLE_DEBT = '0xE4922afAB0BbaDd8ab2a88E0C79d884Ad337fcA6'
const USDC_VARIABLE_DEBT = '0x619beb58998eD2278e08620f97007e1116D5D25b'
const stETH = '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84'
const astETH = '0x1982b2F5814301d4e9a8b0201555376e62F82428'
const aWETH = '0x030bA81f1c18d280636F32af80b9AAd02Cf0854e'
const WETH_STABLE_DEBT = '0x4e977830ba4bd783C0BB7F15d3e243f73FF57121'
const WETH_VARIABLE_DEBT = '0xF63B34710400CAd3e044cFfDcAb00a0f32E33eCf'
// Description
// So what we'd like to do is to add ther 0.2% to the amount that is going to be swapped for the amount to cover debt
// The remaining value should be transferred to us instead of fee.
// There should be no fee applied on the swap.
describe('Close Position', () => {
  const slippage = new BigNumber(0.2)
  let fixture: SystemWithAAVEPositions

  beforeEach(async () => {
    fixture = await loadFixture(getSystemWithAAVEPositions({ use1inch: false }))
  })

  it('should close to debt token', async () => {
    const positionType = fixture.dsProxyPosition
    assert(positionType, 'Unsupported position type')
    const wallet = fixture.config.address
    const proxy = fixture.dsProxyPosition.proxy
    const position = await positionType.getPosition()
    const { serviceRegistry, swap } = fixture.system.common
    const registry = new ServiceRegistry(serviceRegistry.address, fixture.config.signer)

    await registry.removeEntry(CONTRACT_NAMES.common.SWAP)
    await registry.addEntry(CONTRACT_NAMES.common.SWAP, swap.address)

    await printBalances(proxy, wallet)

    const closeStrat = await strategies.aave.close(
      {
        collateralToken: {
          symbol: position.collateral.symbol,
          precision: position.collateral.precision,
        },
        debtToken: {
          symbol: position.debt.symbol,
          precision: position.debt.precision,
        },
        slippage,
        collateralAmountLockedInProtocolInWei: position.collateral.amount,
      },
      {
        addresses: fixture.strategiesDependencies.addresses,
        provider: fixture.config.provider,
        currentPosition: position,
        getSwapData: getOneInchCall(fixture.system.common.swap.address),
        proxy: positionType.proxy,
        user: fixture.config.address,
        isDPMProxy: false,
      },
    )

    await executeThroughProxy(
      fixture.system.common.dsProxy.address,
      {
        address: fixture.system.common.operationExecutor.address,
        calldata: fixture.system.common.operationExecutor.interface.encodeFunctionData(
          'executeOp',
          [closeStrat.transaction.calls, closeStrat.transaction.operationName],
        ),
      },
      fixture.config.signer,
      '',
    )

    console.log('-------------------------------------------')
    await printBalances(proxy, wallet)
  })

  // x * 0.2
  it.skip('should close to collateral token', async () => {
    const positionType = fixture.dsProxyPosition
    assert(positionType, 'Unsupported position type')
    const wallet = fixture.config.address
    const proxy = fixture.dsProxyPosition.proxy
    const position = await positionType.getPosition()

    await printBalances(proxy, wallet)

    const closeStrat = await strategies.aave.close(
      {
        collateralToken: {
          symbol: position.collateral.symbol,
        },
        debtToken: {
          symbol: position.debt.symbol,
        },
        slippage,
        collateralAmountLockedInProtocolInWei: position.collateral.amount,
      },
      {
        addresses: fixture.strategiesDependencies.addresses,
        provider: fixture.config.provider,
        currentPosition: position,
        getSwapData: getOneInchCall(fixture.system.common.swap.address),
        proxy: positionType.proxy,
        user: fixture.config.address,
        isDPMProxy: false,
      },
    )

    await executeThroughProxy(
      fixture.system.common.dsProxy.address,
      {
        address: fixture.system.common.operationExecutor.address,
        calldata: fixture.system.common.operationExecutor.interface.encodeFunctionData(
          'executeOp',
          [closeStrat.transaction.calls, closeStrat.transaction.operationName],
        ),
      },
      fixture.config.signer,
      '',
    )

    console.log('-------------------------------------------')
    await printBalances(proxy, wallet)
  })

  async function printBalances(proxy: string, wallet: string) {
    await printBalance(ETH, wallet)
    await printBalance(USDC, wallet, 6)
    await printBalance(stETH, wallet)
    await printBalance(astETH, proxy)
    await printBalance(aWETH, wallet)
    await printBalance(aWETH, proxy)
    await printBalance(WETH_STABLE_DEBT, proxy)
    await printBalance(WETH_VARIABLE_DEBT, proxy)
    await printBalance(USDC_STABLE_DEBT, proxy, 6)
    await printBalance(USDC_VARIABLE_DEBT, proxy, 6)
  }
  async function printBalance(asset: string, wallet: string, decimals = 18) {
    let balance = await balanceOf(asset, wallet, {
      config: fixture.config,
      debug: true,
      isFormatted: true,
      decimals,
    })

    console.log(`Balance  ${asset}: ${balance.toString()}`)
  }
})
