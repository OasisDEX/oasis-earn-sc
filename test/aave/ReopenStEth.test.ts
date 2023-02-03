import { JsonRpcProvider } from '@ethersproject/providers'
import {
  AAVEStrategyAddresses,
  AaveVersion,
  ONE,
  OPERATION_NAMES,
  protocols,
  RiskRatio,
  strategies,
} from '@oasisdex/oasis-actions/src'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { loadFixture } from 'ethereum-waffle'
import { Contract, Signer } from 'ethers'

import { executeThroughProxy } from '../../helpers/deploy'
import { resetNodeToLatestBlock } from '../../helpers/init'
import { restoreSnapshot } from '../../helpers/restoreSnapshot'
import { getOneInchCall } from '../../helpers/swap/OneInchCall'
import { oneInchCallMock } from '../../helpers/swap/OneInchCallMock'
import { RuntimeConfig } from '../../helpers/types/common'
import { amountToWei } from '../../helpers/utils'
import { aaveV2UniqueContractName } from '../../packages/oasis-actions/src/protocols/aave/config'
import { zero } from '../../scripts/common'
import { mainnetAddresses } from '../addresses'
import { testBlockNumber } from '../config'
import { deploySystem } from '../deploySystem'
import { initialiseConfig } from '../fixtures'
import { expectToBe, expectToBeEqual } from '../utils'

// TODO: This tests are mostly failing. Either we fix them or remove.
describe(`Strategy | AAVE | Reopen Position`, async () => {
  const depositAmountInWei = amountToWei(new BigNumber(1))
  const multiple = new RiskRatio(new BigNumber(2), RiskRatio.TYPE.MULITPLE)
  const slippage = new BigNumber(0.1)
  const debtToken = { symbol: 'ETH' as const, precision: 18 }
  const collateralToken = { symbol: 'STETH' as const, precision: 18 }

  let provider: JsonRpcProvider
  let config: RuntimeConfig
  let signer: Signer

  let dependencies: Pick<
    Parameters<typeof strategies.aave.open>[1],
    'proxy' | 'provider' | 'addresses' | 'protocol' | 'getSwapData' | 'user'
  >
  let addresses: AAVEStrategyAddresses

  let operationExecutor: Contract

  before(async () => {
    ;({ config, provider, signer } = await loadFixture(initialiseConfig))
  })

  describe('On forked chain', () => {
    before(async () => {
      const { snapshot } = await restoreSnapshot({
        config,
        provider,
        useFallbackSwap: true,
        blockNumber: testBlockNumber,
      })

      const system = snapshot.deployed.system

      addresses = {
        ...mainnetAddresses,
        priceOracle: mainnetAddresses.aave.v2.priceOracle,
        lendingPool: mainnetAddresses.aave.v2.lendingPool,
        protocolDataProvider: mainnetAddresses.aave.v2.protocolDataProvider,
        operationExecutor: system.common.operationExecutor.address,
      }

      operationExecutor = system.common.operationExecutor

      if (!(aaveV2UniqueContractName in dependencies.addresses)) {
        throw new Error('Aave v2 addresses not found')
      }
      dependencies = {
        addresses,
        provider,
        protocol: {
          version: AaveVersion.v2,
          getCurrentPosition: strategies.aave.view,
          getProtocolData: protocols.aave.getAaveProtocolData,
        },
        getSwapData: oneInchCallMock(new BigNumber(0.9759)),
        proxy: system.common.dsProxy.address,
        user: config.address,
      }
    })

    it('Should open new position', async () => {
      const beforeTransaction = await strategies.aave.view(
        { proxy: dependencies.proxy, debtToken, collateralToken },
        { ...dependencies, addresses, protocolVersion: AaveVersion.v2 },
      )

      expectToBeEqual(
        beforeTransaction.collateral.amount,
        zero,
        undefined,
        'Position should be empty at the beginning',
      )

      const openPositionTransition = await strategies.aave.open(
        {
          depositedByUser: {
            debtToken: { amountInBaseUnit: depositAmountInWei },
          },
          slippage,
          multiple,
          debtToken,
          collateralToken,
          positionType: 'Earn',
        },
        {
          ...dependencies,
          isDPMProxy: false,
        },
      )

      const [transactionStatus] = await executeThroughProxy(
        dependencies.proxy,
        {
          address: operationExecutor.address,
          calldata: operationExecutor.interface.encodeFunctionData('executeOp', [
            openPositionTransition.transaction.calls,
            openPositionTransition.transaction.operationName,
          ]),
        },
        signer,
        depositAmountInWei.toString(),
      )

      const afterTransaction = await strategies.aave.view(
        { proxy: dependencies.proxy, debtToken, collateralToken },
        { ...dependencies, addresses, protocolVersion: AaveVersion.v2 },
      )

      expect(transactionStatus, 'Transaction should pass.').to.be.true
      expectToBe(
        afterTransaction.collateral.amount,
        'gte',
        openPositionTransition.simulation.position.collateral.amount,
        'Collateral cannot be smaller than simulation. Can be greater because of slippage',
      )
      expectToBeEqual(
        afterTransaction.debt.amount,
        openPositionTransition.simulation.position.debt.amount,
      )
    })

    it('Should close opened position', async () => {
      const beforeTransaction = await strategies.aave.view(
        { proxy: dependencies.proxy, debtToken, collateralToken },
        { ...dependencies, addresses, protocolVersion: AaveVersion.v2 },
      )

      expectToBe(
        beforeTransaction.collateral.amount,
        'gt',
        zero,
        'Position should exist at the beginning',
      )
      const mockMarketPriceOnClose = ONE.div(new BigNumber(0.9759))
      const closePositionTransition = await strategies.aave.close(
        {
          collateralAmountLockedInProtocolInWei: beforeTransaction.collateral.amount,
          debtToken,
          collateralToken,
          slippage,
        },
        {
          ...dependencies,
          addresses,
          isDPMProxy: false,
          currentPosition: beforeTransaction,
          getSwapData: oneInchCallMock(mockMarketPriceOnClose, {
            from: collateralToken.precision,
            to: debtToken.precision,
          }),
        },
      )

      const [closeTxStatus] = await executeThroughProxy(
        dependencies.proxy,
        {
          address: operationExecutor.address,
          calldata: operationExecutor.interface.encodeFunctionData('executeOp', [
            closePositionTransition.transaction.calls,
            OPERATION_NAMES.common.CUSTOM_OPERATION,
          ]),
        },
        signer,
        '0',
      )

      expect(closeTxStatus, 'Transaction should pass.').to.be.true

      const afterTransaction = await strategies.aave.view(
        { proxy: dependencies.proxy, debtToken, collateralToken },
        { ...dependencies, addresses, protocolVersion: AaveVersion.v2 },
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
      const beforeTransaction = await strategies.aave.view(
        { proxy: dependencies.proxy, debtToken, collateralToken },
        { ...dependencies, addresses, protocolVersion: AaveVersion.v2 },
      )

      expectToBe(
        beforeTransaction.collateral.amount,
        'lte',
        new BigNumber(2),
        'Position could have max 2 wei left if is closed',
      )

      const reopenPositionTransition = await strategies.aave.open(
        {
          depositedByUser: {
            debtToken: { amountInBaseUnit: depositAmountInWei },
          },
          slippage,
          multiple,
          debtToken,
          collateralToken,
          positionType: 'Earn',
        },
        {
          ...dependencies,
          isDPMProxy: false,
        },
      )

      const [transactionStatus] = await executeThroughProxy(
        dependencies.proxy,
        {
          address: operationExecutor.address,
          calldata: operationExecutor.interface.encodeFunctionData('executeOp', [
            reopenPositionTransition.transaction.calls,
            reopenPositionTransition.transaction.operationName,
          ]),
        },
        signer,
        depositAmountInWei.toFixed(0),
      )

      const afterTransaction = await strategies.aave.view(
        { proxy: dependencies.proxy, debtToken, collateralToken },
        { ...dependencies, addresses, protocolVersion: AaveVersion.v2 },
      )

      expect(transactionStatus, 'Transaction should pass.').to.be.true
      expectToBe(
        afterTransaction.collateral.amount,
        'gte',
        reopenPositionTransition.simulation.position.collateral.amount,
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

        addresses = {
          ...mainnetAddresses,
          priceOracle: mainnetAddresses.aave.v2.priceOracle,
          lendingPool: mainnetAddresses.aave.v2.lendingPool,
          protocolDataProvider: mainnetAddresses.aave.v2.protocolDataProvider,
          operationExecutor: system.common.operationExecutor.address,
        }

        operationExecutor = system.common.operationExecutor

        dependencies = {
          addresses,
          provider,
          protocol: {
            version: AaveVersion.v2,
            getCurrentPosition: strategies.aave.view,
            getProtocolData: protocols.aave.getAaveProtocolData,
          },
          getSwapData: getOneInchCall(system.common.swap.address),
          proxy: system.common.dsProxy.address,
          user: config.address,
        }
      } else {
        this.skip()
      }
    })

    it('Should open new position', async () => {
      const beforeTransaction = await strategies.aave.view(
        { proxy: dependencies.proxy, debtToken, collateralToken },
        { ...dependencies, addresses, protocolVersion: AaveVersion.v2 },
      )

      expectToBeEqual(
        beforeTransaction.collateral.amount,
        zero,
        undefined,
        'Position should be empty at the beginning',
      )

      const openPositionTransition = await strategies.aave.open(
        {
          depositedByUser: {
            debtToken: { amountInBaseUnit: depositAmountInWei },
          },
          slippage,
          multiple,
          debtToken,
          collateralToken,
          positionType: 'Earn',
        },
        {
          ...dependencies,
          isDPMProxy: false,
        },
      )

      const [transactionStatus] = await executeThroughProxy(
        dependencies.proxy,
        {
          address: operationExecutor.address,
          calldata: operationExecutor.interface.encodeFunctionData('executeOp', [
            openPositionTransition.transaction.calls,
            OPERATION_NAMES.aave.v2.OPEN_POSITION,
          ]),
        },
        signer,
        depositAmountInWei.toString(),
      )

      const afterTransaction = await strategies.aave.view(
        { proxy: dependencies.proxy, debtToken, collateralToken },
        { ...dependencies, addresses, protocolVersion: AaveVersion.v2 },
      )

      expect(transactionStatus, 'Transaction should pass.').to.be.true
      expectToBe(
        afterTransaction.collateral.amount,
        'gte',
        openPositionTransition.simulation.position.collateral.amount,
        'Collateral cannot be smaller than simulation. Can be greater because of slippage',
      )
      expectToBeEqual(
        afterTransaction.debt.amount,
        openPositionTransition.simulation.position.debt.amount,
      )
    })

    it('Should close opened position', async () => {
      const beforeTransaction = await strategies.aave.view(
        { proxy: dependencies.proxy, debtToken, collateralToken },
        { ...dependencies, addresses, protocolVersion: AaveVersion.v2 },
      )

      expectToBe(
        beforeTransaction.collateral.amount,
        'gt',
        zero,
        'Position should exist at the beginning',
      )

      const closePositionTransition = await strategies.aave.close(
        {
          collateralAmountLockedInProtocolInWei: beforeTransaction.collateral.amount,
          slippage,
          debtToken,
          collateralToken,
        },
        {
          ...dependencies,
          addresses,
          isDPMProxy: false,
          currentPosition: beforeTransaction,
        },
      )

      const [closeTxStatus] = await executeThroughProxy(
        dependencies.proxy,
        {
          address: operationExecutor.address,
          calldata: operationExecutor.interface.encodeFunctionData('executeOp', [
            closePositionTransition.transaction.calls,
            closePositionTransition.transaction.operationName,
          ]),
        },
        signer,
        '0',
      )

      expect(closeTxStatus, 'Transaction should pass.').to.be.true

      const afterTransaction = await strategies.aave.view(
        { proxy: dependencies.proxy, debtToken, collateralToken },
        { ...dependencies, addresses, protocolVersion: AaveVersion.v2 },
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
      const beforeTransaction = await strategies.aave.view(
        { proxy: dependencies.proxy, debtToken, collateralToken },
        { ...dependencies, addresses, protocolVersion: AaveVersion.v2 },
      )

      expectToBe(
        beforeTransaction.collateral.amount,
        'lte',
        new BigNumber(2),
        'Position could have max 2 wei left if is closed',
      )

      const reopenPositionTransition = await strategies.aave.open(
        {
          depositedByUser: {
            debtToken: { amountInBaseUnit: depositAmountInWei },
          },
          slippage,
          multiple,
          debtToken,
          collateralToken,
          positionType: 'Earn',
        },
        {
          isDPMProxy: false,
          ...dependencies,
        },
      )

      const [transactionStatus] = await executeThroughProxy(
        dependencies.proxy,
        {
          address: operationExecutor.address,
          calldata: operationExecutor.interface.encodeFunctionData('executeOp', [
            reopenPositionTransition.transaction.calls,
            reopenPositionTransition.transaction.operationName,
          ]),
        },
        signer,
        depositAmountInWei.toFixed(0),
      )

      const afterTransaction = await strategies.aave.view(
        { proxy: dependencies.proxy, debtToken, collateralToken },
        { ...dependencies, addresses, protocolVersion: AaveVersion.v2 },
      )

      expect(transactionStatus, 'Transaction should pass.').to.be.true
      expectToBe(
        afterTransaction.collateral.amount,
        'gte',
        reopenPositionTransition.simulation.position.collateral.amount,
        'Collateral cannot be smaller than simulation. Can be greater because of slippage',
      )
    })
  })
})
