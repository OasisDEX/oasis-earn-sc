import { Network } from '@deploy-configurations/types/network'
import { ONE, OPERATION_NAMES, ZERO } from '@dma-common/constants'
import {
  addressesByNetwork,
  deploySystem,
  expect,
  getOneInchCall,
  oneInchCallMock,
  restoreSnapshot,
} from '@dma-common/test-utils'
import { RuntimeConfig } from '@dma-common/types/common'
import { amountToWei } from '@dma-common/utils/common'
import { executeThroughProxy } from '@dma-common/utils/execute'
import { resetNodeToLatestBlock } from '@dma-common/utils/init'
import { testBlockNumber } from '@dma-contracts/test/config'
import { initialiseConfig } from '@dma-contracts/test/fixtures'
import { AAVEStrategyAddresses, strategies } from '@dma-library'
import { RiskRatio } from '@domain'
import { JsonRpcProvider } from '@ethersproject/providers'
import BigNumber from 'bignumber.js'
import { loadFixture } from 'ethereum-waffle'
import { Contract, Signer } from 'ethers'

const networkFork = process.env.NETWORK_FORK as Network

describe.skip(`Strategy | AAVE | Reopen Position | E2E`, async () => {
  const depositAmountInWei = amountToWei(new BigNumber(1))
  const multiple = new RiskRatio(new BigNumber(2), RiskRatio.TYPE.MULITPLE)
  const slippage = new BigNumber(0.1)
  const debtToken = { symbol: 'ETH' as const, precision: 18 }
  const collateralToken = { symbol: 'STETH' as const, precision: 18 }

  let provider: JsonRpcProvider
  let config: RuntimeConfig
  let signer: Signer

  let dependencies: Pick<
    Parameters<typeof strategies.aave.v2.open>[1],
    'proxy' | 'provider' | 'addresses' | 'getSwapData' | 'user'
  >
  let addresses: AAVEStrategyAddresses

  let operationExecutor: Contract

  const networkAddresses = addressesByNetwork(networkFork)

  before(async () => {
    ;({ config, provider, signer } = await loadFixture(initialiseConfig))
  })

  /* TODO: Fix close and reopen currently failing */
  describe.skip('On forked chain', () => {
    before(async () => {
      const { snapshot } = await restoreSnapshot({
        config,
        provider,
        useFallbackSwap: true,
        blockNumber: testBlockNumber,
      })

      const system = snapshot.deployed.system

      addresses = {
        ...networkAddresses,
        operationExecutor: system.common.operationExecutor.address,
      }

      operationExecutor = system.common.operationExecutor

      dependencies = {
        addresses,
        provider,
        getSwapData: oneInchCallMock(new BigNumber(0.9759)),
        proxy: system.common.dsProxy.address,
        user: config.address,
      }
    })

    it('Should open new position', async () => {
      const beforeTransaction = await strategies.aave.v2.view(
        { proxy: dependencies.proxy, debtToken, collateralToken },
        { ...dependencies, addresses },
      )

      expect.toBeEqual(
        beforeTransaction.collateral.amount,
        ZERO,
        undefined,
        'Position should be empty at the beginning',
      )

      const openPositionTransition = await strategies.aave.v2.open(
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
          network: networkFork,
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

      const afterTransaction = await strategies.aave.v2.view(
        { proxy: dependencies.proxy, debtToken, collateralToken },
        { ...dependencies, addresses },
      )

      expect(transactionStatus, 'Transaction should pass.').to.be.true
      expect.toBe(
        afterTransaction.collateral.amount,
        'gte',
        openPositionTransition.simulation.position.collateral.amount,
        'Collateral cannot be smaller than simulation. Can be greater because of slippage',
      )
      expect.toBeEqual(
        afterTransaction.debt.amount,
        openPositionTransition.simulation.position.debt.amount,
      )
    })

    it('Should close opened position', async () => {
      const beforeTransaction = await strategies.aave.v2.view(
        { proxy: dependencies.proxy, debtToken, collateralToken },
        { ...dependencies, addresses },
      )

      expect.toBe(
        beforeTransaction.collateral.amount,
        'gt',
        ZERO,
        'Position should exist at the beginning',
      )
      const mockMarketPriceOnClose = ONE.div(new BigNumber(0.9759))
      const closePositionTransition = await strategies.aave.v2.close(
        {
          debtToken,
          collateralToken,
          slippage,
          positionType: 'Earn',
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
          network: networkFork,
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

      const afterTransaction = await strategies.aave.v2.view(
        { proxy: dependencies.proxy, debtToken, collateralToken },
        { ...dependencies, addresses },
      )

      expect.toBe(
        afterTransaction.collateral.amount,
        'lte',
        new BigNumber(2),
        'Position could have max 2 wei left',
      )
      expect.toBeEqual(afterTransaction.debt.amount, ZERO)
    })

    it('Should re-open closed position', async () => {
      const beforeTransaction = await strategies.aave.v2.view(
        { proxy: dependencies.proxy, debtToken, collateralToken },
        { ...dependencies, addresses },
      )

      expect.toBe(
        beforeTransaction.collateral.amount,
        'lte',
        new BigNumber(2),
        'Position could have max 2 wei left if is closed',
      )

      const reopenPositionTransition = await strategies.aave.v2.open(
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
          network: networkFork,
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

      const afterTransaction = await strategies.aave.v2.view(
        { proxy: dependencies.proxy, debtToken, collateralToken },
        { ...dependencies, addresses },
      )

      expect(transactionStatus, 'Transaction should pass.').to.be.true
      expect.toBe(
        afterTransaction.collateral.amount,
        'gte',
        reopenPositionTransition.simulation.position.collateral.amount,
        'Collateral cannot be smaller than simulation. Can be greater because of slippage',
      )
    })
  })

  /* TODO: Fix close and reopen currently failing */
  describe.skip('Should close position with real oneInch', () => {
    const slippage = new BigNumber(0.1)

    before(async function () {
      await resetNodeToLatestBlock(provider)
      const { system } = await deploySystem(config, false, false)

      addresses = {
        ...networkAddresses,
        operationExecutor: system.common.operationExecutor.address,
      }

      operationExecutor = system.common.operationExecutor

      dependencies = {
        addresses,
        provider,
        getSwapData: getOneInchCall(system.common.swap.address),
        proxy: system.common.dsProxy.address,
        user: config.address,
      }
    })

    it('Should open new position', async () => {
      const beforeTransaction = await strategies.aave.v2.view(
        { proxy: dependencies.proxy, debtToken, collateralToken },
        { ...dependencies, addresses },
      )

      expect.toBeEqual(
        beforeTransaction.collateral.amount,
        ZERO,
        undefined,
        'Position should be empty at the beginning',
      )

      const openPositionTransition = await strategies.aave.v2.open(
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
          network: networkFork,
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

      const afterTransaction = await strategies.aave.v2.view(
        { proxy: dependencies.proxy, debtToken, collateralToken },
        { ...dependencies, addresses },
      )

      expect(transactionStatus, 'Transaction should pass.').to.be.true
      expect.toBe(
        afterTransaction.collateral.amount,
        'gte',
        openPositionTransition.simulation.position.collateral.amount,
        'Collateral cannot be smaller than simulation. Can be greater because of slippage',
      )
      expect.toBeEqual(
        afterTransaction.debt.amount,
        openPositionTransition.simulation.position.debt.amount,
      )
    })

    it('Should close opened position', async () => {
      const beforeTransaction = await strategies.aave.v2.view(
        { proxy: dependencies.proxy, debtToken, collateralToken },
        { ...dependencies, addresses },
      )

      expect.toBe(
        beforeTransaction.collateral.amount,
        'gt',
        ZERO,
        'Position should exist at the beginning',
      )

      const closePositionTransition = await strategies.aave.v2.close(
        {
          slippage,
          debtToken,
          collateralToken,
          positionType: 'Earn',
        },
        {
          ...dependencies,
          addresses,
          isDPMProxy: false,
          currentPosition: beforeTransaction,
          network: networkFork,
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

      const afterTransaction = await strategies.aave.v2.view(
        { proxy: dependencies.proxy, debtToken, collateralToken },
        { ...dependencies, addresses },
      )

      expect.toBe(
        afterTransaction.collateral.amount,
        'lte',
        new BigNumber(2),
        'Position could have max 2 wei left',
      )
      expect.toBeEqual(afterTransaction.debt.amount, ZERO)
    })

    it('Should re-open closed position', async () => {
      const beforeTransaction = await strategies.aave.v2.view(
        { proxy: dependencies.proxy, debtToken, collateralToken },
        { ...dependencies, addresses },
      )

      expect.toBe(
        beforeTransaction.collateral.amount,
        'lte',
        new BigNumber(2),
        'Position could have max 2 wei left if is closed',
      )

      const reopenPositionTransition = await strategies.aave.v2.open(
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
          network: networkFork,
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

      const afterTransaction = await strategies.aave.v2.view(
        { proxy: dependencies.proxy, debtToken, collateralToken },
        { ...dependencies, addresses },
      )

      expect(transactionStatus, 'Transaction should pass.').to.be.true
      expect.toBe(
        afterTransaction.collateral.amount,
        'gte',
        reopenPositionTransition.simulation.position.collateral.amount,
        'Collateral cannot be smaller than simulation. Can be greater because of slippage',
      )
    })
  })
})
