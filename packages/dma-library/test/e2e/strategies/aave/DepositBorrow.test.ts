import { initialiseConfig } from '@dma-library/test/fixtures'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import BigNumber from 'bignumber.js'
import AAVEDataProviderABI from '@oasisdex/dma-contracts/abi/external/aave/v2/protocolDataProvider.json'
import aavePriceOracleABI from '@oasisdex/dma-contracts/abi/external/aave/v2/priceOracle.json'

import { AAVETokens, Position, strategies } from '@dma-library'
import { ADDRESSES } from '@dma-library/utils/addresses'
import { executeThroughProxy } from '@oasisdex/dma-common/utils/execute'
import {
  expect,
  gasEstimateHelper,
  GasEstimateHelper,
  restoreSnapshot,
} from '@oasisdex/dma-common/test-utils'
import { ONE, ZERO } from '@oasisdex/dma-common/constants'
import { amountFromWei, amountToWei, balanceOf } from '@oasisdex/dma-common/utils/common'
import { Contract } from '@ethersproject/contracts'
import { JsonRpcProvider } from '@ethersproject/providers'
import { RuntimeConfig } from '@oasisdex/dma-common/utils/types/common'
import { ethers, Signer } from 'ethers'
import { Address } from '@dma-library/types'
import { testBlockNumber } from '@dma-library/test/config'
import { mainnetAddresses } from '@dma-library/test/addresses'
import { PositionBalance } from '@dma-library/domain'
import { oneInchCallMock } from '@oasisdex/dma-common/utils/swap/OneInchCallMock'
import { tokens } from '@dma-library/test/constants'

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
      })

      it('Tx should pass', function () {
        expect(txStatus).to.be.true
      })

      after(() => {
        gasEstimates.print()
      })
    })
  })
})
