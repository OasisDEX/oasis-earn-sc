import { ZERO } from '@dma-common/constants'
import { addressesByNetwork, expect } from '@dma-common/test-utils'
import { balanceOf } from '@dma-common/utils/balances'
import { amountToWei, isOptimismByNetwork } from '@dma-common/utils/common'
import { executeThroughDPMProxy, executeThroughProxy } from '@dma-common/utils/execute'
import { approve } from '@dma-common/utils/tx'
import {
  getSupportedStrategies,
  SystemWithAavePositions,
  systemWithAavePositions,
} from '@dma-contracts/test/fixtures'
import { Network } from '@dma-deployments/types/network'
import { strategies } from '@dma-library'
import BigNumber from 'bignumber.js'

const mainnetAddresses = addressesByNetwork(Network.MAINNET)
const networkFork = process.env.NETWORK_FORK as Network

describe('Strategy | AAVE | Payback/Withdraw | E2E', async function () {
  let fixture: SystemWithAavePositions
  const supportedStrategies = getSupportedStrategies()

  before(async function () {
    if (isOptimismByNetwork(networkFork)) {
      this.skip()
    }
    const _fixture = await systemWithAavePositions({
      use1inch: false,
      configExtensionPaths: [`test/uSwap.conf.ts`],
    })()
    if (!_fixture) throw new Error('Failed to load fixture')
    fixture = _fixture
  })

  describe('Payback debt', () => {
    describe('When position is opened with DSProxy', () => {
      it('Should reduce debt', async () => {
        const { dsProxyPosition, strategiesDependencies, system, config, getTokens } = fixture
        const beforeTransactionPosition = await dsProxyPosition.getPosition()

        const amountToPayback = amountToWei(
          new BigNumber(1),
          beforeTransactionPosition.debt.precision,
        )

        type PaybackDebtTypes = Parameters<typeof strategies.aave.v2.paybackWithdraw>
        const args: PaybackDebtTypes[0] = {
          debtToken: beforeTransactionPosition.debt,
          collateralToken: beforeTransactionPosition.collateral,
          amountDebtToPaybackInBaseUnit: amountToPayback,
          amountCollateralToWithdrawInBaseUnit: ZERO,
          slippage: new BigNumber(0.1),
        }

        if (
          beforeTransactionPosition.debt.symbol !== 'ETH' &&
          beforeTransactionPosition.debt.symbol !== 'WETH'
        ) {
          await getTokens(beforeTransactionPosition.debt.symbol, amountToPayback)
          await approve(
            beforeTransactionPosition.debt.symbol,
            dsProxyPosition.proxy,
            args.amountDebtToPaybackInBaseUnit,
            config,
            false,
          )
        }

        const paybackDebtSimulation = await strategies.aave.v2.paybackWithdraw(args, {
          ...strategiesDependencies,
          proxy: dsProxyPosition.proxy,
          currentPosition: beforeTransactionPosition,
        })

        const transactionValue =
          beforeTransactionPosition.debt.symbol === 'ETH'
            ? amountToWei(new BigNumber(1), beforeTransactionPosition.debt.precision).toString()
            : '0'

        const [status] = await executeThroughProxy(
          dsProxyPosition.proxy,
          {
            address: system.OperationExecutor.contract.address,
            calldata: system.OperationExecutor.contract.interface.encodeFunctionData('executeOp', [
              paybackDebtSimulation.transaction.calls,
              paybackDebtSimulation.transaction.operationName,
            ]),
          },
          config.signer,
          transactionValue,
        )

        const afterTransactionPosition = await dsProxyPosition.getPosition()

        expect(status).to.be.true
        expect.toBe(
          afterTransactionPosition.debt.amount,
          'lt',
          beforeTransactionPosition.debt.amount,
        )
      })
    })
    describe('When position is opened with DPM Proxy', async () => {
      supportedStrategies.forEach(({ name: strategy }) => {
        it(`Should reduce debt for ${strategy}`, async function () {
          const { strategiesDependencies, system, config, dpmPositions, getTokens } = fixture

          const position = dpmPositions[strategy]
          if (!position) {
            this.skip()
          }
          const beforeTransactionPosition = await position.getPosition()
          if (!beforeTransactionPosition) throw new Error('Position not found')

          const amountToPayback = amountToWei(
            new BigNumber(1),
            beforeTransactionPosition.debt.precision,
          )

          type PaybackDebtTypes = Parameters<typeof strategies.aave.v2.paybackWithdraw>
          const args: PaybackDebtTypes[0] = {
            debtToken: beforeTransactionPosition.debt,
            collateralToken: beforeTransactionPosition.collateral,
            amountDebtToPaybackInBaseUnit: amountToPayback,
            amountCollateralToWithdrawInBaseUnit: ZERO,
            slippage: new BigNumber(0.1),
          }
          const paybackDebtSimulation = await strategies.aave.v2.paybackWithdraw(args, {
            ...strategiesDependencies,
            proxy: position.proxy,
            currentPosition: beforeTransactionPosition,
          })

          if (
            beforeTransactionPosition.debt.symbol !== 'ETH' &&
            beforeTransactionPosition.debt.symbol !== 'WETH'
          ) {
            await getTokens(beforeTransactionPosition.debt.symbol, amountToPayback)
            await approve(
              mainnetAddresses.USDC, // for payback is always USDC or ETH
              position.proxy,
              args.amountDebtToPaybackInBaseUnit,
              config,
              false,
            )
          }

          const transactionValue =
            beforeTransactionPosition.debt.symbol === 'ETH' ? amountToPayback.toString() : '0'

          const [status] = await executeThroughDPMProxy(
            position.proxy,
            {
              address: system.OperationExecutor.contract.address,
              calldata: system.OperationExecutor.contract.interface.encodeFunctionData(
                'executeOp',
                [
                  paybackDebtSimulation.transaction.calls,
                  paybackDebtSimulation.transaction.operationName,
                ],
              ),
            },
            config.signer,
            transactionValue,
          )

          const afterTransactionPosition = await position.getPosition()

          expect(status).to.be.true
          expect.toBe(
            afterTransactionPosition.debt.amount,
            'lt',
            beforeTransactionPosition.debt.amount,
          )
        })
        it(`Should payback all debt for ${strategy}`, async function () {
          const { strategiesDependencies, system, config, dpmPositions, getTokens } = fixture

          const position = dpmPositions[strategy]
          if (!position) {
            this.skip()
          }
          const beforeTransactionPosition = await position.getPosition()

          const amountToPayback = beforeTransactionPosition.debtToPaybackAll

          type PaybackDebtTypes = Parameters<typeof strategies.aave.v2.paybackWithdraw>
          const args: PaybackDebtTypes[0] = {
            debtToken: beforeTransactionPosition.debt,
            collateralToken: beforeTransactionPosition.collateral,
            amountDebtToPaybackInBaseUnit: amountToPayback,
            amountCollateralToWithdrawInBaseUnit: ZERO,
            slippage: new BigNumber(0.1),
          }
          const paybackDebtSimulation = await strategies.aave.v2.paybackWithdraw(args, {
            ...strategiesDependencies,
            proxy: position.proxy,
            currentPosition: beforeTransactionPosition,
          })

          if (
            beforeTransactionPosition.debt.symbol !== 'ETH' &&
            beforeTransactionPosition.debt.symbol !== 'WETH'
          ) {
            await getTokens(beforeTransactionPosition.debt.symbol, amountToPayback)
            await approve(
              mainnetAddresses.USDC, // for payback is always USDC or ETH
              position.proxy,
              args.amountDebtToPaybackInBaseUnit,
              config,
              false,
            )
          }

          const transactionValue =
            beforeTransactionPosition.debt.symbol === 'ETH' ? amountToPayback.toString() : '0'

          const [status] = await executeThroughDPMProxy(
            position.proxy,
            {
              address: system.OperationExecutor.contract.address,
              calldata: system.OperationExecutor.contract.interface.encodeFunctionData(
                'executeOp',
                [
                  paybackDebtSimulation.transaction.calls,
                  paybackDebtSimulation.transaction.operationName,
                ],
              ),
            },
            config.signer,
            transactionValue,
          )

          const afterTransactionPosition = await position.getPosition()

          const proxyBalanceOfDebt = await balanceOf(
            afterTransactionPosition.debt.address,
            position.proxy,
            { config, isFormatted: false },
          )

          expect(status).to.be.true

          expect.toBeEqual(proxyBalanceOfDebt, ZERO, 2, 'Proxy balance of debt should be 0.')

          expect.toBeEqual(
            afterTransactionPosition.debt.amount,
            ZERO,
            2,
            'Debt should be reduce to 0.',
          )
        })
      })
    })
  })

  describe.skip('Withdraw collateral', () => {
    describe('When position is opened with DSProxy', () => {
      it('Should reduce collateral', async () => {
        const { dsProxyPosition, strategiesDependencies, system, config } = fixture
        const beforeTransactionPosition = await dsProxyPosition.getPosition()

        const beforeTransactionCollateralBalance = await balanceOf(
          beforeTransactionPosition.collateral.address,
          config.address,
          { config, isFormatted: false },
        )

        type WithdrawParameters = Parameters<typeof strategies.aave.v2.paybackWithdraw>
        const args: WithdrawParameters[0] = {
          debtToken: beforeTransactionPosition.debt,
          collateralToken: beforeTransactionPosition.collateral,
          amountDebtToPaybackInBaseUnit: ZERO,
          amountCollateralToWithdrawInBaseUnit: amountToWei(
            new BigNumber(1),
            beforeTransactionPosition.collateral.precision,
          ),
          slippage: new BigNumber(0.1),
        }
        const withdrawSimulation = await strategies.aave.v2.paybackWithdraw(args, {
          ...strategiesDependencies,
          proxy: dsProxyPosition.proxy,
          currentPosition: beforeTransactionPosition,
        })

        const [status] = await executeThroughProxy(
          dsProxyPosition.proxy,
          {
            address: system.OperationExecutor.contract.address,
            calldata: system.OperationExecutor.contract.interface.encodeFunctionData('executeOp', [
              withdrawSimulation.transaction.calls,
              withdrawSimulation.transaction.operationName,
            ]),
          },
          config.signer,
          '0',
        )

        const afterTransactionPosition = await dsProxyPosition.getPosition()

        const afterTransactionBalance = await balanceOf(
          beforeTransactionPosition.collateral.address,
          config.address,
          { config, isFormatted: false },
        )

        expect(status).to.be.true
        expect.toBe(
          afterTransactionPosition.collateral.amount,
          'lt',
          beforeTransactionPosition.collateral.amount,
          'Amount of collateral after transaction is not less than before transaction',
        )
        expect.toBe(
          afterTransactionBalance,
          'gt',
          beforeTransactionCollateralBalance,
          'Balance of collateral after transaction is not greater than before transaction',
        )
      })
    })
    describe('When position is opened with DPM Proxy', async () => {
      supportedStrategies.forEach(({ name: strategy }) => {
        it(`Should reduce collateral for ${strategy}`, async function () {
          const { strategiesDependencies, system, config, dpmPositions } = fixture

          const owner = await config.signer.getAddress()

          const position = dpmPositions[strategy]
          if (!position) {
            this.skip()
          }
          const beforeTransactionPosition = await position.getPosition()
          if (!beforeTransactionPosition) throw new Error('Position is not opened')

          const collateralAddress =
            beforeTransactionPosition.collateral.symbol === 'ETH'
              ? mainnetAddresses.ETH
              : beforeTransactionPosition.collateral.address

          const beforeTransactionCollateralBalance = await balanceOf(collateralAddress, owner, {
            config,
            isFormatted: false,
          })

          const amountToWithdraw = amountToWei(
            new BigNumber(1),
            beforeTransactionPosition.collateral.precision,
          )

          type WithdrawParameters = Parameters<typeof strategies.aave.v2.paybackWithdraw>
          const args: WithdrawParameters[0] = {
            debtToken: beforeTransactionPosition.debt,
            collateralToken: beforeTransactionPosition.collateral,
            amountDebtToPaybackInBaseUnit: ZERO,
            amountCollateralToWithdrawInBaseUnit: amountToWithdraw,
            slippage: new BigNumber(0.1),
          }
          const withdrawSimulation = await strategies.aave.v2.paybackWithdraw(args, {
            ...strategiesDependencies,
            proxy: position.proxy,
            currentPosition: beforeTransactionPosition,
          })

          const [status] = await executeThroughDPMProxy(
            position.proxy,
            {
              address: system.OperationExecutor.contract.address,
              calldata: system.OperationExecutor.contract.interface.encodeFunctionData(
                'executeOp',
                [
                  withdrawSimulation.transaction.calls,
                  withdrawSimulation.transaction.operationName,
                ],
              ),
            },
            config.signer,
            '0',
          )

          const afterTransactionPosition = await position.getPosition()

          const afterTransactionBalance = await balanceOf(collateralAddress, owner, {
            config,
            isFormatted: false,
          })

          expect(status).to.be.true
          expect.toBe(
            afterTransactionPosition.collateral.amount,
            'lt',
            beforeTransactionPosition.collateral.amount,
            'Amount of collateral after transaction is not less than before transaction',
          )

          expect.toBe(
            afterTransactionBalance,
            'gt',
            beforeTransactionCollateralBalance,
            'Balance of collateral after transaction is not greater than before transaction',
          )
        })
        it(`Should reduce collateral as much as possible for ${strategy}`, async function () {
          const { strategiesDependencies, system, config, dpmPositions } = fixture

          const position = dpmPositions[strategy]
          if (!position) {
            this.skip()
          }

          const owner = await config.signer.getAddress()

          const beforeTransactionPosition = await position.getPosition()

          const beforeTransactionCollateralBalance = await balanceOf(
            position?.collateralToken.address,
            owner,
            { config, isFormatted: false },
          )

          const amountToWithdraw = beforeTransactionPosition.maxCollateralToWithdraw

          type WithdrawParameters = Parameters<typeof strategies.aave.v2.paybackWithdraw>
          const args: WithdrawParameters[0] = {
            debtToken: beforeTransactionPosition.debt,
            collateralToken: beforeTransactionPosition.collateral,
            amountDebtToPaybackInBaseUnit: ZERO,
            amountCollateralToWithdrawInBaseUnit: amountToWithdraw,
            slippage: new BigNumber(0.1),
          }
          const withdrawSimulation = await strategies.aave.v2.paybackWithdraw(args, {
            ...strategiesDependencies,
            proxy: position.proxy,
            currentPosition: beforeTransactionPosition,
          })

          const [status] = await executeThroughDPMProxy(
            position.proxy,
            {
              address: system.OperationExecutor.contract.address,
              calldata: system.OperationExecutor.contract.interface.encodeFunctionData(
                'executeOp',
                [
                  withdrawSimulation.transaction.calls,
                  withdrawSimulation.transaction.operationName,
                ],
              ),
            },
            config.signer,
            '0',
          )

          const afterTransactionPosition = await position.getPosition()
          if (!afterTransactionPosition) throw new Error('Position is not found')

          const afterTransactionBalance = await balanceOf(
            position?.collateralToken.address,
            owner,
            { config, isFormatted: false },
          )

          expect(status).to.be.true
          expect.toBe(
            afterTransactionPosition.collateral.amount,
            'lt',
            beforeTransactionPosition.collateral.amount,
            'Amount of collateral after transaction is not less than before transaction',
          )

          expect.toBe(
            afterTransactionBalance,
            'gt',
            beforeTransactionCollateralBalance,
            'Balance of collateral after transaction is not greater than before transaction',
          )

          expect.toBe(
            afterTransactionPosition.riskRatio.loanToValue
              .minus(afterTransactionPosition.category.maxLoanToValue)
              .abs(),
            'lte',
            new BigNumber(0.001),
            'LTV should be almost the max LTV',
          )
        })
      })
    })
  })

  describe.skip('Close position using Payback and Withdraw', () => {
    describe('When position is opened with DSProxy', () => {
      it('Should payback all and withdraw all', async () => {
        const { dsProxyPosition, strategiesDependencies, system, config, getTokens } = fixture
        const beforeTransactionPosition = await dsProxyPosition.getPosition()

        const amountToPayback = beforeTransactionPosition.debtToPaybackAll

        const amountToWithdraw =
          beforeTransactionPosition.payback(amountToPayback).maxCollateralToWithdraw

        type WithdrawPayback = Parameters<typeof strategies.aave.v2.paybackWithdraw>
        const args: WithdrawPayback[0] = {
          debtToken: beforeTransactionPosition.debt,
          collateralToken: beforeTransactionPosition.collateral,
          amountDebtToPaybackInBaseUnit: amountToPayback,
          amountCollateralToWithdrawInBaseUnit: amountToWithdraw,
          slippage: new BigNumber(0.1),
        }
        const withdrawPaybackSimulation = await strategies.aave.v2.paybackWithdraw(args, {
          ...strategiesDependencies,
          proxy: dsProxyPosition.proxy,
          currentPosition: beforeTransactionPosition,
        })

        if (
          beforeTransactionPosition.debt.symbol !== 'ETH' &&
          beforeTransactionPosition.debt.symbol !== 'WETH'
        ) {
          await getTokens(
            beforeTransactionPosition.debt.symbol,
            beforeTransactionPosition.debt.amount,
          )
          await approve(
            beforeTransactionPosition.debt.symbol,
            dsProxyPosition.proxy,
            beforeTransactionPosition.debt.amount,
            config,
            false,
          )
        }

        const transactionValue =
          beforeTransactionPosition.debt.symbol === 'ETH' ? amountToPayback.toString() : '0'

        const [status] = await executeThroughProxy(
          dsProxyPosition.proxy,
          {
            address: system.OperationExecutor.contract.address,
            calldata: system.OperationExecutor.contract.interface.encodeFunctionData('executeOp', [
              withdrawPaybackSimulation.transaction.calls,
              withdrawPaybackSimulation.transaction.operationName,
            ]),
          },
          config.signer,
          transactionValue,
        )

        const afterTransactionPosition = await dsProxyPosition.getPosition()

        expect(status).to.be.true
        expect.toBe(
          afterTransactionPosition.collateral.amount,
          'lte',
          new BigNumber(2),
          'Amount of collateral after transaction should be close to 0',
        )
        expect.toBe(
          afterTransactionPosition.debt.amount,
          'lte',
          new BigNumber(2),
          'Amount of debt after transaction should be close to 0',
        )
      })
    })
    describe('When position is opened with DPM Proxy', () => {
      supportedStrategies.forEach(({ name: strategy }) => {
        it(`Should payback all and withdraw all for ${strategy}`, async function () {
          const { strategiesDependencies, system, config, dpmPositions, getTokens } = fixture

          const position = dpmPositions[strategy]

          if (position === undefined) {
            this.skip()
          }
          const beforeTransactionPosition = await position.getPosition()

          const amountToPayback = beforeTransactionPosition.debtToPaybackAll

          type WithdrawPayback = Parameters<typeof strategies.aave.v2.paybackWithdraw>
          const args: WithdrawPayback[0] = {
            debtToken: beforeTransactionPosition.debt,
            collateralToken: beforeTransactionPosition.collateral,
            amountDebtToPaybackInBaseUnit: amountToPayback,
            amountCollateralToWithdrawInBaseUnit: beforeTransactionPosition.collateral.amount,
            slippage: new BigNumber(0.1),
          }
          const withdrawPaybackSimulation = await strategies.aave.v2.paybackWithdraw(args, {
            ...strategiesDependencies,
            proxy: position.proxy,
            currentPosition: beforeTransactionPosition,
          })

          if (
            beforeTransactionPosition.debt.symbol !== 'ETH' &&
            beforeTransactionPosition.debt.symbol !== 'WETH'
          ) {
            const roundedAmountToPayback = new BigNumber(amountToPayback.toFixed(0))
            await getTokens(beforeTransactionPosition.debt.symbol, roundedAmountToPayback)
            await approve(
              beforeTransactionPosition.debt.address,
              position.proxy,
              roundedAmountToPayback,
              config,
              false,
            )
          }

          const transactionValue =
            beforeTransactionPosition.debt.symbol === 'ETH' ? amountToPayback.toString() : '0'

          const [status] = await executeThroughDPMProxy(
            position.proxy,
            {
              address: system.OperationExecutor.contract.address,
              calldata: system.OperationExecutor.contract.interface.encodeFunctionData(
                'executeOp',
                [
                  withdrawPaybackSimulation.transaction.calls,
                  withdrawPaybackSimulation.transaction.operationName,
                ],
              ),
            },
            config.signer,
            transactionValue,
          )

          const afterTransactionPosition = await position.getPosition()
          if (!afterTransactionPosition) throw new Error('Position is undefined')

          expect(status).to.be.true
          expect.toBe(
            afterTransactionPosition.debt.amount,
            'lte',
            new BigNumber(2),
            'Amount of debt after transaction should be close to 0',
          )
          expect.toBe(
            afterTransactionPosition.collateral.amount,
            'lte',
            new BigNumber(2),
            'Amount of collateral after transaction should be close to 0',
          )
        })
      })
    })
  })
})
