import { JsonRpcProvider } from '@ethersproject/providers'
import {
  ADDRESSES,
  IPosition,
  IPositionTransition,
  Position,
  strategies,
} from '@oasisdex/oasis-actions'
import aavePriceOracleABI from '@oasisdex/oasis-actions/lib/src/abi/aavePriceOracle.json'
import { amountFromWei } from '@oasisdex/oasis-actions/lib/src/helpers'
import { ONE, ZERO } from '@oasisdex/oasis-actions/src'
import { PositionBalance } from '@oasisdex/oasis-actions/src/helpers/calculations/Position'
import { AAVETokens } from '@oasisdex/oasis-actions/src/operations/aave/tokens'
import { Address } from '@oasisdex/oasis-actions/src/strategies/types/IPositionRepository'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { loadFixture } from 'ethereum-waffle'
import { Contract, ContractReceipt, ethers, Signer } from 'ethers'

import AAVEDataProviderABI from '../../abi/aaveDataProvider.json'
import AAVELendigPoolABI from '../../abi/aaveLendingPool.json'
import { AAVEReserveData } from '../../helpers/aave'
import { executeThroughProxy } from '../../helpers/deploy'
import { GasEstimateHelper, gasEstimateHelper } from '../../helpers/gasEstimation'
import { restoreSnapshot } from '../../helpers/restoreSnapshot'
import { oneInchCallMock } from '../../helpers/swap/OneInchCallMock'
import { RuntimeConfig } from '../../helpers/types/common'
import { amountToWei, balanceOf } from '../../helpers/utils'
import { mainnetAddresses } from '../addresses'
import { testBlockNumber } from '../config'
import { tokens } from '../constants'
import { initialiseConfig } from '../fixtures/setup'

describe.only(`Strategy | AAVE | Deposit-Borrow`, async function () {
  let aaveLendingPool: Contract
  let aaveDataProvider: Contract
  let provider: JsonRpcProvider
  let config: RuntimeConfig
  let signer: Signer
  let userAddress: Address

  before(async function () {
    ;({ config, provider, signer, address: userAddress } = await loadFixture(initialiseConfig))
    aaveLendingPool = new Contract(
      ADDRESSES.main.aave.MainnetLendingPool,
      AAVELendigPoolABI,
      provider,
    )
    aaveDataProvider = new Contract(ADDRESSES.main.aave.DataProvider, AAVEDataProviderABI, provider)
  })

  describe('Uniswap t/x', function () {
    const slippage = new BigNumber(0.1)

    let positionTransition: IPositionTransition
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
        operationExecutor: system.common.operationExecutor.address,
      }

      const proxy = system.common.dpmProxyAddress
      const positionTransition = await strategies.aave.depositBorrow(
        {
          collectFeeFrom: 'sourceToken',
          borrowAmount: debtToken.depositAmountInBaseUnit,
          entryToken: ADDRESSES.main.ETH,
          entryTokenAmount: collateralToken.depositAmountInBaseUnit,
          slippage: slippage,
        },
        {
          addresses,
          currentPosition: new Position(
            new PositionBalance({ amount: new BigNumber(0), symbol: debtToken.symbol }),
            new PositionBalance({ amount: new BigNumber(0), symbol: 'WETH' }),
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

      const feeRecipientBalanceBefore = await balanceOf(
        isFeeFromDebtToken ? debtToken.address : collateralToken.address,
        ADDRESSES.main.feeRecipient,
        { config },
      )

      const ethDepositAmt = (debtToken.isEth ? debtToken.depositAmountInBaseUnit : ZERO).plus(
        collateralToken.isEth ? collateralToken.depositAmountInBaseUnit : ZERO,
      )

      const [txStatus, tx] = await executeThroughProxy(
        proxy,
        {
          address: system.common.operationExecutor.address,
          calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
            positionTransition.transaction.calls,
            positionTransition.transaction.operationName,
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
        addresses.aavePriceOracle,
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
        positionTransition.simulation.position.category,
      )

      return {
        system,
        positionTransition,
        feeRecipientBalanceBefore,
        txStatus,
        tx,
        oracle,
        actualPosition,
        userCollateralReserveData,
        userDebtReserveData,
      }
    }

    describe(`test`, function () {
      const depositEthAmount = amountToWei(new BigNumber(10))
      gasEstimates = gasEstimateHelper()
      let userUsdcReserveData: AAVEReserveData
      let userWethReserveData: AAVEReserveData
      let feeRecipientWethBalanceBefore: BigNumber
      let actualPosition: IPosition
      let tx: ContractReceipt

      before(async function () {
        const setup = await setupDepositBorrowTest(
          {
            depositAmountInBaseUnit: depositEthAmount,
            symbol: tokens.ETH,
            address: ADDRESSES.main.ETH,
            precision: 18,
            isEth: true,
          },
          {
            depositAmountInBaseUnit: depositEthAmount,
            symbol: tokens.USDC,
            address: ADDRESSES.main.USDC,
            precision: 18,
            isEth: false,
          },
          new BigNumber(1200),
          true,
          userAddress,
        )

        txStatus = setup.txStatus
        tx = setup.tx
        positionTransition = setup.positionTransition
        actualPosition = setup.actualPosition
        userUsdcReserveData = setup.userCollateralReserveData
        userWethReserveData = setup.userDebtReserveData
        feeRecipientWethBalanceBefore = setup.feeRecipientBalanceBefore

        // gasEstimates.save(tx)
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

      // it('Should collect fee', async function () {
      //   const feeRecipientWethBalanceAfter = await balanceOf(
      //     ADDRESSES.main.WETH,
      //     ADDRESSES.main.feeRecipient,
      //     { config },
      //   )

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
