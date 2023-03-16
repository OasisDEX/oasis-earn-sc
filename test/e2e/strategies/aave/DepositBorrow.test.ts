<<<<<<<< HEAD:packages/dupa-library/test/aave/DepositBorrow.test.ts
import { AAVETokens, ADDRESSES, ONE, Position, strategies, ZERO } from '@dupa-library/src'
import { PositionBalance } from '@dupa-library/src/domain/Position'
import { Address } from '@dupa-library/src/types'
import { amountFromWei } from '@dupa-library/src/utils'
import { JsonRpcProvider } from '@ethersproject/providers'
import { executeThroughProxy } from '@oasisdex/dupa-common/utils/deploy'
import { GasEstimateHelper, gasEstimateHelper } from 'packages/dupa-common/utils/gas-estimation'
import { restoreSnapshot } from 'packages/dupa-common/utils/restore-snapshot'
import { oneInchCallMock } from '@oasisdex/dupa-common/utils/swap/OneInchCallMock'
import { RuntimeConfig } from '@oasisdex/dupa-common/utils/types/common'
import { amountToWei, balanceOf } from 'packages/dupa-common/utils/common'
import aavePriceOracleABI from '@oasisdex/dupa-contracts/abi/external/aave/v2/priceOracle.json'
import AAVEDataProviderABI from '@oasisdex/dupa-contracts/abi/external/aave/v2/protocolDataProvider.json'
========
import aavePriceOracleABI from '@abi/external/aave/v2/priceOracle.json'
import AAVEDataProviderABI from '@abi/external/aave/v2/protocolDataProvider.json'
import { JsonRpcProvider } from '@ethersproject/providers'
import { executeThroughProxy } from '@helpers/deploy'
import { GasEstimateHelper, gasEstimateHelper } from '@helpers/gasEstimation'
import { restoreSnapshot } from '@helpers/restoreSnapshot'
import { oneInchCallMock } from '@helpers/swap/OneInchCallMock'
import { RuntimeConfig } from '@helpers/types/common'
import { amountToWei, balanceOf } from '@helpers/utils'
import { AAVETokens, ADDRESSES, ONE, Position, strategies, ZERO } from '@oasisdex/oasis-actions'
import { PositionBalance } from '@oasisdex/oasis-actions/lib/packages/oasis-actions/src/domain/Position'
import { amountFromWei } from '@oasisdex/oasis-actions/lib/packages/oasis-actions/src/helpers'
import { Address } from '@oasisdex/oasis-actions/lib/packages/oasis-actions/src/types'
>>>>>>>> dev:test/e2e/strategies/aave/DepositBorrow.test.ts
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { loadFixture } from 'ethereum-waffle'
import { Contract, ethers, Signer } from 'ethers'

<<<<<<<< HEAD:packages/dupa-library/test/aave/DepositBorrow.test.ts
import { mainnetAddresses } from '../addresses'
import { testBlockNumber } from '../config'
import { tokens } from '../constants'
import { initialiseConfig } from '../fixtures/setup'
========
import { mainnetAddresses } from '../../../addresses'
import { testBlockNumber } from '../../../config'
import { tokens } from '../../../constants'
import { initialiseConfig } from '../../../fixtures/setup'
>>>>>>>> dev:test/e2e/strategies/aave/DepositBorrow.test.ts

// TODO: IMPLEMENT THIS TEST
describe(`Strategy | AAVE | Deposit/Borrow`, async function () {
  let aaveDataProvider: Contract
  let provider: JsonRpcProvider
  let config: RuntimeConfig
  let signer: Signer
  let userAddress: Address

  before(async function () {
    ;({ config, provider, signer, address: userAddress } = await loadFixture(initialiseConfig))
    aaveDataProvider = new Contract(
      ADDRESSES.main.aave.v2.ProtocolDataProvider,
      AAVEDataProviderABI,
      provider,
    )
  })

  describe('Uniswap t/x', function () {
    const slippage = new BigNumber(0.1)

    // let positionTransition: IPositionTransition
    let txStatus: boolean
    let gasEstimates: GasEstimateHelper

    async function setupDepositBorrowTest(
      collateralToken: {
        depositAmountInBaseUnit: BigNumber
        symbol: AAVETokens
        address: string
        precision: number
        isEth: boolean
      },
      debtToken: {
        depositAmountInBaseUnit: BigNumber
        symbol: AAVETokens
        address: string
        precision: number
        isEth: boolean
      },
      mockMarketPrice: BigNumber | undefined,
      isFeeFromDebtToken: boolean,
      userAddress: Address,
    ) {
      const { snapshot } = await restoreSnapshot({
        config,
        provider,
        blockNumber: testBlockNumber,
        useFallbackSwap: true,
      })
      const system = snapshot.deployed.system

      const addresses = {
        ...mainnetAddresses,
        priceOracle: mainnetAddresses.aave.v2.priceOracle,
        lendingPool: mainnetAddresses.aave.v2.lendingPool,
        protocolDataProvider: mainnetAddresses.aave.v2.protocolDataProvider,
        operationExecutor: system.common.operationExecutor.address,
      }

      const proxy = system.common.dpmProxyAddress

      /* Used depositBorrow strategy for convenience as simpler to seed a position */
      const newPositionTransition = await strategies.aave.v2.depositBorrow(
        {
          borrowAmount: ZERO,
          entryToken: {
            symbol: 'ETH',
            amountInBaseUnit: collateralToken.depositAmountInBaseUnit,
          },
          slippage: slippage,
        },
        {
          addresses,
          currentPosition: new Position(
            new PositionBalance({ amount: new BigNumber(0), symbol: debtToken.symbol }),
            new PositionBalance({ amount: new BigNumber(0), symbol: 'ETH' }),
            new BigNumber(2000),
            {
              liquidationThreshold: ZERO,
              dustLimit: ZERO,
              maxLoanToValue: ZERO,
            },
          ),
          provider,
          getSwapData: oneInchCallMock(mockMarketPrice, {
            from: debtToken.precision,
            to: collateralToken.precision,
          }),
          proxy: proxy,
          user: userAddress,
          isDPMProxy: true,
        },
      )

      const borrowTransition = await strategies.aave.v2.depositBorrow(
        {
          borrowAmount: amountToWei(1000, 6),
          entryToken: {
            symbol: 'ETH',
            amountInBaseUnit: ZERO,
          },
          slippage: slippage,
        },
        {
          addresses,
          currentPosition: newPositionTransition.simulation.position,
          provider,
          getSwapData: oneInchCallMock(mockMarketPrice, {
            from: debtToken.precision,
            to: collateralToken.precision,
          }),
          proxy: proxy,
          user: userAddress,
          isDPMProxy: true,
        },
      )

      const feeRecipientBalanceBefore = await balanceOf(
        isFeeFromDebtToken ? debtToken.address : collateralToken.address,
        ADDRESSES.main.feeRecipient,
        { config },
      )

      const ethDepositAmt = (debtToken.isEth ? debtToken.depositAmountInBaseUnit : ZERO).plus(
        collateralToken.isEth ? collateralToken.depositAmountInBaseUnit : ZERO,
      )

      await executeThroughProxy(
        proxy,
        {
          address: system.common.operationExecutor.address,
          calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
            newPositionTransition.transaction.calls,
            newPositionTransition.transaction.operationName,
          ]),
        },
        signer,
        ethDepositAmt.toFixed(0),
      )

      const [_txStatus, _tx] = await executeThroughProxy(
        proxy,
        {
          address: system.common.operationExecutor.address,
          calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
            borrowTransition.transaction.calls,
            borrowTransition.transaction.operationName,
          ]),
        },
        signer,
        ethDepositAmt.toFixed(0),
      )

      const userCollateralReserveData = await aaveDataProvider.getUserReserveData(
        ADDRESSES.main.WETH,
        proxy,
      )

      const userDebtReserveData = await aaveDataProvider.getUserReserveData(
        debtToken.address,
        proxy,
      )

      const aavePriceOracle = new ethers.Contract(
        addresses.priceOracle,
        aavePriceOracleABI,
        provider,
      )

      const aaveCollateralTokenPriceInEth = collateralToken.isEth
        ? ONE
        : await aavePriceOracle
            .getAssetPrice(collateralToken.address)
            .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString())))

      const aaveDebtTokenPriceInEth = debtToken.isEth
        ? ONE
        : await aavePriceOracle
            .getAssetPrice(debtToken.address)
            .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString())))

      const oracle = aaveCollateralTokenPriceInEth.div(aaveDebtTokenPriceInEth)

      const actualPosition = new Position(
        {
          amount: new BigNumber(userDebtReserveData.currentVariableDebt.toString()),
          precision: debtToken.precision,
          symbol: debtToken.symbol,
        },
        {
          amount: new BigNumber(userCollateralReserveData.currentATokenBalance.toString()),
          precision: collateralToken.precision,
          symbol: collateralToken.symbol,
        },
        oracle,
        borrowTransition.simulation.position.category,
      )

      return {
        system,
        positionTransition: borrowTransition,
        feeRecipientBalanceBefore,
        txStatus: _txStatus,
        tx: _tx,
        oracle,
        actualPosition,
        userCollateralReserveData,
        userDebtReserveData,
      }
    }

    describe(`test`, function () {
      const depositEthAmount = amountToWei(new BigNumber(10))
      gasEstimates = gasEstimateHelper()
      // let userUsdcReserveData: AAVEReserveData
      // let userWethReserveData: AAVEReserveData
      // let feeRecipientWethBalanceBefore: BigNumber
      // let actualPosition: IPosition
      // let tx: ContractReceipt

      before(async function () {
        /*
         * TODO: The args for this setup function need to be updated.
         * Hard to tell what relates to initial position creation and what relates to the deposit/borrow operation
         */
        const setup = await setupDepositBorrowTest(
          {
            depositAmountInBaseUnit: depositEthAmount,
            symbol: tokens.ETH,
            address: ADDRESSES.main.ETH,
            precision: 18,
            isEth: true,
          },
          {
            depositAmountInBaseUnit: amountToWei(1000, 6),
            symbol: tokens.USDC,
            address: ADDRESSES.main.USDC,
            precision: 6,
            isEth: false,
          },
          new BigNumber(1200),
          true,
          userAddress,
        )

        txStatus = setup.txStatus
        // positionTransition = setup.positionTransition
      })

      it('Tx should pass', function () {
        expect(txStatus).to.be.true
      })

      // it('Should draw debt according to multiple', function () {
      //   expectToBeEqual(
      //     positionTransition.simulation.position.debt.amount.toFixed(0),
      //     new BigNumber(userWethReserveData.currentVariableDebt.toString()).toFixed(0),
      //   )
      // })

      // it(`Should deposit all ${tokens.STETH} tokens to aave`, function () {
      //   expectToBe(
      //     new BigNumber(userUsdcReserveData.currentATokenBalance.toString()).toFixed(0),
      //     'gte',
      //     positionTransition.simulation.position.collateral.amount,
      //   )
      // })

      // it('Should achieve target multiple', function () {
      //   expectToBe(
      //     positionTransition.simulation.position.riskRatio.multiple,
      //     'gte',
      //     actualPosition.riskRatio.multiple,
      //   )
      // })

      // TODO: No fee collected in any of current scenarios
      // it('Should collect fee', async function () {
      //   const feeRecipientWethBalanceAfter = await balanceOf(
      //     ADDRESSES.main.WETH,
      //     ADDRESSES.main.feeRecipient,
      //     { config },
      //   )
      //
      //   expectToBeEqual(
      //     new BigNumber(positionTransition.simulation.swap.tokenFee),
      //     feeRecipientWethBalanceAfter.minus(feeRecipientWethBalanceBefore),
      //   )
      // })

      after(() => {
        gasEstimates.print()
      })
    })
  })
})
