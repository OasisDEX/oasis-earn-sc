import { Network } from '@deploy-configurations/types/network'
import { ZERO } from '@dma-common/constants'
import { expect } from '@dma-common/test-utils'
import { balanceOf } from '@dma-common/utils/balances'
import { amountToWei, isOptimismByNetwork } from '@dma-common/utils/common'
import { executeThroughProxy } from '@dma-common/utils/execute'
import { approve } from '@dma-common/utils/tx/index'
import {
  getSupportedStrategies,
  SystemWithAavePositions,
  systemWithAavePositions,
  SystemWithAAVEV3Positions,
} from '@dma-contracts/test/fixtures'
import { USDC } from '@dma-contracts/test/fixtures/factories/common'
import {
  getSupportedAaveV3Strategies,
  systemWithAaveV3Positions,
} from '@dma-contracts/test/fixtures/system/system-with-aave-v3-positions'
import { strategies } from '@dma-library'
import BigNumber from 'bignumber.js'
import { loadFixture } from 'ethereum-waffle'

const networkFork = process.env.NETWORK_FORK as Network

describe.skip(`Strategy | AAVE | Deposit/Borrow | E2E`, async function () {
  describe.skip('Using AAVE V2', async function () {
    let env: SystemWithAavePositions
    const supportedStrategies = getSupportedStrategies()

    const systemFixture = systemWithAavePositions({
      use1inch: true,
      configExtensionPaths: [`test/swap.conf.ts`],
      hideLogging: true,
      network: networkFork,
    })

    beforeEach(async function () {
      if (isOptimismByNetwork(networkFork)) {
        this.skip()
      }

      const _env = await loadFixture(systemFixture)
      if (!_env) throw new Error('Failed to setup system')
      env = _env
    })

    describe.skip('Deposit collateral', () => {
      describe.skip('When position is opened with DSProxy', () => {
        it('Should increase collateral', async () => {
          const { dsProxyPosition, strategiesDependencies, dsSystem, config, getTokens } = env
          const beforeTransactionPosition = await dsProxyPosition.getPosition()

          const amount = new BigNumber(0.05)
          const amountToDeposit = amountToWei(
            amount,
            beforeTransactionPosition.collateral.precision,
          )
          const roundedAmountToDeposit = new BigNumber(amountToDeposit.toFixed(0))

          type DepositBorrowTypes = Parameters<typeof strategies.aave.v2.depositBorrow>
          const entryToken = beforeTransactionPosition.collateral
          const collateralToken = beforeTransactionPosition.collateral
          const debtToken = beforeTransactionPosition.debt
          const args: DepositBorrowTypes[0] = {
            entryToken,
            collateralToken,
            debtToken,
            amountCollateralToDepositInBaseUnit: roundedAmountToDeposit,
            amountDebtToBorrowInBaseUnit: ZERO,
            slippage: new BigNumber(0.1),
          }

          // Steal entry tokens before test
          if (entryToken.symbol !== 'ETH' && entryToken.symbol !== 'WETH') {
            // Inflated to make sure there's sufficient balance to cover swap back from entry to collateral
            const entryTokenAmountToGet = roundedAmountToDeposit.times(1.2)
            await getTokens.byImpersonate(entryToken.symbol as any, entryTokenAmountToGet)
            await approve(entryToken.address, dsProxyPosition.proxy, entryTokenAmountToGet, config)
          }

          const depositBorrowSimulation = await strategies.aave.v2.depositBorrow(args, {
            ...strategiesDependencies,
            getSwapData: env.strategiesDependencies.getSwapData(
              env.dsSystem.system.Swap.contract.address,
            ),
            proxy: dsProxyPosition.proxy,
            currentPosition: beforeTransactionPosition,
            network: networkFork,
          })

          const transactionValue =
            collateralToken.symbol === 'ETH'
              ? amountToWei(amount, collateralToken.precision).toString()
              : '0'

          const [status] = await executeThroughProxy(
            dsProxyPosition.proxy,
            {
              address: dsSystem.system.OperationExecutor.contract.address,
              calldata: dsSystem.system.OperationExecutor.contract.interface.encodeFunctionData(
                'executeOp',
                [
                  depositBorrowSimulation.transaction.calls,
                  depositBorrowSimulation.transaction.operationName,
                ],
              ),
            },
            config.signer,
            transactionValue,
          )

          if (!status) throw new Error('Transaction failed')

          const afterTransactionPosition = await dsProxyPosition.getPosition()

          expect(status).to.be.true
          expect.toBe(
            afterTransactionPosition.collateral.amount,
            'gt',
            beforeTransactionPosition.collateral.amount,
          )
        })
      })
      describe.skip('When position is opened with DPM Proxy', () => {
        supportedStrategies.forEach(({ name: strategy }) => {
          it(`Should increase collateral for ${strategy}`, async function () {
            const { strategiesDependencies, dsSystem, config, dpmPositions, getTokens } = env

            const position = dpmPositions[strategy]
            if (!position) {
              this.skip()
              throw new Error('Position not found')
            }
            const beforeTransactionPosition = await position.getPosition()
            if (!beforeTransactionPosition) throw new Error('Position not found')

            const entryToken = new USDC(strategiesDependencies.addresses)
            // Depositing 500 USDC as entry token which will be swapped to Coll token and then deposited
            const amountToDeposit = amountToWei(new BigNumber(500), entryToken.precision)
            const roundedAmountToDeposit = new BigNumber(amountToDeposit.toFixed(0))

            type DepositBorrowTypes = Parameters<typeof strategies.aave.v2.depositBorrow>
            const collateralToken = beforeTransactionPosition.collateral
            const debtToken = beforeTransactionPosition.debt
            const args: DepositBorrowTypes[0] = {
              entryToken,
              collateralToken,
              debtToken,
              amountCollateralToDepositInBaseUnit: roundedAmountToDeposit,
              amountDebtToBorrowInBaseUnit: ZERO,
              slippage: new BigNumber(0.1),
            }

            // Get USDC tokens
            // Inflated to make sure there's sufficient balance to cover swap back from entry to collateral
            const entryTokenAmountToGet = roundedAmountToDeposit.times(1.2)
            await getTokens.byImpersonate(entryToken.symbol, entryTokenAmountToGet)
            await approve(entryToken.address, position.proxy, entryTokenAmountToGet, config)

            const depositBorrowSimulation = await strategies.aave.v2.depositBorrow(args, {
              ...strategiesDependencies,
              getSwapData: env.strategiesDependencies.getSwapData(env.system.Swap.contract.address),
              proxy: position.proxy,
              currentPosition: beforeTransactionPosition,
              network: networkFork,
            })

            const transactionValue = '0'

            const [status] = await executeThroughProxy(
              position.proxy,
              {
                address: dsSystem.system.OperationExecutor.contract.address,
                calldata: dsSystem.system.OperationExecutor.contract.interface.encodeFunctionData(
                  'executeOp',
                  [
                    depositBorrowSimulation.transaction.calls,
                    depositBorrowSimulation.transaction.operationName,
                  ],
                ),
              },
              config.signer,
              transactionValue,
            )

            const afterTransactionPosition = await position.getPosition()

            expect(status).to.be.true
            expect.toBe(
              afterTransactionPosition.collateral.amount,
              'gt',
              beforeTransactionPosition.collateral.amount,
            )

            const proxyBalanceOfCollateral = await balanceOf(
              afterTransactionPosition.collateral.address,
              position.proxy,
              { config, isFormatted: false },
            )

            expect(status).to.be.true

            expect.toBeEqual(
              proxyBalanceOfCollateral,
              ZERO,
              2,
              'Proxy balance of collateral should be 0.',
            )
          })
        })
      })
    })
    describe.skip('Borrow more', () => {
      describe.skip('When position is opened with DSProxy', () => {
        it('Should borrow more', async () => {
          const { dsProxyPosition, strategiesDependencies, dsSystem, config } = env
          const beforeTransactionPosition = await dsProxyPosition.getPosition()

          const amountToBorrow = beforeTransactionPosition.debt.amount.times(0.1)
          const roundedAmountToBorrow = new BigNumber(amountToBorrow.toFixed(0))

          type DepositBorrowTypes = Parameters<typeof strategies.aave.v2.depositBorrow>
          const entryToken = beforeTransactionPosition.collateral
          const collateralToken = beforeTransactionPosition.collateral
          const debtToken = beforeTransactionPosition.debt
          const args: DepositBorrowTypes[0] = {
            entryToken,
            collateralToken,
            debtToken,
            amountCollateralToDepositInBaseUnit: ZERO,
            amountDebtToBorrowInBaseUnit: roundedAmountToBorrow,
            slippage: new BigNumber(0.1),
          }

          const depositBorrowSimulation = await strategies.aave.v2.depositBorrow(args, {
            ...strategiesDependencies,
            getSwapData: env.strategiesDependencies.getSwapData(
              env.dsSystem.system.Swap.contract.address,
            ),
            proxy: dsProxyPosition.proxy,
            currentPosition: beforeTransactionPosition,
            network: networkFork,
          })

          const transactionValue = '0'

          const [status] = await executeThroughProxy(
            dsProxyPosition.proxy,
            {
              address: dsSystem.system.OperationExecutor.contract.address,
              calldata: dsSystem.system.OperationExecutor.contract.interface.encodeFunctionData(
                'executeOp',
                [
                  depositBorrowSimulation.transaction.calls,
                  depositBorrowSimulation.transaction.operationName,
                ],
              ),
            },
            config.signer,
            transactionValue,
          )

          const afterTransactionPosition = await dsProxyPosition.getPosition()

          expect(status).to.be.true
          expect.toBe(
            afterTransactionPosition.debt.amount,
            'gt',
            beforeTransactionPosition.debt.amount,
          )
        })
      })
      describe.skip('When position is opened with DPM Proxy', () => {
        supportedStrategies.forEach(({ name: strategy }) => {
          it(`Should borrow more for ${strategy}`, async function () {
            const { strategiesDependencies, dsSystem, config, dpmPositions } = env

            const position = dpmPositions[strategy]
            if (!position) {
              this.skip()
              throw new Error('Position not found')
            }
            const beforeTransactionPosition = await position.getPosition()
            if (!beforeTransactionPosition) throw new Error('Position not found')

            const amountToBorrow = beforeTransactionPosition.debt.amount.times(0.1)
            const roundedAmountToBorrow = new BigNumber(amountToBorrow.toFixed(0))

            type DepositBorrowTypes = Parameters<typeof strategies.aave.v2.depositBorrow>
            const entryToken = beforeTransactionPosition.collateral
            const collateralToken = beforeTransactionPosition.collateral
            const debtToken = beforeTransactionPosition.debt
            const args: DepositBorrowTypes[0] = {
              entryToken,
              collateralToken,
              debtToken,
              amountCollateralToDepositInBaseUnit: ZERO,
              amountDebtToBorrowInBaseUnit: roundedAmountToBorrow,
              slippage: new BigNumber(0.1),
            }

            const depositBorrowSimulation = await strategies.aave.v2.depositBorrow(args, {
              ...strategiesDependencies,
              getSwapData: env.strategiesDependencies.getSwapData(
                env.dsSystem.system.Swap.contract.address,
              ),
              proxy: position.proxy,
              currentPosition: beforeTransactionPosition,
              network: networkFork,
            })

            const transactionValue = '0'

            const [status] = await executeThroughProxy(
              position.proxy,
              {
                address: dsSystem.system.OperationExecutor.contract.address,
                calldata: dsSystem.system.OperationExecutor.contract.interface.encodeFunctionData(
                  'executeOp',
                  [
                    depositBorrowSimulation.transaction.calls,
                    depositBorrowSimulation.transaction.operationName,
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
              'gt',
              beforeTransactionPosition.debt.amount,
            )

            const proxyBalanceOfDebt = await balanceOf(
              afterTransactionPosition.debt.address,
              position.proxy,
              { config, isFormatted: false },
            )

            expect(status).to.be.true

            expect.toBeEqual(proxyBalanceOfDebt, ZERO, 2, 'Proxy balance of debt should be 0.')
          })
        })
      })
    })
  })
  describe.skip('Using AAVE V3', async function () {
    let env: SystemWithAAVEV3Positions
    const supportedStrategies = getSupportedAaveV3Strategies()

    const systemFixture = systemWithAaveV3Positions({
      use1inch: true,
      network: networkFork,
      systemConfigPath: `test/${networkFork}.conf.ts`,
      configExtensionPaths: [`test/swap.conf.ts`],
      hideLogging: true,
    })

    beforeEach(async function () {
      const _env = await loadFixture(systemFixture)
      if (!_env) throw new Error('Failed to setup system')
      env = _env
    })

    describe.skip('Deposit collateral', () => {
      describe.skip('When position is opened with DSProxy', () => {
        it('Should increase collateral', async () => {
          const { dsProxyPosition, strategiesDependencies, dsSystem, config, getTokens } = env
          const beforeTransactionPosition = await dsProxyPosition.getPosition()

          const amountToDeposit = amountToWei(
            new BigNumber(0.05),
            beforeTransactionPosition.collateral.precision,
          )
          const roundedAmountToDeposit = new BigNumber(amountToDeposit.toFixed(0))

          type DepositBorrowTypes = Parameters<typeof strategies.aave.v3.depositBorrow>
          const entryToken = beforeTransactionPosition.collateral
          const collateralToken = beforeTransactionPosition.collateral
          const debtToken = beforeTransactionPosition.debt
          const args: DepositBorrowTypes[0] = {
            entryToken,
            collateralToken,
            debtToken,
            amountCollateralToDepositInBaseUnit: roundedAmountToDeposit,
            amountDebtToBorrowInBaseUnit: ZERO,
            slippage: new BigNumber(0.1),
          }

          if (entryToken.symbol !== 'ETH' && entryToken.symbol !== 'WETH') {
            await getTokens.byImpersonate(entryToken.symbol as any, roundedAmountToDeposit)
            await approve(entryToken.address, dsProxyPosition.proxy, roundedAmountToDeposit, config)
          }

          const depositBorrowSimulation = await strategies.aave.v3.depositBorrow(args, {
            ...strategiesDependencies,
            getSwapData: env.strategiesDependencies.getSwapData(env.system.Swap.contract.address),
            proxy: dsProxyPosition.proxy,
            currentPosition: beforeTransactionPosition,
            network: networkFork,
          })

          const transactionValue =
            collateralToken.symbol === 'ETH'
              ? amountToWei(new BigNumber(0.05), collateralToken.precision).toString()
              : '0'

          const [status] = await executeThroughProxy(
            dsProxyPosition.proxy,
            {
              address: dsSystem.system.OperationExecutor.contract.address,
              calldata: dsSystem.system.OperationExecutor.contract.interface.encodeFunctionData(
                'executeOp',
                [
                  depositBorrowSimulation.transaction.calls,
                  depositBorrowSimulation.transaction.operationName,
                ],
              ),
            },
            config.signer,
            transactionValue,
          )

          const afterTransactionPosition = await dsProxyPosition.getPosition()

          expect(status).to.be.true
          expect.toBe(
            afterTransactionPosition.collateral.amount,
            'gt',
            beforeTransactionPosition.collateral.amount,
          )
        })
      })
      describe.skip('When position is opened with DPM Proxy', () => {
        supportedStrategies.forEach(({ name: strategy }) => {
          it(`Should increase collateral for ${strategy}`, async function () {
            const { strategiesDependencies, dsSystem, config, dpmPositions } = env

            const position = dpmPositions[strategy]
            if (!position) {
              this.skip()
              throw new Error('Position not found')
            }
            const beforeTransactionPosition = await position.getPosition()
            if (!beforeTransactionPosition) throw new Error('Position not found')

            const amountToDeposit = amountToWei(
              new BigNumber(0.05),
              beforeTransactionPosition.collateral.precision,
            )
            const roundedAmountToDeposit = new BigNumber(amountToDeposit.toFixed(0))

            type DepositBorrowTypes = Parameters<typeof strategies.aave.v3.depositBorrow>
            const entryToken = beforeTransactionPosition.collateral
            const collateralToken = beforeTransactionPosition.collateral
            const debtToken = beforeTransactionPosition.debt
            const args: DepositBorrowTypes[0] = {
              entryToken,
              collateralToken,
              debtToken,
              amountCollateralToDepositInBaseUnit: roundedAmountToDeposit,
              amountDebtToBorrowInBaseUnit: ZERO,
              slippage: new BigNumber(0.1),
            }

            const depositBorrowSimulation = await strategies.aave.v3.depositBorrow(args, {
              ...strategiesDependencies,
              getSwapData: env.strategiesDependencies.getSwapData(env.system.Swap.contract.address),
              proxy: position.proxy,
              currentPosition: beforeTransactionPosition,
              network: networkFork,
            })

            const transactionValue =
              collateralToken.symbol === 'ETH' ? amountToDeposit.toString() : '0'

            const [status] = await executeThroughProxy(
              position.proxy,
              {
                address: dsSystem.system.OperationExecutor.contract.address,
                calldata: dsSystem.system.OperationExecutor.contract.interface.encodeFunctionData(
                  'executeOp',
                  [
                    depositBorrowSimulation.transaction.calls,
                    depositBorrowSimulation.transaction.operationName,
                  ],
                ),
              },
              config.signer,
              transactionValue,
            )

            const afterTransactionPosition = await position.getPosition()

            expect(status).to.be.true
            expect.toBe(
              afterTransactionPosition.collateral.amount,
              'gt',
              beforeTransactionPosition.collateral.amount,
            )

            const proxyBalanceOfCollateral = await balanceOf(
              afterTransactionPosition.collateral.address,
              position.proxy,
              { config, isFormatted: false },
            )

            expect(status).to.be.true

            expect.toBeEqual(
              proxyBalanceOfCollateral,
              ZERO,
              2,
              'Proxy balance of collateral should be 0.',
            )
          })
          it(`Should increase collateral w/ diff entry token for ${strategy}`, async function () {
            const { strategiesDependencies, dsSystem, config, dpmPositions, getTokens } = env

            const position = dpmPositions[strategy]
            if (!position) {
              this.skip()
              throw new Error('Position not found')
            }
            const beforeTransactionPosition = await position.getPosition()
            if (!beforeTransactionPosition) throw new Error('Position not found')

            const entryToken = new USDC(strategiesDependencies.addresses)
            // Depositing 500 USDC as entry token which will be swapped to Coll token and then deposited
            const amountToDeposit = amountToWei(new BigNumber(500), entryToken.precision)
            const roundedAmountToDeposit = new BigNumber(amountToDeposit.toFixed(0))

            type DepositBorrowTypes = Parameters<typeof strategies.aave.v3.depositBorrow>
            const collateralToken = beforeTransactionPosition.collateral
            const debtToken = beforeTransactionPosition.debt
            const args: DepositBorrowTypes[0] = {
              entryToken,
              collateralToken,
              debtToken,
              amountCollateralToDepositInBaseUnit: roundedAmountToDeposit,
              amountDebtToBorrowInBaseUnit: ZERO,
              slippage: new BigNumber(0.1),
            }

            // Get USDC tokens
            // Inflated to make sure there's sufficient balance to cover swap back from entry to collateral
            const entryTokenAmountToGet = roundedAmountToDeposit.times(1.2)
            await getTokens.byImpersonate(entryToken.symbol, entryTokenAmountToGet)
            await approve(entryToken.address, position.proxy, entryTokenAmountToGet, config)

            const depositBorrowSimulation = await strategies.aave.v3.depositBorrow(args, {
              ...strategiesDependencies,
              getSwapData: env.strategiesDependencies.getSwapData(env.system.Swap.contract.address),
              proxy: position.proxy,
              currentPosition: beforeTransactionPosition,
              network: networkFork,
            })

            const transactionValue = '0'

            const [status] = await executeThroughProxy(
              position.proxy,
              {
                address: dsSystem.system.OperationExecutor.contract.address,
                calldata: dsSystem.system.OperationExecutor.contract.interface.encodeFunctionData(
                  'executeOp',
                  [
                    depositBorrowSimulation.transaction.calls,
                    depositBorrowSimulation.transaction.operationName,
                  ],
                ),
              },
              config.signer,
              transactionValue,
            )

            const afterTransactionPosition = await position.getPosition()

            expect(status).to.be.true
            expect.toBe(
              afterTransactionPosition.collateral.amount,
              'gt',
              beforeTransactionPosition.collateral.amount,
            )

            const proxyBalanceOfCollateral = await balanceOf(
              afterTransactionPosition.collateral.address,
              position.proxy,
              { config, isFormatted: false },
            )

            expect(status).to.be.true

            expect.toBeEqual(
              proxyBalanceOfCollateral,
              ZERO,
              2,
              'Proxy balance of collateral should be 0.',
            )
          })
        })
      })
    })
    describe.skip('Borrow more', () => {
      describe.skip('When position is opened with DSProxy', () => {
        it('Should borrow more', async () => {
          const { dsProxyPosition, strategiesDependencies, dsSystem, config } = env
          const beforeTransactionPosition = await dsProxyPosition.getPosition()

          const amountToBorrow = beforeTransactionPosition.debt.amount.times(0.1)
          const roundedAmountToBorrow = new BigNumber(amountToBorrow.toFixed(0))

          type DepositBorrowTypes = Parameters<typeof strategies.aave.v3.depositBorrow>
          const entryToken = beforeTransactionPosition.collateral
          const collateralToken = beforeTransactionPosition.collateral
          const debtToken = beforeTransactionPosition.debt
          const args: DepositBorrowTypes[0] = {
            entryToken,
            collateralToken,
            debtToken,
            amountCollateralToDepositInBaseUnit: ZERO,
            amountDebtToBorrowInBaseUnit: roundedAmountToBorrow,
            slippage: new BigNumber(0.1),
          }

          const depositBorrowSimulation = await strategies.aave.v3.depositBorrow(args, {
            ...strategiesDependencies,
            getSwapData: env.strategiesDependencies.getSwapData(env.system.Swap.contract.address),
            proxy: dsProxyPosition.proxy,
            currentPosition: beforeTransactionPosition,
            network: networkFork,
          })

          const transactionValue = '0'

          const [status] = await executeThroughProxy(
            dsProxyPosition.proxy,
            {
              address: dsSystem.system.OperationExecutor.contract.address,
              calldata: dsSystem.system.OperationExecutor.contract.interface.encodeFunctionData(
                'executeOp',
                [
                  depositBorrowSimulation.transaction.calls,
                  depositBorrowSimulation.transaction.operationName,
                ],
              ),
            },
            config.signer,
            transactionValue,
          )

          const afterTransactionPosition = await dsProxyPosition.getPosition()

          expect(status).to.be.true
          expect.toBe(
            afterTransactionPosition.debt.amount,
            'gt',
            beforeTransactionPosition.debt.amount,
          )
        })
      })
      describe.skip('When position is opened with DPM Proxy', () => {
        supportedStrategies.forEach(({ name: strategy }) => {
          it(`Should borrow more for ${strategy}`, async function () {
            const { strategiesDependencies, dsSystem, config, dpmPositions } = env

            const position = dpmPositions[strategy]
            if (!position) {
              this.skip()
              throw new Error('Position not found')
            }
            const beforeTransactionPosition = await position.getPosition()
            if (!beforeTransactionPosition) throw new Error('Position not found')

            const amountToBorrow = beforeTransactionPosition.debt.amount.times(0.1)
            const roundedAmountToBorrow = new BigNumber(amountToBorrow.toFixed(0))

            type DepositBorrowTypes = Parameters<typeof strategies.aave.v3.depositBorrow>
            const entryToken = beforeTransactionPosition.collateral
            const collateralToken = beforeTransactionPosition.collateral
            const debtToken = beforeTransactionPosition.debt
            const args: DepositBorrowTypes[0] = {
              entryToken,
              collateralToken,
              debtToken,
              amountCollateralToDepositInBaseUnit: ZERO,
              amountDebtToBorrowInBaseUnit: roundedAmountToBorrow,
              slippage: new BigNumber(0.1),
            }

            const depositBorrowSimulation = await strategies.aave.v3.depositBorrow(args, {
              ...strategiesDependencies,
              getSwapData: env.strategiesDependencies.getSwapData(env.system.Swap.contract.address),
              proxy: position.proxy,
              currentPosition: beforeTransactionPosition,
              network: networkFork,
            })

            const transactionValue = '0'

            const [status] = await executeThroughProxy(
              position.proxy,
              {
                address: dsSystem.system.OperationExecutor.contract.address,
                calldata: dsSystem.system.OperationExecutor.contract.interface.encodeFunctionData(
                  'executeOp',
                  [
                    depositBorrowSimulation.transaction.calls,
                    depositBorrowSimulation.transaction.operationName,
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
              'gt',
              beforeTransactionPosition.debt.amount,
            )

            const proxyBalanceOfDebt = await balanceOf(
              afterTransactionPosition.debt.address,
              position.proxy,
              { config, isFormatted: false },
            )

            expect(status).to.be.true

            expect.toBeEqual(proxyBalanceOfDebt, ZERO, 2, 'Proxy balance of debt should be 0.')
          })
        })
      })
    })
  })
})
