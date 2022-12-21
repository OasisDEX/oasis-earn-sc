import { strategies } from '@oasisdex/oasis-actions'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { loadFixture } from 'ethereum-waffle'

import { executeThroughDPMProxy, executeThroughProxy } from '../../helpers/deploy'
import { amountToWei, balanceOf } from '../../helpers/utils'
import { zero } from '../../scripts/common'
import {
  getSupportedStrategies,
  getSystemWithAAVEPosition,
  SystemWithAAVEPosition,
} from '../fixtures'
import { expectToBe } from '../utils'
describe('Strategy | AAVE | Payback/Withdraw', async () => {
  let fixture: SystemWithAAVEPosition
  const supportedStrategies = getSupportedStrategies()
  before(async () => {
    fixture = await loadFixture(getSystemWithAAVEPosition)
  })
  describe('Payback debt', () => {
    describe('When position is opened with DSProxy', () => {
      it('Should reduce debt', async () => {
        const { dsProxyPosition, strategiesDependencies, system, config } = fixture
        const beforeTransactionPosition = await dsProxyPosition.getPosition()

        type PaybackDebtTypes = Parameters<typeof strategies.aave.paybackWithdraw>
        const args: PaybackDebtTypes[0] = {
          debtToken: beforeTransactionPosition.debt,
          collateralToken: beforeTransactionPosition.collateral,
          amountDebtToPaybackInBaseUnit: amountToWei(
            new BigNumber(1),
            beforeTransactionPosition.debt.precision,
          ),
          amountCollateralToWithdrawInBaseUnit: zero,
          slippage: new BigNumber(0.1),
        }
        const paybackDebtSimulation = await strategies.aave.paybackWithdraw(args, {
          ...strategiesDependencies,
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
          const { strategiesDependencies, system, config, dpmPositions } = fixture

          const position = dpmPositions[strategy]
          if (!position) {
            this.skip()
          }
          const beforeTransactionPosition = await position.getPosition()

          type PaybackDebtTypes = Parameters<typeof strategies.aave.paybackWithdraw>
          const args: PaybackDebtTypes[0] = {
            debtToken: beforeTransactionPosition.debt,
            collateralToken: beforeTransactionPosition.collateral,
            amountDebtToPaybackInBaseUnit: amountToWei(
              new BigNumber(1),
              beforeTransactionPosition.debt.precision,
            ),
            amountCollateralToWithdrawInBaseUnit: zero,
            slippage: new BigNumber(0.1),
          }
          const paybackDebtSimulation = await strategies.aave.paybackWithdraw(args, {
            ...strategiesDependencies,
            isDPMProxy: true,
            proxy: position.proxy,
            currentPosition: beforeTransactionPosition,
          })

          const transactionValue =
            beforeTransactionPosition.debt.symbol === 'ETH'
              ? amountToWei(new BigNumber(1), beforeTransactionPosition.debt.precision).toString()
              : '0'

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
          isDPMProxy: false,
          proxy: dsProxyPosition.proxy,
          currentPosition: beforeTransactionPosition,
        })

        const transactionValue =
          beforeTransactionPosition.collateral.symbol === 'ETH'
            ? amountToWei(
                new BigNumber(1),
                beforeTransactionPosition.collateral.precision,
              ).toString()
            : '0'

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
          transactionValue,
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

          const position = dpmPositions[strategy]
          if (!position) {
            this.skip()
          }
          const beforeTransactionPosition = await position.getPosition()

          const beforeTransactionCollateralBalance = await balanceOf(
            beforeTransactionPosition.collateral.address,
            config.address,
            { config, isFormatted: true },
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
            isDPMProxy: true,
            proxy: position.proxy,
            currentPosition: beforeTransactionPosition,
          })

          const transactionValue =
            beforeTransactionPosition.collateral.symbol === 'ETH'
              ? amountToWei(
                  new BigNumber(1),
                  beforeTransactionPosition.collateral.precision,
                ).toString()
              : '0'

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
            transactionValue,
          )

          const afterTransactionPosition = await position.getPosition()

          const afterTransactionBalance = await balanceOf(
            beforeTransactionPosition.collateral.address,
            config.address,
            { config, isFormatted: true },
          )

          expect(status).to.be.true
          expectToBe(
            afterTransactionPosition.collateral.amount,
            'lt',
            beforeTransactionPosition.collateral.amount,
          )
          expectToBe(afterTransactionBalance, 'gt', beforeTransactionCollateralBalance)
        })
      })
    })
  })
})
