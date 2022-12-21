import { JsonRpcProvider } from '@ethersproject/providers'
import {
  AAVETokens,
  ADDRESSES,
  IPosition,
  IPositionTransition,
  Position,
  strategies,
} from '@oasisdex/oasis-actions'
import aavePriceOracleABI from '@oasisdex/oasis-actions/lib/src/abi/aavePriceOracle.json'
import { amountFromWei } from '@oasisdex/oasis-actions/lib/src/helpers'
import { PositionType } from '@oasisdex/oasis-actions/lib/src/strategies/types/PositionType'
import { ONE, ZERO } from '@oasisdex/oasis-actions/src'
import { Address } from '@oasisdex/oasis-actions/src/strategies/types/IPositionRepository'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { loadFixture } from 'ethereum-waffle'
import { Contract, ContractReceipt, ethers, Signer } from 'ethers'

import AAVEDataProviderABI from '../../abi/aaveDataProvider.json'
import ERC20ABI from '../../abi/IERC20.json'
import { AAVEReserveData } from '../../helpers/aave'
import { executeThroughDPMProxy } from '../../helpers/deploy'
import { GasEstimateHelper, gasEstimateHelper } from '../../helpers/gasEstimation'
import { restoreSnapshot } from '../../helpers/restoreSnapshot'
import { oneInchCallMock } from '../../helpers/swap/OneInchCallMock'
import { swapUniswapTokens } from '../../helpers/swap/uniswap'
import { RuntimeConfig } from '../../helpers/types/common'
import { amountToWei, balanceOf } from '../../helpers/utils'
import { mainnetAddresses } from '../addresses'
import { testBlockNumber } from '../config'
import { tokens } from '../constants'
import { initialiseConfig } from '../fixtures/setup'
import { expectToBe, expectToBeEqual } from '../utils'

describe(`Strategy | AAVE | Open Position with DPM wallet`, async function () {
  let aaveDataProvider: Contract
  let provider: JsonRpcProvider
  let config: RuntimeConfig
  let signer: Signer
  let userAddress: Address

  before(async function () {
    ;({ config, provider, signer, address: userAddress } = await loadFixture(initialiseConfig))

    aaveDataProvider = new Contract(ADDRESSES.main.aave.DataProvider, AAVEDataProviderABI, provider)
  })

  describe('On forked chain', function () {
    const multiple = new BigNumber(2)
    const slippage = new BigNumber(0.1)

    let positionTransition: IPositionTransition
    let txStatus: boolean
    let gasEstimates: GasEstimateHelper

    async function setupOpenPositionTest(
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
      positionType: PositionType,
      mockMarketPrice: BigNumber | undefined,
      isFeeFromDebtToken: boolean,
      userAddress: Address,
      isDPMProxy: boolean,
    ) {
      const { snapshot } = await restoreSnapshot({
        config,
        provider,
        blockNumber: testBlockNumber,
        useFallbackSwap: true,
      })
      const system = snapshot.deployed.system

      /**
       * Need to have correct tokens in hand before
       * to marry up with what user is depositing
       */
      const swapETHtoDepositTokens = amountToWei(new BigNumber(100))
      !debtToken.isEth &&
        debtToken.depositAmountInBaseUnit.gt(ZERO) &&
        (await swapUniswapTokens(
          ADDRESSES.main.WETH,
          debtToken.address,
          swapETHtoDepositTokens.toFixed(0),
          ONE.toFixed(0),
          config.address,
          config,
        ))

      !collateralToken.isEth &&
        collateralToken.depositAmountInBaseUnit.gt(ZERO) &&
        (await swapUniswapTokens(
          ADDRESSES.main.WETH,
          collateralToken.address,
          swapETHtoDepositTokens.toFixed(0),
          ONE.toFixed(0),
          config.address,
          config,
        ))

      if (!collateralToken.isEth) {
        const COLL_TOKEN = new ethers.Contract(collateralToken.address, ERC20ABI, provider).connect(
          signer,
        )
        await COLL_TOKEN.connect(signer).approve(
          system.common.userProxyAddress,
          collateralToken.depositAmountInBaseUnit.toFixed(0),
        )
      }
      if (!debtToken.isEth) {
        const DEBT_TOKEN = new ethers.Contract(debtToken.address, ERC20ABI, provider).connect(
          signer,
        )
        await DEBT_TOKEN.connect(signer).approve(
          system.common.userProxyAddress,
          debtToken.depositAmountInBaseUnit.toFixed(0),
        )
      }

      const addresses = {
        ...mainnetAddresses,
        operationExecutor: system.common.operationExecutor.address,
      }

      const proxy = system.common.dpmProxyAddress

      const positionTransition = await strategies.aave.open(
        {
          depositedByUser: {
            debtToken: { amountInBaseUnit: debtToken.depositAmountInBaseUnit },
            collateralToken: { amountInBaseUnit: collateralToken.depositAmountInBaseUnit },
          },
          // TODO: Integrate properly with DPM and execute t/x through that
          positionType: positionType,
          slippage,
          multiple,
          debtToken: { symbol: debtToken.symbol, precision: debtToken.precision },
          collateralToken: { symbol: collateralToken.symbol, precision: collateralToken.precision },
          collectSwapFeeFrom: isFeeFromDebtToken ? 'sourceToken' : 'targetToken',
        },
        {
          addresses,
          provider,
          getSwapData: oneInchCallMock(mockMarketPrice, {
            from: debtToken.precision,
            to: collateralToken.precision,
          }),
          proxy,
          user: userAddress,
          isDPMProxy,
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

      const [txStatus, tx] = await executeThroughDPMProxy(
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
        collateralToken.address,
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

    describe(`With ${tokens.STETH} collateral & ${tokens.ETH} debt`, function () {
      const depositEthAmount = amountToWei(new BigNumber(1))
      gasEstimates = gasEstimateHelper()
      let userStEthReserveData: AAVEReserveData
      let userWethReserveData: AAVEReserveData
      let feeRecipientWethBalanceBefore: BigNumber
      let actualPosition: IPosition
      let tx: ContractReceipt

      before(async function () {
        const setup = await setupOpenPositionTest(
          {
            depositAmountInBaseUnit: ZERO,
            symbol: tokens.STETH,
            address: ADDRESSES.main.STETH,
            precision: 18,
            isEth: false,
          },
          {
            depositAmountInBaseUnit: depositEthAmount,
            symbol: tokens.ETH,
            address: ADDRESSES.main.WETH,
            precision: 18,
            isEth: true,
          },
          'Earn',
          new BigNumber(0.9759),
          true,
          userAddress,
          true,
        )
        txStatus = setup.txStatus
        tx = setup.tx
        positionTransition = setup.positionTransition
        actualPosition = setup.actualPosition
        userStEthReserveData = setup.userCollateralReserveData
        userWethReserveData = setup.userDebtReserveData
        feeRecipientWethBalanceBefore = setup.feeRecipientBalanceBefore

        gasEstimates.save(tx)
      })

      it('Tx should pass', function () {
        expect(txStatus).to.be.true
      })

      it('Should draw debt according to multiple', function () {
        expectToBeEqual(
          positionTransition.simulation.position.debt.amount.toFixed(0),
          new BigNumber(userWethReserveData.currentVariableDebt.toString()).toFixed(0),
        )
      })

      it(`Should deposit all ${tokens.STETH} tokens to aave`, function () {
        expectToBe(
          new BigNumber(userStEthReserveData.currentATokenBalance.toString()).toFixed(0),
          'gte',
          positionTransition.simulation.position.collateral.amount,
        )
      })

      it('Should achieve target multiple', function () {
        expectToBe(
          positionTransition.simulation.position.riskRatio.multiple,
          'gte',
          actualPosition.riskRatio.multiple,
        )
      })

      it('Should collect fee', async function () {
        const feeRecipientWethBalanceAfter = await balanceOf(
          ADDRESSES.main.WETH,
          ADDRESSES.main.feeRecipient,
          { config },
        )

        expectToBeEqual(
          new BigNumber(positionTransition.simulation.swap.tokenFee),
          feeRecipientWethBalanceAfter.minus(feeRecipientWethBalanceBefore),
        )
      })

      after(() => {
        gasEstimates.print()
      })
    })
  })
})
