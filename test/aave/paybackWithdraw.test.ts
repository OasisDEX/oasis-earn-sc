import { strategies } from '@oasisdex/oasis-actions'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { loadFixture } from 'ethereum-waffle'

import { executeThroughDPMProxy, executeThroughProxy } from '../../helpers/deploy'
import { amountToWei, approve, balanceOf } from '../../helpers/utils'
import { zero } from '../../scripts/common'
import { mainnetAddresses } from '../addresses'
import {
  getSupportedStrategies,
  getSystemWithAavePositions,
  SystemWithAAVEPositions,
} from '../fixtures'
import { expectToBe, expectToBeEqual } from '../utils'

describe('Strategy | AAVE | Payback/Withdraw', async () => {
  let fixture: SystemWithAAVEPositions
  const supportedStrategies = getSupportedStrategies()

  before(async () => {
    fixture = await loadFixture(getSystemWithAavePositions({ use1inch: false }))
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

        type PaybackDebtTypes = Parameters<typeof strategies.aave.paybackWithdraw>
        const args: PaybackDebtTypes[0] = {
          debtToken: beforeTransactionPosition.debt,
          collateralToken: beforeTransactionPosition.collateral,
          amountDebtToPaybackInBaseUnit: amountToPayback,
          amountCollateralToWithdrawInBaseUnit: zero,
          slippage: new BigNumber(0.1),
        }

        if (
          beforeTransactionPosition.debt.symbol !== 'ETH' &&
          beforeTransactionPosition.debt.symbol !== 'WETH'
        ) {
          await getTokens(beforeTransactionPosition.debt.symbol, amountToPayback.toString())
          await approve(
            beforeTransactionPosition.debt.symbol,
            dsProxyPosition.proxy,
            args.amountDebtToPaybackInBaseUnit,
            config,
            false,
          )
        }

        const paybackDebtSimulation = await strategies.aave.paybackWithdraw(args, {
          ...strategiesDependencies,
          getSwapData: dsProxyPosition?.getSwapData,
          isDPMProxy: false,
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
            address: system.common.operationExecutor.address,
            calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
              paybackDebtSimulation.transaction.calls,
              paybackDebtSimulation.transaction.operationName,
            ]),
          },
          config.signer,
          transactionValue,
        )

        const afterTransactionPosition = await dsProxyPosition.getPosition()

        expect(status).to.be.true
        expectToBe(
          afterTransactionPosition.debt.amount,
          'lt',
          beforeTransactionPosition.debt.amount,
        )
      })
    })
    describe('When position is opened with DPM Proxy', async () => {
      supportedStrategies.forEach(strategy => {
        it(`Should reduce debt for ${strategy}`, async function () {
          const { strategiesDependencies, system, config, dpmPositions, getTokens } = fixture

          const position = dpmPositions[strategy]
          if (!position) {
            this.skip()
          }
          const beforeTransactionPosition = await position.getPosition()

          const amountToPayback = amountToWei(
            new BigNumber(1),
            beforeTransactionPosition.debt.precision,
          )

          type PaybackDebtTypes = Parameters<typeof strategies.aave.paybackWithdraw>
          const args: PaybackDebtTypes[0] = {
            debtToken: beforeTransactionPosition.debt,
            collateralToken: beforeTransactionPosition.collateral,
            amountDebtToPaybackInBaseUnit: amountToPayback,
            amountCollateralToWithdrawInBaseUnit: zero,
            slippage: new BigNumber(0.1),
          }
          const paybackDebtSimulation = await strategies.aave.paybackWithdraw(args, {
            ...strategiesDependencies,
            getSwapData: position?.getSwapData,
            isDPMProxy: true,
            proxy: position.proxy,
            currentPosition: beforeTransactionPosition,
          })

          if (
            beforeTransactionPosition.debt.symbol !== 'ETH' &&
            beforeTransactionPosition.debt.symbol !== 'WETH'
          ) {
            await getTokens(beforeTransactionPosition.debt.symbol, amountToPayback.toString())
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
              address: system.common.operationExecutor.address,
              calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
                paybackDebtSimulation.transaction.calls,
                paybackDebtSimulation.transaction.operationName,
              ]),
            },
            config.signer,
            transactionValue,
          )

          const afterTransactionPosition = await position.getPosition()

          expect(status).to.be.true
          expectToBe(
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

          type PaybackDebtTypes = Parameters<typeof strategies.aave.paybackWithdraw>
          const args: PaybackDebtTypes[0] = {
            debtToken: beforeTransactionPosition.debt,
            collateralToken: beforeTransactionPosition.collateral,
            amountDebtToPaybackInBaseUnit: amountToPayback,
            amountCollateralToWithdrawInBaseUnit: zero,
            slippage: new BigNumber(0.1),
          }
          const paybackDebtSimulation = await strategies.aave.paybackWithdraw(args, {
            ...strategiesDependencies,
            getSwapData: position?.getSwapData,
            isDPMProxy: true,
            proxy: position.proxy,
            currentPosition: beforeTransactionPosition,
          })

          if (
            beforeTransactionPosition.debt.symbol !== 'ETH' &&
            beforeTransactionPosition.debt.symbol !== 'WETH'
          ) {
            await getTokens(beforeTransactionPosition.debt.symbol, amountToPayback.toString())
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
              address: system.common.operationExecutor.address,
              calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
                paybackDebtSimulation.transaction.calls,
                paybackDebtSimulation.transaction.operationName,
              ]),
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

          expectToBeEqual(proxyBalanceOfDebt, zero, 2, 'Proxy balance of debt should be 0.')

          expectToBeEqual(
            afterTransactionPosition.debt.amount,
            zero,
            2,
            'Debt should be reduce to 0.',
          )
        })
      })
    })
  })

  describe('Withdraw collateral', () => {
    describe('When position is opened with DSProxy', () => {
      it('Should reduce collateral', async () => {
        const { dsProxyPosition, strategiesDependencies, system, config } = fixture
        const beforeTransactionPosition = await dsProxyPosition.getPosition()

        const beforeTransactionCollateralBalance = await balanceOf(
          beforeTransactionPosition.collateral.address,
          config.address,
          { config, isFormatted: false },
        )

        type WithdrawParameters = Parameters<typeof strategies.aave.paybackWithdraw>
        const args: WithdrawParameters[0] = {
          debtToken: beforeTransactionPosition.debt,
          collateralToken: beforeTransactionPosition.collateral,
          amountDebtToPaybackInBaseUnit: zero,
          amountCollateralToWithdrawInBaseUnit: amountToWei(
            new BigNumber(1),
            beforeTransactionPosition.collateral.precision,
          ),
          slippage: new BigNumber(0.1),
        }
        const withdrawSimulation = await strategies.aave.paybackWithdraw(args, {
          ...strategiesDependencies,
          getSwapData: dsProxyPosition?.getSwapData,
          isDPMProxy: false,
          proxy: dsProxyPosition.proxy,
          currentPosition: beforeTransactionPosition,
        })

        const [status] = await executeThroughProxy(
          dsProxyPosition.proxy,
          {
            address: system.common.operationExecutor.address,
            calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
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
        expectToBe(
          afterTransactionPosition.collateral.amount,
          'lt',
          beforeTransactionPosition.collateral.amount,
          'Amount of collateral after transaction is not less than before transaction',
        )
        expectToBe(
          afterTransactionBalance,
          'gt',
          beforeTransactionCollateralBalance,
          'Balance of collateral after transaction is not greater than before transaction',
        )
      })
    })
    describe('When position is opened with DPM Proxy', async () => {
      supportedStrategies.forEach(strategy => {
        it(`Should reduce collateral for ${strategy}`, async function () {
          const { strategiesDependencies, system, config, dpmPositions } = fixture

          const owner = await config.signer.getAddress()

          const position = dpmPositions[strategy]
          if (!position) {
            this.skip()
          }
          const beforeTransactionPosition = await position.getPosition()

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

          type WithdrawParameters = Parameters<typeof strategies.aave.paybackWithdraw>
          const args: WithdrawParameters[0] = {
            debtToken: beforeTransactionPosition.debt,
            collateralToken: beforeTransactionPosition.collateral,
            amountDebtToPaybackInBaseUnit: zero,
            amountCollateralToWithdrawInBaseUnit: amountToWithdraw,
            slippage: new BigNumber(0.1),
          }
          const withdrawSimulation = await strategies.aave.paybackWithdraw(args, {
            ...strategiesDependencies,
            getSwapData: position?.getSwapData,
            isDPMProxy: true,
            proxy: position.proxy,
            currentPosition: beforeTransactionPosition,
          })

          const [status] = await executeThroughDPMProxy(
            position.proxy,
            {
              address: system.common.operationExecutor.address,
              calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
                withdrawSimulation.transaction.calls,
                withdrawSimulation.transaction.operationName,
              ]),
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
          expectToBe(
            afterTransactionPosition.collateral.amount,
            'lt',
            beforeTransactionPosition.collateral.amount,
            'Amount of collateral after transaction is not less than before transaction',
          )

          expectToBe(
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

          type WithdrawParameters = Parameters<typeof strategies.aave.paybackWithdraw>
          const args: WithdrawParameters[0] = {
            debtToken: beforeTransactionPosition.debt,
            collateralToken: beforeTransactionPosition.collateral,
            amountDebtToPaybackInBaseUnit: zero,
            amountCollateralToWithdrawInBaseUnit: amountToWithdraw,
            slippage: new BigNumber(0.1),
          }
          const withdrawSimulation = await strategies.aave.paybackWithdraw(args, {
            ...strategiesDependencies,
            getSwapData: position?.getSwapData,
            isDPMProxy: true,
            proxy: position.proxy,
            currentPosition: beforeTransactionPosition,
          })

          const [status] = await executeThroughDPMProxy(
            position.proxy,
            {
              address: system.common.operationExecutor.address,
              calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
                withdrawSimulation.transaction.calls,
                withdrawSimulation.transaction.operationName,
              ]),
            },
            config.signer,
            '0',
          )

          const afterTransactionPosition = await position.getPosition()

          const afterTransactionBalance = await balanceOf(
            position?.collateralToken.address,
            owner,
            { config, isFormatted: false },
          )

          expect(status).to.be.true
          expectToBe(
            afterTransactionPosition.collateral.amount,
            'lt',
            beforeTransactionPosition.collateral.amount,
            'Amount of collateral after transaction is not less than before transaction',
          )

          expectToBe(
            afterTransactionBalance,
            'gt',
            beforeTransactionCollateralBalance,
            'Balance of collateral after transaction is not greater than before transaction',
          )

          expectToBe(
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

  describe.only('Close position using Payback and Withdraw', () => {
    describe('When position is opened with DSProxy', () => {
      it('Should payback all and withdraw all', async () => {
        const { dsProxyPosition, strategiesDependencies, system, config, getTokens } = fixture
        const beforeTransactionPosition = await dsProxyPosition.getPosition()

        const amountToPayback = beforeTransactionPosition.debtToPaybackAll

        const amountToWithdraw =
          beforeTransactionPosition.payback(amountToPayback).maxCollateralToWithdraw

        type WithdrawPayback = Parameters<typeof strategies.aave.paybackWithdraw>
        const args: WithdrawPayback[0] = {
          debtToken: beforeTransactionPosition.debt,
          collateralToken: beforeTransactionPosition.collateral,
          amountDebtToPaybackInBaseUnit: amountToPayback,
          amountCollateralToWithdrawInBaseUnit: amountToWithdraw,
          slippage: new BigNumber(0.1),
        }
        const withdrawPaybackSimulation = await strategies.aave.paybackWithdraw(args, {
          ...strategiesDependencies,
          getSwapData: dsProxyPosition?.getSwapData,
          isDPMProxy: false,
          proxy: dsProxyPosition.proxy,
          currentPosition: beforeTransactionPosition,
        })

        if (
          beforeTransactionPosition.debt.symbol !== 'ETH' &&
          beforeTransactionPosition.debt.symbol !== 'WETH'
        ) {
          await getTokens(
            beforeTransactionPosition.debt.symbol,
            beforeTransactionPosition.debt.amount.toString(),
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
            address: system.common.operationExecutor.address,
            calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
              withdrawPaybackSimulation.transaction.calls,
              withdrawPaybackSimulation.transaction.operationName,
            ]),
          },
          config.signer,
          transactionValue,
        )

        const afterTransactionPosition = await dsProxyPosition.getPosition()

        expect(status).to.be.true
        expectToBe(
          afterTransactionPosition.collateral.amount,
          'lte',
          new BigNumber(2),
          'Amount of collateral after transaction should be close to 0',
        )
        expectToBe(
          afterTransactionPosition.debt.amount,
          'lte',
          new BigNumber(2),
          'Amount of debt after transaction should be close to 0',
        )
      })
    })
    describe('When position is opened with DPM Proxy', () => {
      supportedStrategies.forEach(strategy => {
        it(`Should payback all and withdraw all for ${strategy}`, async function () {
          const { strategiesDependencies, system, config, dpmPositions, getTokens } = fixture

          const position = dpmPositions[strategy]

          if (position === undefined) {
            this.skip()
          }
          const beforeTransactionPosition = await position.getPosition()

          const collateralAddress = position?.collateralToken.address

          const beforeTransactionCollateralBalance = await balanceOf(
            collateralAddress,
            config.address,
            { config, isFormatted: false },
          )

          const amountToPayback = beforeTransactionPosition.debtToPaybackAll

          const amountToWithdraw =
            beforeTransactionPosition.payback(amountToPayback).maxCollateralToWithdraw

          type WithdrawPayback = Parameters<typeof strategies.aave.paybackWithdraw>
          const args: WithdrawPayback[0] = {
            debtToken: beforeTransactionPosition.debt,
            collateralToken: beforeTransactionPosition.collateral,
            amountDebtToPaybackInBaseUnit: amountToPayback,
            amountCollateralToWithdrawInBaseUnit: beforeTransactionPosition.collateral.amount,
            slippage: new BigNumber(0.1),
          }
          const withdrawPaybackSimulation = await strategies.aave.paybackWithdraw(args, {
            ...strategiesDependencies,
            getSwapData: position?.getSwapData,
            isDPMProxy: true,
            proxy: position.proxy,
            currentPosition: beforeTransactionPosition,
          })

          if (
            beforeTransactionPosition.debt.symbol !== 'ETH' &&
            beforeTransactionPosition.debt.symbol !== 'WETH'
          ) {
            await getTokens(beforeTransactionPosition.debt.symbol, amountToPayback.toString())
            await approve(
              beforeTransactionPosition.debt.address,
              position.proxy,
              amountToPayback,
              config,
              false,
            )
          }

          const transactionValue =
            beforeTransactionPosition.debt.symbol === 'ETH' ? amountToPayback.toString() : '0'

          const [status] = await executeThroughDPMProxy(
            position.proxy,
            {
              address: system.common.operationExecutor.address,
              calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
                withdrawPaybackSimulation.transaction.calls,
                withdrawPaybackSimulation.transaction.operationName,
              ]),
            },
            config.signer,
            transactionValue,
          )

          const afterTransactionPosition = await position.getPosition()

          const afterTransactionCollateralBalance = await balanceOf(
            collateralAddress,
            config.address,
            { config, isFormatted: false },
          )

          console.log(
            `Before Transaction Balance: ${beforeTransactionCollateralBalance.toString()}`,
          )
          console.log(`After Transaction Balance: ${afterTransactionCollateralBalance.toString()}`)
          console.log(`Amount to withdraw: ${amountToWithdraw.toString()}`)
          console.log(
            `Position collateral before transaction: ${beforeTransactionPosition.collateral.amount.toString()}`,
          )

          expect(status).to.be.true
          expectToBe(
            afterTransactionPosition.debt.amount,
            'lte',
            new BigNumber(2),
            'Amount of debt after transaction should be close to 0',
          )
          expectToBe(
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
