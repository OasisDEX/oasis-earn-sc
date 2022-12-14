import { JsonRpcProvider } from '@ethersproject/providers'
import {
  ADDRESSES,
  IPosition,
  IPositionTransition,
  Position,
  strategies,
  TYPICAL_PRECISION,
} from '@oasisdex/oasis-actions'
import aavePriceOracleABI from '@oasisdex/oasis-actions/lib/src/abi/aavePriceOracle.json'
import { amountFromWei } from '@oasisdex/oasis-actions/lib/src/helpers'
import { PositionType } from '@oasisdex/oasis-actions/lib/src/strategies/types/PositionType'
import { ONE, ZERO } from '@oasisdex/oasis-actions/src'
import { AAVETokens } from '@oasisdex/oasis-actions/src/operations/aave/tokens'
import { Address } from '@oasisdex/oasis-actions/src/strategies/types/StrategyParams'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { Contract, ContractReceipt, ethers, Signer } from 'ethers'

import AAVEDataProviderABI from '../../abi/aaveDataProvider.json'
import ERC20ABI from '../../abi/IERC20.json'
import { AAVEReserveData } from '../../helpers/aave'
import { executeThroughProxy } from '../../helpers/deploy'
import { GasEstimateHelper, gasEstimateHelper } from '../../helpers/gasEstimation'
import { restoreSnapshot } from '../../helpers/restoreSnapshot'
import { getOneInchCall } from '../../helpers/swap/OneInchCall'
import { oneInchCallMock } from '../../helpers/swap/OneInchCallMock'
import { swapUniswapTokens } from '../../helpers/swap/uniswap'
import { RuntimeConfig } from '../../helpers/types/common'
import { amountToWei, balanceOf } from '../../helpers/utils'
import { mainnetAddresses } from '../addresses'
import { testBlockNumber } from '../config'
import { tokens } from '../constants'
import { initialiseConfig } from '../fixtures/setup'
import { expectToBe, expectToBeEqual } from '../utils'

describe(`Strategy | AAVE | Open Position`, async function () {
  let gasHelper: GasEstimateHelper
  let aaveDataProvider: Contract
  let provider: JsonRpcProvider
  let config: RuntimeConfig
  let signer: Signer
  let userAddress: Address

  const defaultSlippage = new BigNumber(0.1)
  const USDCPrecision = 6
  const WBTCPrecision = 8
  before(async function () {
    ;({ config, provider, signer, address: userAddress } = await initialiseConfig())

    aaveDataProvider = new Contract(ADDRESSES.main.aave.DataProvider, AAVEDataProviderABI, provider)
  })

  type OpenPositionScenario = {
    collateralToken: {
      symbol: AAVETokens
      address: string
      precision: number
      depositAmountInBasePrecision: BigNumber
      isEth: boolean
    }
    debtToken: {
      symbol: AAVETokens
      address: string
      precision: number
      depositAmountInBasePrecision: BigNumber
      isEth: boolean
    }
    positionType: PositionType
    marketPrice?: BigNumber
    getSwapData?: typeof getOneInchCall
    targetMultiple: BigNumber
    slippage: BigNumber
    takeFeeAsFromToken: boolean
  }
  async function openPosition({
    scenario,
    userAddress,
    isDPMProxy,
    gasHelper,
  }: {
    scenario: OpenPositionScenario
    userAddress: Address
    isDPMProxy: boolean
    gasHelper: GasEstimateHelper
  }) {
    const { collateralToken, debtToken } = scenario
    const fromToken = debtToken
    const toToken = collateralToken

    const { snapshot } = await restoreSnapshot({
      config,
      provider,
      blockNumber: testBlockNumber,
      useFallbackSwap: true,
    })
    const system = snapshot.deployed.system

    /**
     * Test setup
     * Swap test account for ETH for tokens required for transaction
     */
    const swap100ETHtoDepositTokens = amountToWei(new BigNumber(100))
    !debtToken.isEth &&
      debtToken.depositAmountInBasePrecision.gt(ZERO) &&
      (await swapUniswapTokens(
        ADDRESSES.main.WETH,
        debtToken.address,
        swap100ETHtoDepositTokens.toFixed(0),
        ONE.toFixed(0),
        config.address,
        config,
      ))

    !collateralToken.isEth &&
      collateralToken.depositAmountInBasePrecision.gt(ZERO) &&
      (await swapUniswapTokens(
        ADDRESSES.main.WETH,
        collateralToken.address,
        swap100ETHtoDepositTokens.toFixed(0),
        ONE.toFixed(0),
        config.address,
        config,
      ))

    /**
     * Give proxy approval to pull tokens from user wallet
     * */
    if (!collateralToken.isEth) {
      const COLL_TOKEN = new ethers.Contract(collateralToken.address, ERC20ABI, provider).connect(
        signer,
      )
      await COLL_TOKEN.connect(signer).approve(
        system.common.userProxyAddress,
        collateralToken.depositAmountInBasePrecision.toFixed(0),
      )
    }
    if (!debtToken.isEth) {
      const DEBT_TOKEN = new ethers.Contract(debtToken.address, ERC20ABI, provider).connect(signer)
      await DEBT_TOKEN.connect(signer).approve(
        system.common.userProxyAddress,
        debtToken.depositAmountInBasePrecision.toFixed(0),
      )
    }

    const addresses = {
      ...mainnetAddresses,
      operationExecutor: system.common.operationExecutor.address,
    }

    /** Generate t/x calldata and simulate position transition */
    const proxy = system.common.dsProxy.address
    const collectSwapFeeFrom = scenario.takeFeeAsFromToken ? 'sourceToken' : 'targetToken'
    const positionTransition = await strategies.aave.open(
      {
        depositedByUser: {
          debtToken: { amountInBaseUnit: debtToken.depositAmountInBasePrecision },
          collateralToken: { amountInBaseUnit: collateralToken.depositAmountInBasePrecision },
        },
        // TODO: Integrate properly with DPM and execute t/x through that
        slippage: scenario.slippage,
        multiple: scenario.targetMultiple,
        debtToken: { symbol: debtToken.symbol, precision: debtToken.precision },
        collateralToken: { symbol: collateralToken.symbol, precision: collateralToken.precision },
        collectSwapFeeFrom: collectSwapFeeFrom,
        positionType: scenario.positionType,
      },
      {
        addresses,
        provider,
        getSwapData: scenario?.getSwapData
          ? scenario.getSwapData(system.common.swap.address)
          : oneInchCallMock(scenario.marketPrice, {
              from: fromToken.precision,
              to: toToken.precision,
            }),
        proxy,
        user: userAddress,
        isDPMProxy,
      },
    )

    /** Record fee balance before t/x */
    const collectFeeFromAsset = scenario.takeFeeAsFromToken ? fromToken.address : toToken.address
    const feeRecipientBalanceBefore = await balanceOf(
      collectFeeFromAsset,
      ADDRESSES.main.feeRecipient,
      { config },
    )

    const ethDepositAmt = (debtToken.isEth ? debtToken.depositAmountInBasePrecision : ZERO).plus(
      collateralToken.isEth ? collateralToken.depositAmountInBasePrecision : ZERO,
    )
    const [txStatus, tx] = await executeThroughProxy(
      system.common.dsProxy.address,
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
    gasHelper.save(tx)

    /** User reserves after opening */
    const userCollateralReserveDataAfterOpening = await aaveDataProvider.getUserReserveData(
      collateralToken.address,
      system.common.dsProxy.address,
    )
    const userDebtReserveDataAfterOpening = await aaveDataProvider.getUserReserveData(
      debtToken.address,
      system.common.dsProxy.address,
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

    const actualPositionAfterOpening = new Position(
      {
        amount: new BigNumber(userDebtReserveDataAfterOpening.currentVariableDebt.toString()),
        precision: debtToken.precision,
        symbol: debtToken.symbol,
      },
      {
        amount: new BigNumber(
          userCollateralReserveDataAfterOpening.currentATokenBalance.toString(),
        ),
        precision: collateralToken.precision,
        symbol: collateralToken.symbol,
      },
      oracle,
      positionTransition.simulation.position.category,
    )

    return {
      positionTransition,
      txStatus,
      tx,
      oracle,
      feeRecipientBalanceBefore,
      actualPositionAfterOpening,
      userCollateralReserveDataAfterOpening,
      userDebtReserveDataAfterOpening,
      system,
    }
  }

  describe('Open Position: With [Uniswap] (Fallback) Swap', function () {
    /** Slippages are between 0 and 1. So, 0.1 === 10% slippage */
    const scenarios: Record<string, OpenPositionScenario> = {
      [`${tokens.STETH}:${tokens.ETH}`]: {
        collateralToken: {
          symbol: tokens.STETH,
          precision: TYPICAL_PRECISION,
          address: ADDRESSES.main.stETH,
          depositAmountInBasePrecision: ZERO,
          isEth: false,
        },
        debtToken: {
          symbol: tokens.ETH,
          precision: TYPICAL_PRECISION,
          address: ADDRESSES.main.WETH,
          depositAmountInBasePrecision: amountToWei(new BigNumber(1), TYPICAL_PRECISION),
          isEth: true,
        },
        positionType: 'Earn',
        marketPrice: new BigNumber(0.9759),
        targetMultiple: new BigNumber(2),
        slippage: defaultSlippage,
        takeFeeAsFromToken: true,
      },
      [`${tokens.ETH}:${tokens.USDC}`]: {
        collateralToken: {
          symbol: tokens.ETH,
          precision: TYPICAL_PRECISION,
          address: ADDRESSES.main.WETH,
          depositAmountInBasePrecision: amountToWei(new BigNumber(600)),
          isEth: true,
        },
        debtToken: {
          symbol: tokens.USDC,
          precision: USDCPrecision,
          address: ADDRESSES.main.USDC,
          depositAmountInBasePrecision: ZERO,
          isEth: false,
        },
        positionType: 'Multiply',
        marketPrice: new BigNumber(1300),
        targetMultiple: new BigNumber(2),
        slippage: defaultSlippage,
        takeFeeAsFromToken: true,
      },
      [`${tokens.WBTC}:${tokens.USDC}_A`]: {
        collateralToken: {
          symbol: tokens.WBTC,
          precision: WBTCPrecision,
          address: ADDRESSES.main.WBTC,
          depositAmountInBasePrecision: amountToWei(new BigNumber(6), WBTCPrecision),
          isEth: false,
        },
        debtToken: {
          symbol: tokens.USDC,
          precision: USDCPrecision,
          address: ADDRESSES.main.USDC,
          depositAmountInBasePrecision: ZERO,
          isEth: false,
        },
        positionType: 'Multiply',
        marketPrice: new BigNumber(20032),
        targetMultiple: new BigNumber(2),
        slippage: defaultSlippage,
        takeFeeAsFromToken: true,
      },
      [`${tokens.WBTC}:${tokens.USDC}_B`]: {
        collateralToken: {
          symbol: tokens.WBTC,
          precision: WBTCPrecision,
          address: ADDRESSES.main.WBTC,
          depositAmountInBasePrecision: amountToWei(new BigNumber(6), WBTCPrecision),
          isEth: false,
        },
        debtToken: {
          symbol: tokens.USDC,
          precision: USDCPrecision,
          address: ADDRESSES.main.USDC,
          depositAmountInBasePrecision: ZERO,
          isEth: false,
        },
        positionType: 'Multiply',
        marketPrice: new BigNumber(20032),
        targetMultiple: new BigNumber(2),
        slippage: defaultSlippage,
        takeFeeAsFromToken: false,
      },
    }

    describe(`With ${tokens.STETH} collateral & ${tokens.ETH} debt`, function () {
      gasHelper = gasEstimateHelper()
      let userStEthReserveData: AAVEReserveData
      let userWethReserveData: AAVEReserveData
      let feeRecipientBalanceBefore: BigNumber
      let actualPositionAfterOpening: IPosition
      let positionTransition: IPositionTransition
      let tx: ContractReceipt
      let txStatus: boolean

      before(async function () {
        ;({
          actualPositionAfterOpening,
          positionTransition,
          tx,
          txStatus,
          userCollateralReserveDataAfterOpening: userStEthReserveData,
          userDebtReserveDataAfterOpening: userWethReserveData,
          feeRecipientBalanceBefore,
        } = await openPosition({
          scenario: scenarios[`${tokens.STETH}:${tokens.ETH}`],
          userAddress,
          isDPMProxy: false,
          gasHelper,
        }))

        gasHelper.save(tx)
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
          actualPositionAfterOpening.riskRatio.multiple,
        )
      })

      it('Should collect fee', async function () {
        const feeRecipientBalanceAfter = await balanceOf(
          ADDRESSES.main.WETH,
          ADDRESSES.main.feeRecipient,
          { config },
        )

        expectToBeEqual(
          new BigNumber(positionTransition.simulation.swap.tokenFee),
          feeRecipientBalanceAfter.minus(feeRecipientBalanceBefore),
        )
      })

      after(() => {
        gasHelper.print()
      })
    })
    describe(`With ${tokens.ETH} collateral (+dep) & ${tokens.USDC} debt`, function () {
      gasHelper = gasEstimateHelper()
      let userWethReserveData: AAVEReserveData
      let userUSDCReserveData: AAVEReserveData
      let feeRecipientBalanceBefore: BigNumber
      let actualPositionAfterOpening: IPosition
      let positionTransition: IPositionTransition
      let tx: ContractReceipt
      let txStatus: boolean

      before(async function () {
        ;({
          actualPositionAfterOpening,
          positionTransition,
          tx,
          txStatus,
          userCollateralReserveDataAfterOpening: userWethReserveData,
          userDebtReserveDataAfterOpening: userUSDCReserveData,
          feeRecipientBalanceBefore,
        } = await openPosition({
          scenario: scenarios[`${tokens.ETH}:${tokens.USDC}`],
          userAddress,
          isDPMProxy: false,
          gasHelper,
        }))

        gasHelper.save(tx)
      })

      it('Tx should pass', function () {
        expect(txStatus).to.be.true
      })

      it('Should draw debt according to multiple', function () {
        expect(
          new BigNumber(positionTransition.simulation.position.debt.amount.toString()).toString(),
        ).to.be.oneOf([
          new BigNumber(userUSDCReserveData.currentVariableDebt.toString()).plus(ONE).toFixed(0),
          new BigNumber(userUSDCReserveData.currentVariableDebt.toString()).toFixed(0),
          new BigNumber(userUSDCReserveData.currentVariableDebt.toString()).minus(ONE).toFixed(0),
        ])
      })

      it(`Should deposit all ${tokens.ETH} tokens to aave`, function () {
        expectToBe(
          new BigNumber(userWethReserveData.currentATokenBalance.toString()).toFixed(0),
          'gte',
          positionTransition.simulation.position.collateral.amount,
        )
      })

      it('Should achieve target multiple', function () {
        expectToBe(
          positionTransition.simulation.position.riskRatio.multiple,
          'gte',
          actualPositionAfterOpening.riskRatio.multiple,
        )
      })

      it('Should collect fee', async function () {
        const feeRecipientBalanceAfter = await balanceOf(
          ADDRESSES.main.USDC,
          ADDRESSES.main.feeRecipient,
          { config },
        )

        expectToBeEqual(
          new BigNumber(positionTransition.simulation.swap.tokenFee),
          feeRecipientBalanceAfter.minus(feeRecipientBalanceBefore),
        )
      })

      after(() => {
        gasHelper.print()
      })
    })
    describe(`With ${tokens.WBTC} collateral & ${tokens.USDC} debt`, function () {
      gasHelper = gasEstimateHelper()
      let userWBTCReserveData: AAVEReserveData
      let userUSDCReserveData: AAVEReserveData
      let feeRecipientBalanceBefore: BigNumber
      let actualPositionAfterOpening: IPosition
      let positionTransition: IPositionTransition
      let tx: ContractReceipt
      let txStatus: boolean

      before(async function () {
        ;({
          actualPositionAfterOpening,
          positionTransition,
          tx,
          txStatus,
          userCollateralReserveDataAfterOpening: userWBTCReserveData,
          userDebtReserveDataAfterOpening: userUSDCReserveData,
          feeRecipientBalanceBefore,
        } = await openPosition({
          scenario: scenarios[`${tokens.WBTC}:${tokens.USDC}_A`],
          userAddress,
          isDPMProxy: false,
          gasHelper,
        }))

        gasHelper.save(tx)
      })

      it('Tx should pass', function () {
        expect(txStatus).to.be.true
      })

      it('Should draw debt according to multiple', function () {
        expect(
          new BigNumber(positionTransition.simulation.position.debt.amount.toString()).toString(),
        ).to.be.oneOf([
          new BigNumber(userUSDCReserveData.currentVariableDebt.toString()).plus(ONE).toFixed(0),
          new BigNumber(userUSDCReserveData.currentVariableDebt.toString()).toFixed(0),
          new BigNumber(userUSDCReserveData.currentVariableDebt.toString()).minus(ONE).toFixed(0),
        ])
      })

      it(`Should deposit all ${tokens.WBTC} tokens to aave`, function () {
        expectToBe(
          new BigNumber(userWBTCReserveData.currentATokenBalance.toString()).toFixed(0),
          'gte',
          positionTransition.simulation.position.collateral.amount,
        )
      })

      it('Should achieve target multiple', function () {
        expectToBe(
          positionTransition.simulation.position.riskRatio.multiple,
          'gte',
          actualPositionAfterOpening.riskRatio.multiple,
        )
      })

      it('Should collect fee', async function () {
        const feeRecipientBalanceAfter = await balanceOf(
          ADDRESSES.main.USDC,
          ADDRESSES.main.feeRecipient,
          { config },
        )

        expectToBeEqual(
          new BigNumber(positionTransition.simulation.swap.tokenFee),
          feeRecipientBalanceAfter.minus(feeRecipientBalanceBefore),
        )
      })

      after(() => {
        gasHelper.print()
      })
    })
    describe(`With ${tokens.WBTC} collateral (+take fee from coll) & ${tokens.USDC} debt`, function () {
      gasHelper = gasEstimateHelper()
      let userWBTCReserveData: AAVEReserveData
      let userUSDCReserveData: AAVEReserveData
      let feeRecipientBalanceBefore: BigNumber
      let actualPositionAfterOpening: IPosition
      let positionTransition: IPositionTransition
      let tx: ContractReceipt
      let txStatus: boolean

      before(async function () {
        ;({
          actualPositionAfterOpening,
          positionTransition,
          tx,
          txStatus,
          userCollateralReserveDataAfterOpening: userWBTCReserveData,
          userDebtReserveDataAfterOpening: userUSDCReserveData,
          feeRecipientBalanceBefore,
        } = await openPosition({
          scenario: scenarios[`${tokens.WBTC}:${tokens.USDC}_B`],
          userAddress,
          isDPMProxy: false,
          gasHelper,
        }))

        gasHelper.save(tx)
      })

      it('Tx should pass', function () {
        expect(txStatus).to.be.true
      })

      it('Should draw debt according to multiple', function () {
        expect(
          new BigNumber(positionTransition.simulation.position.debt.amount.toString()).toString(),
        ).to.be.oneOf([
          new BigNumber(userUSDCReserveData.currentVariableDebt.toString()).plus(ONE).toFixed(0),
          new BigNumber(userUSDCReserveData.currentVariableDebt.toString()).toFixed(0),
          new BigNumber(userUSDCReserveData.currentVariableDebt.toString()).minus(ONE).toFixed(0),
        ])
      })

      it(`Should deposit all ${tokens.WBTC} tokens to aave`, function () {
        expectToBe(
          new BigNumber(userWBTCReserveData.currentATokenBalance.toString()).toFixed(0),
          'gte',
          positionTransition.simulation.position.collateral.amount,
        )
      })

      it('Should achieve target multiple', function () {
        expectToBe(
          positionTransition.simulation.position.riskRatio.multiple,
          'gte',
          actualPositionAfterOpening.riskRatio.multiple,
        )
      })

      it('Should collect fee', async function () {
        const feeRecipientBalanceAfter = await balanceOf(
          ADDRESSES.main.WBTC,
          ADDRESSES.main.feeRecipient,
          { config },
        )

        expectToBe(
          new BigNumber(positionTransition.simulation.swap.tokenFee),
          'lte',
          feeRecipientBalanceAfter.minus(feeRecipientBalanceBefore),
        )
      })

      after(() => {
        gasHelper.print()
      })
    })
  })

  describe('Open Position: With [1inch] Swap', function () {
    /** Slippages are between 0 and 1. So, 0.1 === 10% slippage */
    const scenarios: Record<string, OpenPositionScenario> = {
      [`${tokens.STETH}:${tokens.ETH}`]: {
        collateralToken: {
          symbol: tokens.STETH,
          precision: TYPICAL_PRECISION,
          address: ADDRESSES.main.stETH,
          depositAmountInBasePrecision: ZERO,
          isEth: false,
        },
        debtToken: {
          symbol: tokens.ETH,
          precision: TYPICAL_PRECISION,
          address: ADDRESSES.main.WETH,
          depositAmountInBasePrecision: amountToWei(new BigNumber(1), TYPICAL_PRECISION),
          isEth: true,
        },
        positionType: 'Earn',
        getSwapData: getOneInchCall,
        targetMultiple: new BigNumber(2),
        slippage: defaultSlippage,
        takeFeeAsFromToken: true,
      },
      [`${tokens.ETH}:${tokens.USDC}`]: {
        collateralToken: {
          symbol: tokens.ETH,
          precision: TYPICAL_PRECISION,
          address: ADDRESSES.main.WETH,
          depositAmountInBasePrecision: amountToWei(new BigNumber(1), TYPICAL_PRECISION),
          isEth: true,
        },
        debtToken: {
          symbol: tokens.USDC,
          precision: USDCPrecision,
          address: ADDRESSES.main.USDC,
          depositAmountInBasePrecision: ZERO,
          isEth: false,
        },
        positionType: 'Multiply',
        getSwapData: getOneInchCall,
        targetMultiple: new BigNumber(2),
        slippage: defaultSlippage,
        takeFeeAsFromToken: true,
      },
    }

    describe(`With ${tokens.STETH} collateral & ${tokens.ETH} debt`, function () {
      gasHelper = gasEstimateHelper()
      let userStEthReserveData: AAVEReserveData
      let userWethReserveData: AAVEReserveData
      let feeRecipientBalanceBefore: BigNumber
      let actualPositionAfterOpening: IPosition
      let positionTransition: IPositionTransition
      let tx: ContractReceipt
      let txStatus: boolean

      before(async function () {
        const shouldRun1InchTests = process.env.RUN_1INCH_TESTS === '1'
        if (!shouldRun1InchTests) {
          this.skip()
        }

        ;({
          actualPositionAfterOpening,
          positionTransition,
          tx,
          txStatus,
          userCollateralReserveDataAfterOpening: userStEthReserveData,
          userDebtReserveDataAfterOpening: userWethReserveData,
          feeRecipientBalanceBefore,
        } = await openPosition({
          scenario: scenarios[`${tokens.STETH}:${tokens.ETH}`],
          userAddress,
          isDPMProxy: false,
          gasHelper,
        }))

        gasHelper.save(tx)
      })

      it('Tx should pass', function () {
        expect(txStatus).to.be.true
      })

      it('Should draw debt according to multiple', function () {
        expectToBeEqual(
          positionTransition.simulation.position.debt.amount.toFixed(0),
          new BigNumber(userWethReserveData.currentVariableDebt.toString()),
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
          actualPositionAfterOpening.riskRatio.multiple,
        )
      })

      it('Should collect fee', async function () {
        const feeRecipientBalanceAfter = await balanceOf(
          ADDRESSES.main.WETH,
          ADDRESSES.main.feeRecipient,
          { config },
        )

        const actualFees = feeRecipientBalanceAfter.minus(feeRecipientBalanceBefore)
        expectToBeEqual(
          new BigNumber(positionTransition.simulation.swap.tokenFee.toString()).toFixed(0),
          actualFees,
        )
      })
    })
    describe(`With ${tokens.ETH} collateral & ${tokens.USDC} debt`, function () {
      gasHelper = gasEstimateHelper()
      let userUSDCReserveData: AAVEReserveData
      let userWethReserveData: AAVEReserveData
      let feeRecipientBalanceBefore: BigNumber
      let actualPositionAfterOpening: IPosition
      let positionTransition: IPositionTransition
      let tx: ContractReceipt
      let txStatus: boolean

      before(async function () {
        const shouldRun1InchTests = process.env.RUN_1INCH_TESTS === '1'
        if (!shouldRun1InchTests) {
          this.skip()
        }

        ;({
          actualPositionAfterOpening,
          positionTransition,
          tx,
          txStatus,
          userCollateralReserveDataAfterOpening: userWethReserveData,
          userDebtReserveDataAfterOpening: userUSDCReserveData,
          feeRecipientBalanceBefore,
        } = await openPosition({
          scenario: scenarios[`${tokens.ETH}:${tokens.USDC}`],
          userAddress,
          isDPMProxy: false,
          gasHelper,
        }))

        gasHelper.save(tx)
      })

      it('Tx should pass', function () {
        expect(txStatus).to.be.true
      })

      it('Should draw debt according to multiple', function () {
        expectToBeEqual(
          positionTransition.simulation.position.debt.amount.toFixed(0),
          new BigNumber(userUSDCReserveData.currentVariableDebt.toString()),
        )
      })

      it(`Should deposit all ${tokens.ETH} tokens to aave`, function () {
        expectToBe(
          new BigNumber(userWethReserveData.currentATokenBalance.toString()).toFixed(0),
          'gte',
          positionTransition.simulation.position.collateral.amount,
        )
      })

      it('Should achieve target multiple', function () {
        expectToBe(
          positionTransition.simulation.position.riskRatio.multiple,
          'gte',
          actualPositionAfterOpening.riskRatio.multiple,
        )
      })

      it('Should collect fee', async function () {
        const feeRecipientBalanceAfter = await balanceOf(
          ADDRESSES.main.USDC,
          ADDRESSES.main.feeRecipient,
          { config },
        )

        const actualFees = feeRecipientBalanceAfter.minus(feeRecipientBalanceBefore)
        expect(
          new BigNumber(positionTransition.simulation.swap.tokenFee.toString()).toFixed(0),
        ).to.be.oneOf([
          new BigNumber(actualFees.toString()).plus(ONE).toFixed(0),
          new BigNumber(actualFees.toString()).toFixed(0),
          new BigNumber(actualFees.toString()).minus(ONE).toFixed(0),
        ])
      })
    })
  })
})
