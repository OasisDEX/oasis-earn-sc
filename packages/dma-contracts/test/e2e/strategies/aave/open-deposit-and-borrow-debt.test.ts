import { executeThroughDPMProxy, executeThroughProxy } from '@dma-common/utils/execute'
import { mainnetAddresses } from '@dma-contracts/test/addresses'
import { SystemWithProxies, systemWithProxies } from '@dma-contracts/test/fixtures'
import { ZERO } from '@oasisdex/dma-common/constants'
import { expect } from '@oasisdex/dma-common/test-utils'
import { amountToWei, approve } from '@oasisdex/dma-common/utils/common'
import { AAVETokens, strategies } from '@oasisdex/dma-library'
import BigNumber from 'bignumber.js'

export type TokenDetails = {
  symbol: AAVETokens
  precision: number
  address: string
}

// TODO: UPDATE TEST
describe.skip('Strategy | AAVE | Open Deposit and Borrow Debt | E2E', async () => {
  const ETH: TokenDetails = {
    symbol: 'ETH' as const,
    precision: 18,
    address: mainnetAddresses.ETH,
  }

  const STETH: TokenDetails = {
    symbol: 'STETH' as const,
    precision: 18,
    address: mainnetAddresses.STETH,
  }

  const WBTC: TokenDetails = {
    symbol: 'WBTC' as const,
    precision: 8,
    address: mainnetAddresses.WBTC,
  }

  const USDC: TokenDetails = {
    symbol: 'USDC' as const,
    precision: 6,
    address: mainnetAddresses.USDC,
  }
  const supportedCollaterals = [ETH, STETH, WBTC]
  describe('Deposit collateral', () => {
    let fixture: SystemWithProxies
    before(async () => {
      fixture = await systemWithProxies({ use1inch: false })
    })
    describe('using DS Proxy', () => {
      it('Should deposit collateral without taking debt', async () => {
        const { dsProxy, strategiesDependencies, system, config } = fixture

        const collateral = ETH
        const debt = USDC

        const amountToDeposit = amountToWei(new BigNumber(1), collateral.precision)

        type DepositBorrowArgs = Parameters<typeof strategies.aave.v2.openDepositAndBorrowDebt>
        const args: DepositBorrowArgs[0] = {
          debtToken: debt,
          collateralToken: collateral,
          amountCollateralToDepositInBaseUnit: amountToDeposit,
          amountDebtToBorrowInBaseUnit: ZERO,
          slippage: new BigNumber(0.1),
          positionType: 'Borrow',
        }

        const simulation = await strategies.aave.v2.openDepositAndBorrowDebt(args, {
          ...strategiesDependencies,
          isDPMProxy: false,
          proxy: dsProxy,
        })

        const transactionValue = amountToDeposit.toString()

        const [status] = await executeThroughProxy(
          dsProxy,
          {
            address: system.common.operationExecutor.address,
            calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
              simulation.transaction.calls,
              simulation.transaction.operationName,
            ]),
          },
          config.signer,
          transactionValue,
        )

        const afterTransactionPosition = await strategies.aave.v2.view(
          { collateralToken: collateral, debtToken: debt, proxy: dsProxy },
          { ...strategiesDependencies },
        )

        expect(status).to.be.true
        expect.toBeEqual(
          afterTransactionPosition.collateral.amount,
          amountToDeposit,
          10,
          'Collateral amount on protocol is not correct',
        )
      })
    })
    describe('Using DPM Proxy', async () => {
      supportedCollaterals.forEach((collateral, index) => {
        it(`Should deposit collateral ${collateral.symbol} without taking debt `, async function () {
          const { strategiesDependencies, system, config, dpmAccounts, getTokens } = fixture
          const debt = USDC

          const proxy = dpmAccounts[index]
          if (!proxy) {
            this.skip()
          }

          const amountToDeposit = amountToWei(new BigNumber(1), collateral.precision)

          if (collateral.symbol !== 'ETH' && collateral.symbol !== 'WETH') {
            await getTokens(collateral.symbol, amountToDeposit)
            await approve(collateral.address, proxy.proxy, amountToDeposit, config, false)
          }

          type DepositBorrowArgs = Parameters<typeof strategies.aave.v2.openDepositAndBorrowDebt>
          const args: DepositBorrowArgs[0] = {
            debtToken: debt,
            collateralToken: collateral,
            amountCollateralToDepositInBaseUnit: amountToDeposit,
            amountDebtToBorrowInBaseUnit: ZERO,
            slippage: new BigNumber(0.1),
            positionType: 'Borrow',
          }

          const simulation = await strategies.aave.v2.openDepositAndBorrowDebt(args, {
            ...strategiesDependencies,
            isDPMProxy: true,
            proxy: proxy.proxy,
          })

          const transactionValue = collateral.symbol === 'ETH' ? amountToDeposit.toString() : '0'

          const [status] = await executeThroughDPMProxy(
            proxy.proxy,
            {
              address: system.common.operationExecutor.address,
              calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
                simulation.transaction.calls,
                simulation.transaction.operationName,
              ]),
            },
            config.signer,
            transactionValue,
          )

          const afterTransactionPosition = await strategies.aave.v2.view(
            { collateralToken: collateral, debtToken: debt, proxy: proxy.proxy },
            { ...strategiesDependencies },
          )

          expect(status).to.be.true
          expect.toBeEqual(
            afterTransactionPosition.collateral.amount,
            amountToDeposit,
            10,
            'Collateral amount on protocol is not correct',
          )
        })
      })
    })
  })

  describe('Deposit collateral and borrow debt', () => {
    let fixture: SystemWithProxies
    before(async () => {
      fixture = await systemWithProxies({ use1inch: false })
    })
    describe('using DS Proxy', () => {
      it('Should deposit collateral and borrow debt', async () => {
        const { dsProxy, strategiesDependencies, system, config } = fixture

        const collateral = ETH
        const debt = USDC

        const amountToDeposit = amountToWei(new BigNumber(1), collateral.precision)
        const amountToBorrow = amountToWei(new BigNumber(100), debt.precision)

        type DepositBorrowArgs = Parameters<typeof strategies.aave.v2.openDepositAndBorrowDebt>
        const args: DepositBorrowArgs[0] = {
          debtToken: debt,
          collateralToken: collateral,
          amountCollateralToDepositInBaseUnit: amountToDeposit,
          amountDebtToBorrowInBaseUnit: amountToBorrow,
          slippage: new BigNumber(0.1),
          positionType: 'Borrow',
        }

        const simulation = await strategies.aave.v2.openDepositAndBorrowDebt(args, {
          ...strategiesDependencies,
          isDPMProxy: false,
          proxy: dsProxy,
        })

        const transactionValue = amountToDeposit.toString()

        const [status] = await executeThroughProxy(
          dsProxy,
          {
            address: system.common.operationExecutor.address,
            calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
              simulation.transaction.calls,
              simulation.transaction.operationName,
            ]),
          },
          config.signer,
          transactionValue,
        )

        const afterTransactionPosition = await strategies.aave.v2.view(
          { collateralToken: collateral, debtToken: debt, proxy: dsProxy },
          { ...strategiesDependencies },
        )

        expect(status).to.be.true
        expect.toBeEqual(
          afterTransactionPosition.collateral.amount,
          amountToDeposit,
          10,
          'Collateral amount on protocol is not correct',
        )
        expect.toBe(
          afterTransactionPosition.debt.amount.minus(amountToBorrow).abs(),
          'lte',
          new BigNumber(2),
          'Debt amount on protocol is not correct',
        )
      })
    })
    describe('Using DPM Proxy', async () => {
      supportedCollaterals.forEach((collateral, index) => {
        it(`Should deposit collateral ${collateral.symbol} and borrow debt`, async function () {
          const { dpmAccounts, strategiesDependencies, system, config, getTokens } = fixture

          const debt = USDC

          const proxy = dpmAccounts[index]
          if (!proxy) {
            this.skip()
          }

          const amountToDeposit = amountToWei(new BigNumber(1), collateral.precision)
          const amountToBorrow = amountToWei(new BigNumber(100), debt.precision)

          if (collateral.symbol !== 'ETH' && collateral.symbol !== 'WETH') {
            await getTokens(collateral.symbol, amountToDeposit)
            await approve(collateral.address, proxy.proxy, amountToDeposit, config, false)
          }

          type DepositBorrowArgs = Parameters<typeof strategies.aave.v2.openDepositAndBorrowDebt>
          const args: DepositBorrowArgs[0] = {
            debtToken: debt,
            collateralToken: collateral,
            amountCollateralToDepositInBaseUnit: amountToDeposit,
            amountDebtToBorrowInBaseUnit: amountToBorrow,
            slippage: new BigNumber(0.1),
            positionType: 'Borrow',
          }

          const simulation = await strategies.aave.v2.openDepositAndBorrowDebt(args, {
            ...strategiesDependencies,
            isDPMProxy: true,
            proxy: proxy.proxy,
          })

          const transactionValue = collateral.symbol === 'ETH' ? amountToDeposit.toString() : '0'

          const [status] = await executeThroughDPMProxy(
            proxy.proxy,
            {
              address: system.common.operationExecutor.address,
              calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
                simulation.transaction.calls,
                simulation.transaction.operationName,
              ]),
            },
            config.signer,
            transactionValue,
          )

          const afterTransactionPosition = await strategies.aave.v2.view(
            { collateralToken: collateral, debtToken: debt, proxy: proxy.proxy },
            { ...strategiesDependencies },
          )

          expect(status).to.be.true
          expect.toBeEqual(
            afterTransactionPosition.collateral.amount,
            amountToDeposit,
            10,
            'Collateral amount on protocol is not correct',
          )
          expect.toBe(
            afterTransactionPosition.debt.amount.minus(amountToBorrow).abs(),
            'lte',
            new BigNumber(2),
            'Debt amount on protocol is not correct',
          )
        })
      })
    })
  })
})
