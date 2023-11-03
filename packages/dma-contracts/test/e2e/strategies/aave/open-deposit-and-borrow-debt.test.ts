import { Network } from '@deploy-configurations/types/network'
import { ZERO } from '@dma-common/constants'
import { addressesByNetwork, expect } from '@dma-common/test-utils'
import { amountToWei } from '@dma-common/utils/common'
import { executeThroughDPMProxy, executeThroughProxy } from '@dma-common/utils/execute'
import { approve } from '@dma-common/utils/tx'
import { SystemWithProxies, systemWithProxies } from '@dma-contracts/test/fixtures'
import { strategies } from '@dma-library'
import { AAVETokens } from '@dma-library/types'
import BigNumber from 'bignumber.js'

const mainnetAddresses = addressesByNetwork(Network.MAINNET)
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
  describe.skip('Deposit collateral', () => {
    let fixture: SystemWithProxies
    before(async () => {
      fixture = await systemWithProxies({ use1inch: false })
    })
    describe.skip('using DS Proxy', () => {
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
          network: Network.MAINNET,
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
    describe.skip('Using DPM Proxy', async () => {
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
            network: Network.MAINNET,
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

  describe.skip('Deposit collateral and borrow debt', () => {
    let fixture: SystemWithProxies
    before(async () => {
      fixture = await systemWithProxies({ use1inch: false })
    })
    describe.skip('using DS Proxy', () => {
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
          network: Network.MAINNET,
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
    describe.skip('Using DPM Proxy', async () => {
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
            network: Network.MAINNET,
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
