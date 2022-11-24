import { JsonRpcProvider } from '@ethersproject/providers'
import { ADDRESSES, OPERATION_NAMES, strategies } from '@oasisdex/oasis-actions'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { loadFixture } from 'ethereum-waffle'
import { Contract, Signer } from 'ethers'

import { executeThroughProxy } from '../../helpers/deploy'
import { resetNodeToLatestBlock } from '../../helpers/init'
import { restoreSnapshot } from '../../helpers/restoreSnapshot'
import { getOneInchCall } from '../../helpers/swap/OneIchCall'
import { oneInchCallMock } from '../../helpers/swap/OneInchCallMock'
import { RuntimeConfig } from '../../helpers/types/common'
import { amountToWei } from '../../helpers/utils'
import { zero } from '../../scripts/common'
import { deploySystem } from '../deploySystem'
import { initialiseConfig } from '../fixtures/setup'
import { expectToBe, expectToBeEqual } from '../utils'

describe(`Strategy | AAVE | Reopen Position`, async () => {
  const depositAmount = amountToWei(new BigNumber(10))
  const multiple = new BigNumber(2)
  const slippage = new BigNumber(0.5)

  let provider: JsonRpcProvider
  let config: RuntimeConfig
  let signer: Signer

  let dependencies: Pick<
    Parameters<typeof strategies.aave.openStEth>[1],
    'dsProxy' | 'provider' | 'addresses' | 'getSwapData'
  >
  let operationExecutor: Contract

  const mainnetAddresses = {
    DAI: ADDRESSES.main.DAI,
    ETH: ADDRESSES.main.ETH,
    WETH: ADDRESSES.main.WETH,
    stETH: ADDRESSES.main.stETH,
    aaveProtocolDataProvider: ADDRESSES.main.aave.DataProvider,
    chainlinkEthUsdPriceFeed: ADDRESSES.main.chainlinkEthUsdPriceFeed,
    aavePriceOracle: ADDRESSES.main.aavePriceOracle,
    aaveLendingPool: ADDRESSES.main.aave.MainnetLendingPool,
  }

  before(async () => {
    ;({ config, provider, signer } = await loadFixture(initialiseConfig))
  })

  describe('On forked chain', () => {
    const testBlockWithSufficientLiquidityInUswapPool = 15690000

    before(async () => {
      const snapshot = await restoreSnapshot(
        config,
        provider,
        testBlockWithSufficientLiquidityInUswapPool,
        true,
        false,
      )

      const system = snapshot.deployed.system

      const addresses = {
        ...mainnetAddresses,
        operationExecutor: system.common.operationExecutor.address,
      }

      operationExecutor = system.common.operationExecutor

      dependencies = {
        addresses,
        provider,
        getSwapData: oneInchCallMock(new BigNumber(0.9759)),
        dsProxy: system.common.dsProxy.address,
      }
    })

    it('Should open new position', async () => {
      const beforeTransaction = await strategies.aave.getCurrentStEthEthPosition(
        { proxyAddress: dependencies.dsProxy },
        { ...dependencies },
      )

      expectToBeEqual(
        beforeTransaction.collateral.amount,
        zero,
        undefined,
        'Position should be empty at the beginning',
      )

      const openStrategy = await strategies.aave.openStEth(
        {
          depositAmount,
          slippage,
          multiple,
        },
        {
          ...dependencies,
          currentPosition: beforeTransaction,
        },
      )

      const [transactionStatus] = await executeThroughProxy(
        dependencies.dsProxy,
        {
          address: operationExecutor.address,
          calldata: operationExecutor.interface.encodeFunctionData('executeOp', [
            openStrategy.calls,
            OPERATION_NAMES.aave.OPEN_POSITION,
          ]),
        },
        signer,
        depositAmount.toString(),
      )

      const afterTransaction = await strategies.aave.getCurrentStEthEthPosition(
        { proxyAddress: dependencies.dsProxy },
        { ...dependencies },
      )

      expect(transactionStatus, 'Transaction should pass.').to.be.true
      expectToBe(
        afterTransaction.collateral.amount,
        'gte',
        openStrategy.simulation.position.collateral.amount,
        'Collateral cannot be smaller than simulation. Can be greater because of slippage',
      )
      expectToBeEqual(afterTransaction.debt.amount, openStrategy.simulation.position.debt.amount)
    })

    it('Should close opened position', async () => {
      const beforeTransaction = await strategies.aave.getCurrentStEthEthPosition(
        { proxyAddress: dependencies.dsProxy },
        { ...dependencies },
      )

      expectToBe(
        beforeTransaction.collateral.amount,
        'gt',
        zero,
        'Position should exist at the beginning',
      )

      const closeStrategy = await strategies.aave.closeStEth(
        {
          stEthAmountLockedInAave: beforeTransaction.collateral.amount,
          slippage,
        },
        {
          ...dependencies,
          position: beforeTransaction,
        },
      )

      const [closeTxStatus] = await executeThroughProxy(
        dependencies.dsProxy,
        {
          address: operationExecutor.address,
          calldata: operationExecutor.interface.encodeFunctionData('executeOp', [
            closeStrategy.calls,
            OPERATION_NAMES.common.CUSTOM_OPERATION,
          ]),
        },
        signer,
        '0',
      )

      expect(closeTxStatus, 'Transaction should pass.').to.be.true

      const afterTransaction = await strategies.aave.getCurrentStEthEthPosition(
        { proxyAddress: dependencies.dsProxy },
        { ...dependencies },
      )

      expectToBe(
        afterTransaction.collateral.amount,
        'lte',
        new BigNumber(2),
        'Position could have max 2 wei left',
      )
      expectToBeEqual(afterTransaction.debt.amount, zero)
    })

    it('Should re-open closed position', async () => {
      const beforeTransaction = await strategies.aave.getCurrentStEthEthPosition(
        { proxyAddress: dependencies.dsProxy },
        { ...dependencies },
      )

      expectToBe(
        beforeTransaction.collateral.amount,
        'lte',
        new BigNumber(2),
        'Position could have max 2 wei left if is closed',
      )

      const reopenStrategy = await strategies.aave.openStEth(
        {
          depositAmount,
          slippage,
          multiple,
        },
        {
          ...dependencies,
          currentPosition: beforeTransaction,
        },
      )

      const [transactionStatus] = await executeThroughProxy(
        dependencies.dsProxy,
        {
          address: operationExecutor.address,
          calldata: operationExecutor.interface.encodeFunctionData('executeOp', [
            reopenStrategy.calls,
            OPERATION_NAMES.aave.OPEN_POSITION,
          ]),
        },
        signer,
        depositAmount.toFixed(0),
      )

      const afterTransaction = await strategies.aave.getCurrentStEthEthPosition(
        { proxyAddress: dependencies.dsProxy },
        { ...dependencies },
      )

      expect(transactionStatus, 'Transaction should pass.').to.be.true
      expectToBe(
        afterTransaction.collateral.amount,
        'gte',
        reopenStrategy.simulation.position.collateral.amount,
        'Collateral cannot be smaller than simulation. Can be greater because of slippage',
      )
    })
  })

  describe('Should close position with real oneInch', () => {
    const slippage = new BigNumber(0.1)

    before(async function () {
      const shouldRun1InchTests = process.env.RUN_1INCH_TESTS === '1'
      if (shouldRun1InchTests) {
        await resetNodeToLatestBlock(provider)
        const { system } = await deploySystem(config, false, false)

        const addresses = {
          ...mainnetAddresses,
          operationExecutor: system.common.operationExecutor.address,
        }

        operationExecutor = system.common.operationExecutor

        dependencies = {
          addresses,
          provider,
          getSwapData: getOneInchCall(system.common.swap.address),
          dsProxy: system.common.dsProxy.address,
        }
      } else {
        this.skip()
      }
    })

    it('Should open new position', async () => {
      const beforeTransaction = await strategies.aave.getCurrentStEthEthPosition(
        { proxyAddress: dependencies.dsProxy },
        { ...dependencies },
      )

      expectToBeEqual(
        beforeTransaction.collateral.amount,
        zero,
        undefined,
        'Position should be empty at the beginning',
      )

      const openStrategy = await strategies.aave.openStEth(
        {
          depositAmount,
          slippage,
          multiple,
        },
        {
          ...dependencies,
          currentPosition: beforeTransaction,
        },
      )

      const [transactionStatus] = await executeThroughProxy(
        dependencies.dsProxy,
        {
          address: operationExecutor.address,
          calldata: operationExecutor.interface.encodeFunctionData('executeOp', [
            openStrategy.calls,
            OPERATION_NAMES.aave.OPEN_POSITION,
          ]),
        },
        signer,
        depositAmount.toString(),
      )

      const afterTransaction = await strategies.aave.getCurrentStEthEthPosition(
        { proxyAddress: dependencies.dsProxy },
        { ...dependencies },
      )

      expect(transactionStatus, 'Transaction should pass.').to.be.true
      expectToBe(
        afterTransaction.collateral.amount,
        'gte',
        openStrategy.simulation.position.collateral.amount,
        'Collateral cannot be smaller than simulation. Can be greater because of slippage',
      )
      expectToBeEqual(afterTransaction.debt.amount, openStrategy.simulation.position.debt.amount)
    })

    it('Should close opened position', async () => {
      const beforeTransaction = await strategies.aave.getCurrentStEthEthPosition(
        { proxyAddress: dependencies.dsProxy },
        { ...dependencies },
      )

      expectToBe(
        beforeTransaction.collateral.amount,
        'gt',
        zero,
        'Position should exist at the beginning',
      )

      const closeStrategy = await strategies.aave.closeStEth(
        {
          stEthAmountLockedInAave: beforeTransaction.collateral.amount,
          slippage,
        },
        {
          ...dependencies,
          position: beforeTransaction,
        },
      )

      const [closeTxStatus] = await executeThroughProxy(
        dependencies.dsProxy,
        {
          address: operationExecutor.address,
          calldata: operationExecutor.interface.encodeFunctionData('executeOp', [
            closeStrategy.calls,
            OPERATION_NAMES.common.CUSTOM_OPERATION,
          ]),
        },
        signer,
        '0',
      )

      expect(closeTxStatus, 'Transaction should pass.').to.be.true

      const afterTransaction = await strategies.aave.getCurrentStEthEthPosition(
        { proxyAddress: dependencies.dsProxy },
        { ...dependencies },
      )

      expectToBe(
        afterTransaction.collateral.amount,
        'lte',
        new BigNumber(2),
        'Position could have max 2 wei left',
      )
      expectToBeEqual(afterTransaction.debt.amount, zero)
    })

    it('Should re-open closed position', async () => {
      const beforeTransaction = await strategies.aave.getCurrentStEthEthPosition(
        { proxyAddress: dependencies.dsProxy },
        { ...dependencies },
      )

      expectToBe(
        beforeTransaction.collateral.amount,
        'lte',
        new BigNumber(2),
        'Position could have max 2 wei left if is closed',
      )

      const reopenStrategy = await strategies.aave.openStEth(
        {
          depositAmount,
          slippage,
          multiple,
        },
        {
          ...dependencies,
          currentPosition: beforeTransaction,
        },
      )

      const [transactionStatus] = await executeThroughProxy(
        dependencies.dsProxy,
        {
          address: operationExecutor.address,
          calldata: operationExecutor.interface.encodeFunctionData('executeOp', [
            reopenStrategy.calls,
            OPERATION_NAMES.aave.OPEN_POSITION,
          ]),
        },
        signer,
        depositAmount.toFixed(0),
      )

      const afterTransaction = await strategies.aave.getCurrentStEthEthPosition(
        { proxyAddress: dependencies.dsProxy },
        { ...dependencies },
      )

      expect(transactionStatus, 'Transaction should pass.').to.be.true
      expectToBe(
        afterTransaction.collateral.amount,
        'gte',
        reopenStrategy.simulation.position.collateral.amount,
        'Collateral cannot be smaller than simulation. Can be greater because of slippage',
      )
    })
  })
})
