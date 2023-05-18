import AAVEDataProviderABI from '@abis/external/protocols/aave/v2/protocolDataProvider.json'
import { ADDRESSES } from '@deploy-configurations/addresses'
import { Address } from '@deploy-configurations/types/address'
import { Network } from '@deploy-configurations/types/network'
import { ZERO } from '@dma-common/constants'
import { addressesByNetwork, expect } from '@dma-common/test-utils'
import { RuntimeConfig } from '@dma-common/types/common'
import { balanceOf } from '@dma-common/utils/balances'
import { amountToWei } from '@dma-common/utils/common'
import { executeThroughProxy } from '@dma-common/utils/execute'
import { approve } from '@dma-common/utils/tx/index'
import { initialiseConfig, SystemWithAAVEV3Positions } from '@dma-contracts/test/fixtures'
import { USDC } from '@dma-contracts/test/fixtures/factories/common'
import {
  getSupportedAaveV3Strategies,
  systemWithAaveV3Positions,
} from '@dma-contracts/test/fixtures/system/system-with-aave-v3-positions'
import { strategies } from '@dma-library'
import { Contract } from '@ethersproject/contracts'
import { JsonRpcProvider } from '@ethersproject/providers'
import BigNumber from 'bignumber.js'
import { loadFixture } from 'ethereum-waffle'
import { Signer } from 'ethers'

const mainnetAddresses = addressesByNetwork(Network.MAINNET)
const networkFork = process.env.NETWORK_FORK as Network

describe(`Strategy | AAVE | Deposit/Borrow | E2E`, async function () {
  let aaveDataProvider: Contract
  let provider: JsonRpcProvider
  let config: RuntimeConfig
  let signer: Signer
  let userAddress: Address

  before(async function () {
    ;({ config, provider, signer, address: userAddress } = await loadFixture(initialiseConfig))
    aaveDataProvider = new Contract(
      ADDRESSES[Network.MAINNET].aave.v2.ProtocolDataProvider,
      AAVEDataProviderABI,
      provider,
    )
  })

  // describe.skip('Uniswap t/x', function () {
  //   const slippage = new BigNumber(0.1)
  //
  //   let txStatus: boolean
  //   let gasEstimates: GasEstimateHelper
  //
  //   async function setupDepositBorrowTest(
  //     collateralToken: {
  //       depositAmountInBaseUnit: BigNumber
  //       symbol: AAVETokens
  //       address: string
  //       precision: number
  //       isEth: boolean
  //     },
  //     debtToken: {
  //       depositAmountInBaseUnit: BigNumber
  //       symbol: AAVETokens
  //       address: string
  //       precision: number
  //       isEth: boolean
  //     },
  //     mockMarketPrice: BigNumber | undefined,
  //     isFeeFromDebtToken: boolean,
  //     userAddress: Address,
  //   ) {
  //     const { snapshot } = await restoreSnapshot({
  //       config,
  //       provider,
  //       blockNumber: testBlockNumber,
  //       useFallbackSwap: true,
  //     })
  //     const system = snapshot.deployed.system
  //
  //     const addresses = {
  //       ...mainnetAddresses,
  //       operationExecutor: system.common.operationExecutor.address,
  //     }
  //
  //     const proxy = system.common.dpmProxyAddress
  //
  //     /* Used depositBorrow strategy for convenience as simpler to seed a position */
  //     const newPositionTransition = await strategies.aave.v2.depositBorrow(
  //       {
  //         borrowAmount: ZERO,
  //         entryToken: {
  //           symbol: 'ETH',
  //           amountInBaseUnit: collateralToken.depositAmountInBaseUnit,
  //         },
  //         slippage: slippage,
  //       },
  //       {
  //         addresses,
  //         currentPosition: new Position(
  //           new PositionBalance({ amount: new BigNumber(0), symbol: debtToken.symbol }),
  //           new PositionBalance({ amount: new BigNumber(0), symbol: 'ETH' }),
  //           new BigNumber(2000),
  //           {
  //             liquidationThreshold: ZERO,
  //             dustLimit: ZERO,
  //             maxLoanToValue: ZERO,
  //           },
  //         ),
  //         provider,
  //         getSwapData: oneInchCallMock(mockMarketPrice, {
  //           from: debtToken.precision,
  //           to: collateralToken.precision,
  //         }),
  //         proxy: proxy,
  //         user: userAddress,
  //         isDPMProxy: true,
  //       },
  //     )
  //
  //     const borrowTransition = await strategies.aave.v2.depositBorrow(
  //       {
  //         borrowAmount: amountToWei(1000, 6),
  //         entryToken: {
  //           symbol: 'ETH',
  //           amountInBaseUnit: ZERO,
  //         },
  //         slippage: slippage,
  //       },
  //       {
  //         addresses,
  //         currentPosition: newPositionTransition.simulation.position,
  //         provider,
  //         getSwapData: oneInchCallMock(mockMarketPrice, {
  //           from: debtToken.precision,
  //           to: collateralToken.precision,
  //         }),
  //         proxy: proxy,
  //         user: userAddress,
  //         isDPMProxy: true,
  //       },
  //     )
  //
  //     const feeRecipientBalanceBefore = await balanceOf(
  //       isFeeFromDebtToken ? debtToken.address : collateralToken.address,
  //       ADDRESSES[Network.MAINNET].common.FeeRecipient,
  //       { config },
  //     )
  //
  //     const ethDepositAmt = (debtToken.isEth ? debtToken.depositAmountInBaseUnit : ZERO).plus(
  //       collateralToken.isEth ? collateralToken.depositAmountInBaseUnit : ZERO,
  //     )
  //
  //     await executeThroughProxy(
  //       proxy,
  //       {
  //         address: system.common.operationExecutor.address,
  //         calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
  //           newPositionTransition.transaction.calls,
  //           newPositionTransition.transaction.operationName,
  //         ]),
  //       },
  //       signer,
  //       ethDepositAmt.toFixed(0),
  //     )
  //
  //     const [_txStatus, _tx] = await executeThroughProxy(
  //       proxy,
  //       {
  //         address: system.common.operationExecutor.address,
  //         calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
  //           borrowTransition.transaction.calls,
  //           borrowTransition.transaction.operationName,
  //         ]),
  //       },
  //       signer,
  //       ethDepositAmt.toFixed(0),
  //     )
  //
  //     const userCollateralReserveData = await aaveDataProvider.getUserReserveData(
  //       ADDRESSES[Network.MAINNET].common.WETH,
  //       proxy,
  //     )
  //
  //     const userDebtReserveData = await aaveDataProvider.getUserReserveData(
  //       debtToken.address,
  //       proxy,
  //     )
  //
  //     const aavePriceOracle = new ethers.Contract(
  //       addresses.priceOracle,
  //       aavePriceOracleABI,
  //       provider,
  //     )
  //
  //     const aaveCollateralTokenPriceInEth = collateralToken.isEth
  //       ? ONE
  //       : await aavePriceOracle
  //           .getAssetPrice(collateralToken.address)
  //           .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString())))
  //
  //     const aaveDebtTokenPriceInEth = debtToken.isEth
  //       ? ONE
  //       : await aavePriceOracle
  //           .getAssetPrice(debtToken.address)
  //           .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString())))
  //
  //     const oracle = aaveCollateralTokenPriceInEth.div(aaveDebtTokenPriceInEth)
  //
  //     const actualPosition = new Position(
  //       {
  //         amount: new BigNumber(userDebtReserveData.currentVariableDebt.toString()),
  //         precision: debtToken.precision,
  //         symbol: debtToken.symbol,
  //       },
  //       {
  //         amount: new BigNumber(userCollateralReserveData.currentATokenBalance.toString()),
  //         precision: collateralToken.precision,
  //         symbol: collateralToken.symbol,
  //       },
  //       oracle,
  //       borrowTransition.simulation.position.category,
  //     )
  //
  //     return {
  //       system,
  //       positionTransition: borrowTransition,
  //       feeRecipientBalanceBefore,
  //       txStatus: _txStatus,
  //       tx: _tx,
  //       oracle,
  //       actualPosition,
  //       userCollateralReserveData,
  //       userDebtReserveData,
  //     }
  //   }
  //
  //   describe(`test`, function () {
  //     const depositEthAmount = amountToWei(new BigNumber(10))
  //     gasEstimates = gasEstimateHelper()
  //
  //     before(async function () {
  //       /*
  //        * TODO: The args for this setup function need to be updated.
  //        * Hard to tell what relates to initial position creation and what relates to the deposit/borrow operation
  //        */
  //       const setup = await setupDepositBorrowTest(
  //         {
  //           depositAmountInBaseUnit: depositEthAmount,
  //           symbol: tokens.ETH,
  //           address: ADDRESSES[Network.MAINNET].common.ETH,
  //           precision: 18,
  //           isEth: true,
  //         },
  //         {
  //           depositAmountInBaseUnit: amountToWei(1000, 6),
  //           symbol: tokens.USDC,
  //           address: ADDRESSES[Network.MAINNET].common.USDC,
  //           precision: 6,
  //           isEth: false,
  //         },
  //         new BigNumber(1200),
  //         true,
  //         userAddress,
  //       )
  //
  //       txStatus = setup.txStatus
  //     })
  //
  //     it('Tx should pass', function () {
  //       expect(txStatus).to.be.true
  //     })
  //
  //     after(() => {
  //       gasEstimates.print()
  //     })
  //   })
  // })

  describe('Using AAVE V3', async function () {
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

    describe('Deposit collateral', () => {
      describe('When position is opened with DSProxy', () => {
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
            await getTokens.byImpersonate(entryToken.symbol, roundedAmountToDeposit)
            await approve(entryToken.address, dsProxyPosition.proxy, roundedAmountToDeposit, config)
          }

          const depositBorrowSimulation = await strategies.aave.v3.depositBorrow(args, {
            ...strategiesDependencies,
            getSwapData: env.strategiesDependencies.getSwapData(env.system.Swap.contract.address),
            proxy: dsProxyPosition.proxy,
            currentPosition: beforeTransactionPosition,
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
      describe('When position is opened with DPM Proxy', () => {
        supportedStrategies.forEach(({ name: strategy }) => {
          it('Should increase collateral', async function () {
            const { strategiesDependencies, dsSystem, config, dpmPositions, getTokens } = env

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
            })

            const transactionValue =
              collateralToken.symbol === 'ETH'
                ? amountToWei(new BigNumber(0.05), collateralToken.precision).toString()
                : '0'

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
          it.only('Should increase collateral when starting with an entry token that is not the collateral token', async function () {
            const { strategiesDependencies, dsSystem, config, dpmPositions, getTokens } = env

            const position = dpmPositions[strategy]
            if (!position) {
              this.skip()
              throw new Error('Position not found')
            }
            const beforeTransactionPosition = await position.getPosition()
            if (!beforeTransactionPosition) throw new Error('Position not found')

            const entryToken = new USDC(strategiesDependencies.addresses)
            // Depositing 500 USDC as entry token which will be swapped to Coll tokendd and then deposited
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
      // describe('When position is opened with DPM Proxy', async () => {
      //   supportedStrategies.forEach(({ name: strategy }) => {
      //     it(`Should reduce debt for ${strategy}`, async function () {
      //       const { strategiesDependencies, system, config, dpmPositions, getTokens } = env
      //
      //       const position = dpmPositions[strategy]
      //       if (!position) {
      //         this.skip()
      //         throw new Error('Position not found')
      //       }
      //       const beforeTransactionPosition = await position.getPosition()
      //       if (!beforeTransactionPosition) throw new Error('Position not found')
      //
      //       const amountToPayback = amountToWei(
      //         new BigNumber(1),
      //         beforeTransactionPosition.debt.precision,
      //       )
      //
      //       type PaybackDebtTypes = Parameters<typeof strategies.aave.v2.paybackWithdraw>
      //       const args: PaybackDebtTypes[0] = {
      //         debtToken: beforeTransactionPosition.debt,
      //         collateralToken: beforeTransactionPosition.collateral,
      //         amountDebtToPaybackInBaseUnit: amountToPayback,
      //         amountCollateralToWithdrawInBaseUnit: ZERO,
      //         slippage: new BigNumber(0.1),
      //       }
      //       const paybackDebtSimulation = await strategies.aave.v3.paybackWithdraw(args, {
      //         ...strategiesDependencies,
      //         proxy: position.proxy,
      //         currentPosition: beforeTransactionPosition,
      //       })
      //
      //       if (
      //         beforeTransactionPosition.debt.symbol !== 'ETH' &&
      //         beforeTransactionPosition.debt.symbol !== 'WETH'
      //       ) {
      //         await getTokens.byImpersonate(beforeTransactionPosition.debt.symbol, amountToPayback)
      //         await approve(
      //           beforeTransactionPosition.debt.address,
      //           position.proxy,
      //           args.amountDebtToPaybackInBaseUnit,
      //           config,
      //           false,
      //         )
      //       }
      //
      //       const transactionValue =
      //         beforeTransactionPosition.debt.symbol === 'ETH' ? amountToPayback.toString() : '0'
      //
      //       const [status] = await executeThroughDPMProxy(
      //         position.proxy,
      //         {
      //           address: system.OperationExecutor.contract.address,
      //           calldata: system.OperationExecutor.contract.interface.encodeFunctionData(
      //             'executeOp',
      //             [
      //               paybackDebtSimulation.transaction.calls,
      //               paybackDebtSimulation.transaction.operationName,
      //             ],
      //           ),
      //         },
      //         config.signer,
      //         transactionValue,
      //       )
      //
      //       const afterTransactionPosition = await position.getPosition()
      //
      //       expect(status).to.be.true
      //       expect.toBe(
      //         afterTransactionPosition.debt.amount,
      //         'lt',
      //         beforeTransactionPosition.debt.amount,
      //       )
      //     })
      //     it(`Should payback all debt for ${strategy}`, async function () {
      //       const { strategiesDependencies, system, config, dpmPositions, getTokens } = env
      //
      //       const position = dpmPositions[strategy]
      //       if (!position) {
      //         this.skip()
      //         throw new Error('Position not found')
      //       }
      //       const beforeTransactionPosition = await position.getPosition()
      //
      //       const amountToPayback = beforeTransactionPosition.debtToPaybackAll
      //
      //       type PaybackDebtTypes = Parameters<typeof strategies.aave.v2.paybackWithdraw>
      //       const args: PaybackDebtTypes[0] = {
      //         debtToken: beforeTransactionPosition.debt,
      //         collateralToken: beforeTransactionPosition.collateral,
      //         amountDebtToPaybackInBaseUnit: amountToPayback,
      //         amountCollateralToWithdrawInBaseUnit: ZERO,
      //         slippage: new BigNumber(0.1),
      //       }
      //       const paybackDebtSimulation = await strategies.aave.v3.paybackWithdraw(args, {
      //         ...strategiesDependencies,
      //         proxy: position.proxy,
      //         currentPosition: beforeTransactionPosition,
      //       })
      //
      //       if (
      //         beforeTransactionPosition.debt.symbol !== 'ETH' &&
      //         beforeTransactionPosition.debt.symbol !== 'WETH'
      //       ) {
      //         await getTokens.byImpersonate(beforeTransactionPosition.debt.symbol, amountToPayback)
      //         await approve(
      //           beforeTransactionPosition.debt.address,
      //           position.proxy,
      //           args.amountDebtToPaybackInBaseUnit,
      //           config,
      //           false,
      //         )
      //       }
      //
      //       const transactionValue =
      //         beforeTransactionPosition.debt.symbol === 'ETH' ? amountToPayback.toString() : '0'
      //
      //       const [status] = await executeThroughDPMProxy(
      //         position.proxy,
      //         {
      //           address: system.OperationExecutor.contract.address,
      //           calldata: system.OperationExecutor.contract.interface.encodeFunctionData(
      //             'executeOp',
      //             [
      //               paybackDebtSimulation.transaction.calls,
      //               paybackDebtSimulation.transaction.operationName,
      //             ],
      //           ),
      //         },
      //         config.signer,
      //         transactionValue,
      //       )
      //
      //       if (!status) throw new Error('Transaction failed')
      //
      //       const afterTransactionPosition = await position.getPosition()
      //
      //       const proxyBalanceOfDebt = await balanceOf(
      //         afterTransactionPosition.debt.address,
      //         position.proxy,
      //         { config, isFormatted: false },
      //       )
      //
      //       expect(status).to.be.true
      //
      //       expect.toBeEqual(proxyBalanceOfDebt, ZERO, 2, 'Proxy balance of debt should be 0.')
      //
      //       expect.toBeEqual(
      //         afterTransactionPosition.debt.amount,
      //         ZERO,
      //         2,
      //         'Debt should be reduce to 0.',
      //       )
      //     })
      //   })
      // })
    })
    // describe('Borrow debt', () => {
    //   describe('When position is opened with DSProxy', () => {
    //     it('Should reduce collateral', async () => {
    //       const { dsProxyPosition, strategiesDependencies, system, config } = env
    //       const beforeTransactionPosition = await dsProxyPosition.getPosition()
    //
    //       const beforeTransactionCollateralBalance = await balanceOf(
    //         beforeTransactionPosition.collateral.address,
    //         config.address,
    //         { config, isFormatted: false },
    //       )
    //
    //       type WithdrawParameters = Parameters<typeof strategies.aave.v3.paybackWithdraw>
    //       const args: WithdrawParameters[0] = {
    //         debtToken: beforeTransactionPosition.debt,
    //         collateralToken: beforeTransactionPosition.collateral,
    //         amountDebtToPaybackInBaseUnit: ZERO,
    //         amountCollateralToWithdrawInBaseUnit: amountToWei(
    //           new BigNumber(0.05),
    //           beforeTransactionPosition.collateral.precision,
    //         ),
    //         slippage: new BigNumber(0.1),
    //       }
    //       const withdrawSimulation = await strategies.aave.v3.paybackWithdraw(args, {
    //         ...strategiesDependencies,
    //         proxy: dsProxyPosition.proxy,
    //         currentPosition: beforeTransactionPosition,
    //       })
    //
    //       const [status] = await executeThroughProxy(
    //         dsProxyPosition.proxy,
    //         {
    //           address: system.OperationExecutor.contract.address,
    //           calldata: system.OperationExecutor.contract.interface.encodeFunctionData(
    //             'executeOp',
    //             [
    //               withdrawSimulation.transaction.calls,
    //               withdrawSimulation.transaction.operationName,
    //             ],
    //           ),
    //         },
    //         config.signer,
    //         '0',
    //       )
    //
    //       const afterTransactionPosition = await dsProxyPosition.getPosition()
    //
    //       const afterTransactionBalance = await balanceOf(
    //         beforeTransactionPosition.collateral.address,
    //         config.address,
    //         { config, isFormatted: false },
    //       )
    //
    //       expect(status).to.be.true
    //       expect.toBe(
    //         afterTransactionPosition.collateral.amount,
    //         'lt',
    //         beforeTransactionPosition.collateral.amount,
    //         'Amount of collateral after transaction is not less than before transaction',
    //       )
    //       expect.toBe(
    //         afterTransactionBalance,
    //         'gte',
    //         beforeTransactionCollateralBalance,
    //         'Balance of collateral after transaction is not greater than before transaction',
    //       )
    //     })
    //   })
    //   describe('When position is opened with DPM Proxy', async () => {
    //     supportedStrategies.forEach(({ name: strategy }) => {
    //       it(`Should reduce collateral for ${strategy}`, async function () {
    //         const { strategiesDependencies, system, config, dpmPositions } = env
    //
    //         const owner = await config.signer.getAddress()
    //
    //         const position = dpmPositions[strategy]
    //         if (!position) {
    //           this.skip()
    //           throw new Error('Position not found')
    //         }
    //         const beforeTransactionPosition = await position.getPosition()
    //
    //         const ethAddresses = {
    //           [Network.MAINNET]: mainnetAddresses.ETH,
    //           [Network.OPTIMISM]: optimismAddresses.ETH,
    //         }
    //         const ethAddress = ethAddresses[networkFork]
    //
    //         const collateralAddress =
    //           beforeTransactionPosition.collateral.symbol === 'ETH'
    //             ? ethAddress
    //             : beforeTransactionPosition.collateral.address
    //
    //         const beforeTransactionCollateralBalance = await balanceOf(collateralAddress, owner, {
    //           config,
    //           isFormatted: false,
    //         })
    //
    //         const amountToWithdraw = amountToWei(
    //           new BigNumber(0.05),
    //           beforeTransactionPosition.collateral.precision,
    //         )
    //
    //         type WithdrawParameters = Parameters<typeof strategies.aave.v2.paybackWithdraw>
    //         const args: WithdrawParameters[0] = {
    //           debtToken: beforeTransactionPosition.debt,
    //           collateralToken: beforeTransactionPosition.collateral,
    //           amountDebtToPaybackInBaseUnit: ZERO,
    //           amountCollateralToWithdrawInBaseUnit: amountToWithdraw,
    //           slippage: new BigNumber(0.1),
    //         }
    //         const withdrawSimulation = await strategies.aave.v3.paybackWithdraw(args, {
    //           ...strategiesDependencies,
    //           proxy: position.proxy,
    //           currentPosition: beforeTransactionPosition,
    //         })
    //
    //         const [status] = await executeThroughDPMProxy(
    //           position.proxy,
    //           {
    //             address: system.OperationExecutor.contract.address,
    //             calldata: system.OperationExecutor.contract.interface.encodeFunctionData(
    //               'executeOp',
    //               [
    //                 withdrawSimulation.transaction.calls,
    //                 withdrawSimulation.transaction.operationName,
    //               ],
    //             ),
    //           },
    //           config.signer,
    //           '0',
    //         )
    //
    //         const afterTransactionPosition = await position.getPosition()
    //
    //         const afterTransactionBalance = await balanceOf(collateralAddress, owner, {
    //           config,
    //           isFormatted: false,
    //         })
    //
    //         expect(status).to.be.true
    //
    //         expect.toBe(
    //           afterTransactionPosition.collateral.amount,
    //           'lte',
    //           beforeTransactionPosition.collateral.amount,
    //           'Amount of collateral after transaction is not less than before transaction',
    //         )
    //
    //         expect.toBe(
    //           afterTransactionBalance,
    //           'gte',
    //           beforeTransactionCollateralBalance,
    //           'Balance of collateral after transaction is not greater than before transaction',
    //         )
    //       })
    //       it(`Should reduce collateral as much as possible for ${strategy}`, async function () {
    //         const { strategiesDependencies, system, config, dpmPositions } = env
    //
    //         const position = dpmPositions[strategy]
    //         if (!position) {
    //           this.skip()
    //           throw new Error('No position found')
    //         }
    //
    //         const owner = await config.signer.getAddress()
    //
    //         const beforeTransactionPosition = await position.getPosition()
    //
    //         const beforeTransactionCollateralBalance = await balanceOf(
    //           position?.collateralToken.address,
    //           owner,
    //           { config, isFormatted: false },
    //         )
    //
    //         const amountToWithdraw = beforeTransactionPosition.maxCollateralToWithdraw
    //
    //         type WithdrawParameters = Parameters<typeof strategies.aave.v3.paybackWithdraw>
    //         const args: WithdrawParameters[0] = {
    //           debtToken: beforeTransactionPosition.debt,
    //           collateralToken: beforeTransactionPosition.collateral,
    //           amountDebtToPaybackInBaseUnit: ZERO,
    //           amountCollateralToWithdrawInBaseUnit: amountToWithdraw,
    //           slippage: new BigNumber(0.1),
    //         }
    //         const withdrawSimulation = await strategies.aave.v3.paybackWithdraw(args, {
    //           ...strategiesDependencies,
    //           proxy: position.proxy,
    //           currentPosition: beforeTransactionPosition,
    //         })
    //
    //         const [status] = await executeThroughDPMProxy(
    //           position.proxy,
    //           {
    //             address: system.OperationExecutor.contract.address,
    //             calldata: system.OperationExecutor.contract.interface.encodeFunctionData(
    //               'executeOp',
    //               [
    //                 withdrawSimulation.transaction.calls,
    //                 withdrawSimulation.transaction.operationName,
    //               ],
    //             ),
    //           },
    //           config.signer,
    //           '0',
    //         )
    //
    //         const afterTransactionPosition = await position.getPosition()
    //         if (!afterTransactionPosition) throw new Error('Position is not found')
    //
    //         const afterTransactionBalance = await balanceOf(
    //           position?.collateralToken.address,
    //           owner,
    //           { config, isFormatted: false },
    //         )
    //
    //         expect(status).to.be.true
    //         expect.toBe(
    //           afterTransactionPosition.collateral.amount,
    //           'lt',
    //           beforeTransactionPosition.collateral.amount,
    //           'Amount of collateral after transaction is not less than before transaction',
    //         )
    //
    //         expect.toBe(
    //           afterTransactionBalance,
    //           'gte',
    //           beforeTransactionCollateralBalance,
    //           'Balance of collateral after transaction is not greater than before transaction',
    //         )
    //
    //         expect.toBe(
    //           afterTransactionPosition.riskRatio.loanToValue
    //             .minus(afterTransactionPosition.category.maxLoanToValue)
    //             .abs(),
    //           'lte',
    //           new BigNumber(0.001),
    //           'LTV should be almost the max LTV',
    //         )
    //       })
    //     })
    //   })
    // })
    //
    // describe('Modify position using Deposit and Borrow', () => {
    //   describe('When position is opened with DSProxy', () => {
    //     it('Should payback all and withdraw all', async () => {
    //       const { dsProxyPosition, strategiesDependencies, system, config, getTokens } = env
    //       const beforeTransactionPosition = await dsProxyPosition.getPosition()
    //
    //       const amountToPayback = beforeTransactionPosition.debtToPaybackAll
    //
    //       const amountToWithdraw =
    //         beforeTransactionPosition.payback(amountToPayback).maxCollateralToWithdraw
    //
    //       type WithdrawPayback = Parameters<typeof strategies.aave.v3.paybackWithdraw>
    //       const args: WithdrawPayback[0] = {
    //         debtToken: beforeTransactionPosition.debt,
    //         collateralToken: beforeTransactionPosition.collateral,
    //         amountDebtToPaybackInBaseUnit: amountToPayback,
    //         amountCollateralToWithdrawInBaseUnit: amountToWithdraw,
    //         slippage: new BigNumber(0.1),
    //       }
    //       const withdrawPaybackSimulation = await strategies.aave.v3.paybackWithdraw(args, {
    //         ...strategiesDependencies,
    //         proxy: dsProxyPosition.proxy,
    //         currentPosition: beforeTransactionPosition,
    //       })
    //
    //       if (
    //         beforeTransactionPosition.debt.symbol !== 'ETH' &&
    //         beforeTransactionPosition.debt.symbol !== 'WETH'
    //       ) {
    //         const roundedAmountToPayback = new BigNumber(amountToPayback.toFixed(0))
    //         await getTokens.byImpersonate(
    //           beforeTransactionPosition.debt.symbol,
    //           roundedAmountToPayback,
    //         )
    //         await approve(
    //           beforeTransactionPosition.debt.address,
    //           dsProxyPosition.proxy,
    //           roundedAmountToPayback,
    //           config,
    //           false,
    //         )
    //       }
    //
    //       const transactionValue =
    //         beforeTransactionPosition.debt.symbol === 'ETH' ? amountToPayback.toString() : '0'
    //
    //       const [status] = await executeThroughProxy(
    //         dsProxyPosition.proxy,
    //         {
    //           address: system.OperationExecutor.contract.address,
    //           calldata: system.OperationExecutor.contract.interface.encodeFunctionData(
    //             'executeOp',
    //             [
    //               withdrawPaybackSimulation.transaction.calls,
    //               withdrawPaybackSimulation.transaction.operationName,
    //             ],
    //           ),
    //         },
    //         config.signer,
    //         transactionValue,
    //       )
    //
    //       const afterTransactionPosition = await dsProxyPosition.getPosition()
    //
    //       expect(status).to.be.true
    //       expect.toBe(
    //         afterTransactionPosition.collateral.amount,
    //         'lte',
    //         new BigNumber(2),
    //         'Amount of collateral after transaction should be close to 0',
    //       )
    //       expect.toBe(
    //         afterTransactionPosition.debt.amount,
    //         'lte',
    //         new BigNumber(2),
    //         'Amount of debt after transaction should be close to 0',
    //       )
    //     })
    //   })
    //   describe('When position is opened with DPM Proxy', () => {
    //     supportedStrategies.forEach(({ name: strategy }) => {
    //       it(`Should payback all and withdraw all for ${strategy}`, async function () {
    //         const { strategiesDependencies, system, config, dpmPositions, getTokens } = env
    //
    //         const position = dpmPositions[strategy]
    //
    //         if (position === undefined) {
    //           this.skip()
    //           throw new Error('Position is not found')
    //         }
    //         const beforeTransactionPosition = await position.getPosition()
    //
    //         const amountToPayback = beforeTransactionPosition.debtToPaybackAll
    //
    //         type WithdrawPayback = Parameters<typeof strategies.aave.v3.paybackWithdraw>
    //         const args: WithdrawPayback[0] = {
    //           debtToken: beforeTransactionPosition.debt,
    //           collateralToken: beforeTransactionPosition.collateral,
    //           amountDebtToPaybackInBaseUnit: amountToPayback,
    //           amountCollateralToWithdrawInBaseUnit: beforeTransactionPosition.collateral.amount,
    //           slippage: new BigNumber(0.1),
    //         }
    //         const withdrawPaybackSimulation = await strategies.aave.v3.paybackWithdraw(args, {
    //           ...strategiesDependencies,
    //           proxy: position.proxy,
    //           currentPosition: beforeTransactionPosition,
    //         })
    //
    //         if (
    //           beforeTransactionPosition.debt.symbol !== 'ETH' &&
    //           beforeTransactionPosition.debt.symbol !== 'WETH'
    //         ) {
    //           const roundedAmountToPayback = new BigNumber(amountToPayback.toFixed(0))
    //           await getTokens.byImpersonate(
    //             beforeTransactionPosition.debt.symbol,
    //             roundedAmountToPayback,
    //           )
    //           await approve(
    //             beforeTransactionPosition.debt.address,
    //             position.proxy,
    //             roundedAmountToPayback,
    //             config,
    //             false,
    //           )
    //         }
    //
    //         const transactionValue =
    //           beforeTransactionPosition.debt.symbol === 'ETH' ? amountToPayback.toString() : '0'
    //
    //         const [status] = await executeThroughDPMProxy(
    //           position.proxy,
    //           {
    //             address: system.OperationExecutor.contract.address,
    //             calldata: system.OperationExecutor.contract.interface.encodeFunctionData(
    //               'executeOp',
    //               [
    //                 withdrawPaybackSimulation.transaction.calls,
    //                 withdrawPaybackSimulation.transaction.operationName,
    //               ],
    //             ),
    //           },
    //           config.signer,
    //           transactionValue,
    //         )
    //
    //         const afterTransactionPosition = await position.getPosition()
    //         if (!afterTransactionPosition) throw new Error('Position is undefined')
    //
    //         expect(status).to.be.true
    //         expect.toBe(
    //           afterTransactionPosition.debt.amount,
    //           'lte',
    //           new BigNumber(2),
    //           'Amount of debt after transaction should be close to 0',
    //         )
    //         expect.toBe(
    //           afterTransactionPosition.collateral.amount,
    //           'lte',
    //           new BigNumber(2),
    //           'Amount of collateral after transaction should be close to 0',
    //         )
    //       })
    //     })
    //   })
    // })
  })
})
