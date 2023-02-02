import AAVEDataProviderABI from '@abi/external/aave/v2/protocolDataProvider.json'
import { JsonRpcProvider } from '@ethersproject/providers'
import {
  AAVETokens,
  ADDRESSES,
  IPosition,
  IPositionTransition,
  ONE,
  OPERATION_NAMES,
  Position,
  protocols,
  strategies,
  TYPICAL_PRECISION,
  ZERO,
} from '@oasisdex/oasis-actions/src'
import { amountFromWei } from '@oasisdex/oasis-actions/src/helpers'
import { PositionType } from '@oasisdex/oasis-actions/src/types/PositionType'
import aavePriceOracleABI from 'abi/external/aave/v2/aavePriceOracle.json'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { loadFixture } from 'ethereum-waffle'
import { Contract, ethers, Signer } from 'ethers'
import hre from 'hardhat'

import AAVELendigPoolABI from '../../abi/external/aave/v2/lendingPool.json'
import ERC20ABI from '../../abi/IERC20.json'
import { executeThroughProxy } from '../../helpers/deploy'
import { resetNodeToLatestBlock } from '../../helpers/init'
import { restoreSnapshot } from '../../helpers/restoreSnapshot'
import { getOneInchCall } from '../../helpers/swap/OneInchCall'
import { oneInchCallMock } from '../../helpers/swap/OneInchCallMock'
import { swapUniswapTokens } from '../../helpers/swap/uniswap'
import { RuntimeConfig } from '../../helpers/types/common'
import { amountToWei, balanceOf } from '../../helpers/utils'
import { acceptedFeeToken } from '../../packages/oasis-actions/src/helpers/swap/acceptedFeeToken'
import { mainnetAddresses } from '../addresses'
import { testBlockNumber } from '../config'
import { tokens } from '../constants'
import { DeployedSystemInfo, deploySystem } from '../deploySystem'
import { initialiseConfig } from '../fixtures'
import { expectToBe, TESTING_OFFSET } from '../utils'

describe(`Strategy | AAVE | Adjust Position`, async function () {
  let aaveLendingPool: Contract
  let aaveDataProvider: Contract
  let provider: JsonRpcProvider
  let config: RuntimeConfig
  let signer: Signer
  let userAddress: string

  before(async function () {
    ;({ config, provider, signer, address: userAddress } = await loadFixture(initialiseConfig))

    aaveLendingPool = new Contract(
      ADDRESSES.main.aave.MainnetLendingPool,
      AAVELendigPoolABI,
      provider,
    )

    aaveDataProvider = new Contract(ADDRESSES.main.aave.DataProvider, AAVEDataProviderABI, provider)
  })

  describe('[Uniswap]', () => {
    const multiple = new BigNumber(2)
    const slippage = new BigNumber(0.1)

    let positionTransition: IPositionTransition
    let openTxStatus: boolean
    let txStatus: boolean

    async function setupAdjustPositionTest(
      collateralToken: {
        depositOnOpenAmountInWei: BigNumber
        depositOnAdjustAmountInWei: BigNumber
        symbol: AAVETokens
        address: string
        precision: number
        isEth: boolean
      },
      debtToken: {
        depositOnOpenAmountInWei: BigNumber
        depositOnAdjustAmountInWei: BigNumber
        symbol: AAVETokens
        address: string
        precision: number
        isEth: boolean
      },
      adjustToMultiple: BigNumber,
      mockMarketPriceOnOpen: BigNumber,
      mockMarketPriceOnAdjust: BigNumber,
      user: string,
      positionType: PositionType,
      blockNumber?: number,
    ) {
      const _blockNumber = blockNumber || testBlockNumber
      const { snapshot } = await restoreSnapshot({
        config,
        provider,
        blockNumber: _blockNumber,
        useFallbackSwap: true,
      })

      const system = snapshot.deployed.system

      /**
       * Need to have correct tokens in hand before
       * to marry up with what user is depositing
       */
      const swapETHtoDepositTokens = amountToWei(new BigNumber(100))
      !debtToken.isEth &&
        (debtToken.depositOnOpenAmountInWei.gt(ZERO) ||
          debtToken.depositOnAdjustAmountInWei.gt(ZERO)) &&
        (await swapUniswapTokens(
          ADDRESSES.main.WETH,
          debtToken.address,
          swapETHtoDepositTokens.toFixed(0),
          ONE.toFixed(0),
          config.address,
          config,
        ))

      !collateralToken.isEth &&
        (collateralToken.depositOnOpenAmountInWei.gt(ZERO) ||
          collateralToken.depositOnAdjustAmountInWei.gt(ZERO)) &&
        (await swapUniswapTokens(
          ADDRESSES.main.WETH,
          collateralToken.address,
          swapETHtoDepositTokens.toFixed(0),
          ONE.toFixed(0),
          config.address,
          config,
        ))

      const addresses = {
        ...mainnetAddresses,
        operationExecutor: system.common.operationExecutor.address,
      }

      if (!collateralToken.isEth) {
        const COLL_TOKEN = new ethers.Contract(collateralToken.address, ERC20ABI, provider)
        await COLL_TOKEN.connect(signer).approve(
          system.common.userProxyAddress,
          collateralToken.depositOnOpenAmountInWei.toFixed(0),
        )
      }
      if (!debtToken.isEth) {
        const DEBT_TOKEN = new ethers.Contract(debtToken.address, ERC20ABI, provider)
        await DEBT_TOKEN.connect(signer).approve(
          system.common.userProxyAddress,
          debtToken.depositOnOpenAmountInWei.toFixed(0),
        )
      }

      const ethDepositAmt = (debtToken.isEth ? debtToken.depositOnOpenAmountInWei : ZERO).plus(
        collateralToken.isEth ? collateralToken.depositOnOpenAmountInWei : ZERO,
      )

      // Set up the position
      const proxy = system.common.dsProxy.address
      const openPositionTransition = await strategies.aave.open(
        {
          depositedByUser: {
            debtToken: { amountInBaseUnit: debtToken.depositOnOpenAmountInWei },
            collateralToken: { amountInBaseUnit: collateralToken.depositOnOpenAmountInWei },
          },
          slippage,
          multiple,
          positionType: 'Earn',
          debtToken: { symbol: debtToken.symbol, precision: debtToken.precision },
          collateralToken: {
            symbol: collateralToken.symbol,
            precision: collateralToken.precision,
          },
        },
        {
          isDPMProxy: false,
          addresses,
          provider,
          protocol: {
            version: 2,
            getCurrentPosition: strategies.aave.view,
            getProtocolData: protocols.aave.getAaveProtocolData,
          },
          getSwapData: oneInchCallMock(mockMarketPriceOnOpen, {
            from: debtToken.precision,
            to: collateralToken.precision,
          }),
          proxy,
          user: user,
        },
      )

      const [_openTxStatus] = await executeThroughProxy(
        system.common.dsProxy.address,
        {
          address: system.common.operationExecutor.address,
          calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
            openPositionTransition.transaction.calls,
            openPositionTransition.transaction.operationName,
          ]),
        },
        signer,
        ethDepositAmt.toFixed(0),
      )
      const openTxStatus = _openTxStatus

      if (!collateralToken.isEth) {
        const COLL_TOKEN = new ethers.Contract(collateralToken.address, ERC20ABI, provider)
        await COLL_TOKEN.connect(signer).approve(
          system.common.userProxyAddress,
          collateralToken.depositOnAdjustAmountInWei.toFixed(0),
        )
      }
      if (!debtToken.isEth) {
        const DEBT_TOKEN = new ethers.Contract(debtToken.address, ERC20ABI, provider)
        await DEBT_TOKEN.connect(signer).approve(
          system.common.userProxyAddress,
          debtToken.depositOnAdjustAmountInWei.toFixed(0),
        )
      }

      const userCollateralReserveData = await aaveDataProvider.getUserReserveData(
        collateralToken.address,
        system.common.dsProxy.address,
      )

      const userDebtReserveData = await aaveDataProvider.getUserReserveData(
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

      const positionAfterOpen = new Position(
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
        openPositionTransition.simulation.position.category,
      )

      // Now adjust the position
      const isIncreasingRisk = adjustToMultiple.gte(positionAfterOpen.riskRatio.multiple)
      const isDecreasingRisk = !isIncreasingRisk
      const positionTransition = await strategies.aave.adjust(
        {
          depositedByUser: {
            debtInWei: debtToken.depositOnAdjustAmountInWei,
            collateralInWei: collateralToken.depositOnAdjustAmountInWei,
          },
          slippage,
          multiple: adjustToMultiple,
          debtToken: { symbol: debtToken.symbol, precision: debtToken.precision },
          collateralToken: {
            symbol: collateralToken.symbol,
            precision: collateralToken.precision,
          },
        },
        {
          isDPMProxy: false,
          addresses,
          provider,
          currentPosition: positionAfterOpen,
          getSwapData: oneInchCallMock(mockMarketPriceOnAdjust, {
            from: isIncreasingRisk ? debtToken.precision : collateralToken.precision,
            to: isIncreasingRisk ? collateralToken.precision : debtToken.precision,
          }),
          proxy: system.common.dsProxy.address,
          user: user,
        },
      )

      // TODO: Will need updating to use new helper
      let isFeeFromDebtToken = true
      if (isIncreasingRisk) {
        isFeeFromDebtToken =
          acceptedFeeToken({ fromToken: debtToken.symbol, toToken: collateralToken.symbol }) ===
          'sourceToken'
      }
      if (isDecreasingRisk) {
        isFeeFromDebtToken =
          acceptedFeeToken({ fromToken: collateralToken.symbol, toToken: debtToken.symbol }) ===
          'targetToken'
      }
      const feeRecipientBalanceBeforeAdjust = await balanceOf(
        isFeeFromDebtToken ? debtToken.address : collateralToken.address,
        ADDRESSES.main.feeRecipient,
        { config },
      )

      const userEthBalanceBeforeTx = await balanceOf(ADDRESSES.main.ETH, config.address, {
        config,
      })

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

      const afterAdjustUserAccountData = await aaveLendingPool.getUserAccountData(
        system.common.dsProxy.address,
      )

      const userCollateralReserveDataAfterAdjust = await aaveDataProvider.getUserReserveData(
        collateralToken.address,
        system.common.dsProxy.address,
      )

      const userDebtReserveDataAfterAdjust = await aaveDataProvider.getUserReserveData(
        debtToken.address,
        system.common.dsProxy.address,
      )

      const aavePriceOracleAfterAdjust = new ethers.Contract(
        addresses.aavePriceOracle,
        aavePriceOracleABI,
        provider,
      )

      const aaveCollateralTokenPriceInEthAfterAdjust = collateralToken.isEth
        ? ONE
        : await aavePriceOracleAfterAdjust
            .getAssetPrice(collateralToken.address)
            .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString())))

      const aaveDebtTokenPriceInEthAfterAdjust = debtToken.isEth
        ? ONE
        : await aavePriceOracleAfterAdjust
            .getAssetPrice(debtToken.address)
            .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString())))

      const oracleAfterAdjust = aaveCollateralTokenPriceInEthAfterAdjust.div(
        aaveDebtTokenPriceInEthAfterAdjust,
      )

      const newDebt = {
        amount: new BigNumber(userDebtReserveDataAfterAdjust.currentVariableDebt.toString()),
        precision: debtToken.precision,
        symbol: debtToken.symbol,
      }
      const newCollateral = {
        amount: new BigNumber(userCollateralReserveDataAfterAdjust.currentATokenBalance.toString()),
        precision: collateralToken.precision,
        symbol: collateralToken.symbol,
      }

      const finalPosition = new Position(
        newDebt,
        newCollateral,
        oracleAfterAdjust,
        positionTransition.simulation.position.category,
      )

      return {
        system,
        address: config.address,
        positionTransition,
        feeRecipientBalanceBefore: feeRecipientBalanceBeforeAdjust,
        openTxStatus,
        txStatus,
        tx,
        oracle,
        positionAfterOpen,
        finalPosition,
        userEthBalanceBeforeTx,
        userCollateralReserveData: userCollateralReserveDataAfterAdjust,
        userDebtReserveData: userCollateralReserveDataAfterAdjust,
        userAccountData: afterAdjustUserAccountData,
      }
    }

    describe(`Increase Multiple: With ${tokens.STETH} collateral & ${tokens.ETH} debt`, function () {
      const depositAmount = amountToWei(new BigNumber(1))
      const adjustMultipleUp = new BigNumber(3.5)

      let feeRecipientWethBalanceBefore: BigNumber
      let finalPosition: IPosition

      before(async () => {
        const setup = await setupAdjustPositionTest(
          {
            depositOnOpenAmountInWei: ZERO,
            depositOnAdjustAmountInWei: ZERO,
            symbol: tokens.STETH,
            address: ADDRESSES.main.STETH,
            precision: 18,
            isEth: false,
          },
          {
            depositOnOpenAmountInWei: depositAmount,
            depositOnAdjustAmountInWei: depositAmount,
            symbol: tokens.ETH,
            address: ADDRESSES.main.WETH,
            precision: 18,
            isEth: true,
          },
          adjustMultipleUp,
          new BigNumber(0.9759),
          new BigNumber(0.9759),
          userAddress,
          'Earn',
        )
        txStatus = setup.txStatus
        openTxStatus = setup.openTxStatus
        positionTransition = setup.positionTransition
        finalPosition = setup.finalPosition
        feeRecipientWethBalanceBefore = setup.feeRecipientBalanceBefore
      })

      it('Open Tx should pass', () => {
        expect(openTxStatus).to.be.true
      })

      it('Adjust Tx should pass', () => {
        expect(txStatus).to.be.true
      })

      it('Should draw debt according to multiple', async () => {
        expectToBe(
          finalPosition.debt.amount.toString(),
          'gte',
          positionTransition.simulation.position.debt.amount.toString(),
        )
      })

      it('Should collect fee', async () => {
        const feeRecipientWethBalanceAfter = await balanceOf(
          ADDRESSES.main.WETH,
          ADDRESSES.main.feeRecipient,
          { config },
        )

        const actualWethFees = feeRecipientWethBalanceAfter.minus(feeRecipientWethBalanceBefore)

        // Test for equivalence within slippage adjusted range when taking fee from target token
        expectToBe(
          new BigNumber(
            positionTransition.simulation.swap.tokenFee
              .div(ONE.minus(slippage).minus(TESTING_OFFSET))
              .toString(),
          ).toFixed(0),
          'gte',
          actualWethFees,
        )

        expectToBe(positionTransition.simulation.swap.tokenFee, 'lte', actualWethFees)
      })
    })

    describe(`Increase Multiple: With ${tokens.ETH} collateral & ${tokens.USDC} debt`, function () {
      const depositAmount = amountToWei(new BigNumber(1))
      const adjustMultipleUp = new BigNumber(3.5)

      let feeRecipientUSDCBalanceBefore: BigNumber
      let finalPosition: IPosition

      before(async () => {
        const setup = await setupAdjustPositionTest(
          {
            depositOnOpenAmountInWei: depositAmount,
            depositOnAdjustAmountInWei: depositAmount,
            symbol: tokens.ETH,
            address: ADDRESSES.main.WETH,
            precision: 18,
            isEth: true,
          },
          {
            depositOnOpenAmountInWei: ZERO,
            depositOnAdjustAmountInWei: ZERO,
            symbol: tokens.USDC,
            address: ADDRESSES.main.USDC,
            precision: 6,
            isEth: false,
          },
          adjustMultipleUp,
          new BigNumber(1351),
          new BigNumber(1351),
          userAddress,
          'Multiply',
        )
        txStatus = setup.txStatus
        openTxStatus = setup.openTxStatus
        positionTransition = setup.positionTransition
        finalPosition = setup.finalPosition
        feeRecipientUSDCBalanceBefore = setup.feeRecipientBalanceBefore
      })

      it('Open Tx should pass', () => {
        expect(openTxStatus).to.be.true
      })

      it('Adjust Tx should pass', () => {
        expect(txStatus).to.be.true
      })

      it('Should draw debt according to multiple', async () => {
        expectToBe(
          finalPosition.debt.amount.toString(),
          'gte',
          positionTransition.simulation.position.debt.amount.toString(),
        )
      })

      it('Should collect fee', async () => {
        const feeRecipientUSDCBalanceAfter = await balanceOf(
          ADDRESSES.main.USDC,
          ADDRESSES.main.feeRecipient,
          { config },
        )

        const actualUSDCFees = feeRecipientUSDCBalanceAfter.minus(feeRecipientUSDCBalanceBefore)

        // Test for equivalence within slippage adjusted range when taking fee from target token
        expectToBe(
          new BigNumber(
            positionTransition.simulation.swap.tokenFee
              .div(ONE.minus(slippage).minus(TESTING_OFFSET))
              .toString(),
          ).toFixed(0),
          'gte',
          actualUSDCFees,
        )

        expectToBe(positionTransition.simulation.swap.tokenFee, 'lte', actualUSDCFees)
      })
    })

    describe(`Increase Multiple: With ${tokens.WBTC} collateral & ${tokens.USDC} debt`, function () {
      const depositWBTCAmount = new BigNumber(1)
      const adjustMultipleUp = new BigNumber(3.5)

      let feeRecipientUSDCBalanceBefore: BigNumber
      let finalPosition: IPosition

      before(async () => {
        const setup = await setupAdjustPositionTest(
          {
            depositOnOpenAmountInWei: amountToWei(depositWBTCAmount, 8),
            depositOnAdjustAmountInWei: amountToWei(depositWBTCAmount, 8),
            symbol: tokens.WBTC,
            address: ADDRESSES.main.WBTC,
            precision: 8,
            isEth: false,
          },
          {
            depositOnOpenAmountInWei: ZERO,
            depositOnAdjustAmountInWei: ZERO,
            symbol: tokens.USDC,
            address: ADDRESSES.main.USDC,
            precision: 6,
            isEth: false,
          },
          adjustMultipleUp,
          new BigNumber(20032),
          new BigNumber(20032),
          userAddress,
          'Multiply',
        )
        txStatus = setup.txStatus
        openTxStatus = setup.openTxStatus
        positionTransition = setup.positionTransition
        finalPosition = setup.finalPosition
        feeRecipientUSDCBalanceBefore = setup.feeRecipientBalanceBefore
      })

      it('Open Tx should pass', () => {
        expect(openTxStatus).to.be.true
      })

      it('Adjust Tx should pass', () => {
        expect(txStatus).to.be.true
      })

      it('Should draw debt according to multiple', async () => {
        expectToBe(
          finalPosition.debt.amount.toString(),
          'gte',
          positionTransition.simulation.position.debt.amount.toString(),
        )
      })

      it('Should collect fee', async () => {
        const feeRecipientUSDCBalanceAfter = await balanceOf(
          ADDRESSES.main.USDC,
          ADDRESSES.main.feeRecipient,
          { config },
        )

        const actualUSDCFees = feeRecipientUSDCBalanceAfter.minus(feeRecipientUSDCBalanceBefore)

        // Test for equivalence within slippage adjusted range when taking fee from target token
        expectToBe(
          new BigNumber(
            positionTransition.simulation.swap.tokenFee
              .div(ONE.minus(slippage).minus(TESTING_OFFSET))
              .toString(),
          ).toFixed(0),
          'gte',
          actualUSDCFees,
        )

        expectToBe(positionTransition.simulation.swap.tokenFee, 'lte', actualUSDCFees)
      })
    })

    describe(`Decrease Multiple: With ${tokens.STETH} collateral & ${tokens.ETH} debt`, function () {
      const depositAmount = amountToWei(new BigNumber(1))
      const adjustMultipleDown = new BigNumber(1.5)

      let feeRecipientWethBalanceBefore: BigNumber
      let finalPosition: IPosition

      before(async () => {
        const setup = await setupAdjustPositionTest(
          {
            depositOnOpenAmountInWei: ZERO,
            depositOnAdjustAmountInWei: ZERO,
            symbol: tokens.STETH,
            address: ADDRESSES.main.STETH,
            precision: 18,
            isEth: false,
          },
          {
            depositOnOpenAmountInWei: depositAmount,
            depositOnAdjustAmountInWei: ZERO,
            symbol: tokens.ETH,
            address: ADDRESSES.main.WETH,
            precision: 18,
            isEth: true,
          },
          adjustMultipleDown,
          new BigNumber(0.9759),
          ONE.div(new BigNumber(0.9759)),
          userAddress,
          'Multiply',
          15697000,
        )
        txStatus = setup.txStatus
        openTxStatus = setup.openTxStatus
        positionTransition = setup.positionTransition
        finalPosition = setup.finalPosition
        feeRecipientWethBalanceBefore = setup.feeRecipientBalanceBefore
      })

      it('Open Tx should pass', () => {
        expect(openTxStatus).to.be.true
      })

      it('Adjust Tx should pass', () => {
        expect(txStatus).to.be.true
      })

      it('Should payback debt according to multiple', async () => {
        expectToBe(
          finalPosition.debt.amount.toString(),
          'lte',
          positionTransition.simulation.position.debt.amount.toString(),
        )
      })

      it('Should decrease collateral according to multiple', async () => {
        expect(finalPosition.collateral.amount.toString()).to.be.oneOf([
          positionTransition.simulation.position.collateral.amount.plus(ONE).toString(),
          positionTransition.simulation.position.collateral.amount.toString(),
        ])
      })

      it('Should collect fee', async () => {
        const feeRecipientWethBalanceAfter = await balanceOf(
          ADDRESSES.main.WETH,
          ADDRESSES.main.feeRecipient,
          { config },
        )

        const actualWethFees = feeRecipientWethBalanceAfter.minus(feeRecipientWethBalanceBefore)
        // Test for equivalence within slippage adjusted range when taking fee from target token
        expectToBe(
          new BigNumber(
            positionTransition.simulation.swap.tokenFee
              .div(ONE.minus(slippage).minus(TESTING_OFFSET))
              .toString(),
          ).toFixed(0),
          'gte',
          actualWethFees,
        )

        expectToBe(positionTransition.simulation.swap.tokenFee, 'lte', actualWethFees)
      })
    })
  })

  describe(`[1inch] Increase Multiple: With ${tokens.STETH} collateral & ${tokens.ETH} debt`, () => {
    const slippage = new BigNumber(0.1)
    const depositAmount = amountToWei(new BigNumber(1))
    const multiple = new BigNumber(2)
    const adjustToMultiple = new BigNumber(3.5)

    let aaveStEthPriceInEth: BigNumber
    let system: DeployedSystemInfo

    let openTxStatus: boolean
    let txStatus: boolean

    let feeRecipientWethBalanceBefore: BigNumber

    let finalPosition: IPosition
    let positionTransition: IPositionTransition

    before(async function () {
      const shouldRun1InchTests = process.env.RUN_1INCH_TESTS === '1'
      if (shouldRun1InchTests) {
        await resetNodeToLatestBlock(provider)
        const { system: _system } = await deploySystem(config, false, false)
        system = _system
        hre.tracer.enabled = process.env.TRACE_TX === 'true' || false

        const addresses = {
          ...mainnetAddresses,
          operationExecutor: system.common.operationExecutor.address,
        }

        feeRecipientWethBalanceBefore = await balanceOf(
          ADDRESSES.main.WETH,
          ADDRESSES.main.feeRecipient,
          { config },
        )

        const proxy = system.common.dsProxy.address
        const debtToken = { symbol: 'ETH' as const }
        const collateralToken = { symbol: 'STETH' as const }
        const openPositionTransition = await strategies.aave.open(
          {
            depositedByUser: {
              debtToken: { amountInBaseUnit: depositAmount },
            },
            slippage,
            multiple,
            debtToken: { symbol: tokens.ETH },
            collateralToken: { symbol: tokens.STETH },
            positionType: 'Earn',
          },
          {
            isDPMProxy: false,
            addresses,
            provider,
            protocol: {
              version: 2,
              getCurrentPosition: strategies.aave.view,
              getProtocolData: protocols.aave.getAaveProtocolData,
            },
            getSwapData: getOneInchCall(system.common.swap.address),
            proxy: system.common.dsProxy.address,
            user: config.address,
          },
        )

        const [_openTxStatus] = await executeThroughProxy(
          system.common.dsProxy.address,
          {
            address: system.common.operationExecutor.address,
            calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
              openPositionTransition.transaction.calls,
              openPositionTransition.transaction.operationName,
            ]),
          },
          signer,
          depositAmount.toFixed(0),
        )
        openTxStatus = _openTxStatus

        const currentPositionBeforeAdjust = await strategies.aave.view(
          {
            proxy,
            collateralToken,
            debtToken,
          },
          {
            addresses,
            provider,
          },
        )

        positionTransition = await strategies.aave.adjust(
          {
            depositedByUser: {
              debtInWei: depositAmount,
            },
            slippage,
            multiple: adjustToMultiple,
            debtToken,
            collateralToken,
          },
          {
            isDPMProxy: false,
            addresses,
            provider,
            getSwapData: getOneInchCall(system.common.swap.address),
            proxy,
            user: config.address,
            currentPosition: currentPositionBeforeAdjust,
          },
        )

        feeRecipientWethBalanceBefore = await balanceOf(
          ADDRESSES.main.WETH,
          ADDRESSES.main.feeRecipient,
          { config },
        )

        const [_txStatus] = await executeThroughProxy(
          system.common.dsProxy.address,
          {
            address: system.common.operationExecutor.address,
            calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
              positionTransition.transaction.calls,
              OPERATION_NAMES.common.CUSTOM_OPERATION,
            ]),
          },
          signer,
          depositAmount.toFixed(0),
        )
        txStatus = _txStatus

        const aavePriceOracle = new ethers.Contract(
          addresses.aavePriceOracle,
          aavePriceOracleABI,
          provider,
        )

        aaveStEthPriceInEth = await aavePriceOracle
          .getAssetPrice(addresses.STETH)
          .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString())))

        const userWethReserveDataAfterAdjust = await aaveDataProvider.getUserReserveData(
          ADDRESSES.main.WETH,
          system.common.dsProxy.address,
        )
        const userStEthReserveDataAfterAdjust = await aaveDataProvider.getUserReserveData(
          ADDRESSES.main.STETH,
          system.common.dsProxy.address,
        )

        const finalDebt = {
          amount: new BigNumber(userWethReserveDataAfterAdjust.currentVariableDebt.toString()),
          precision: TYPICAL_PRECISION,
          symbol: tokens.ETH,
        }
        const finalCollateral = {
          amount: new BigNumber(userStEthReserveDataAfterAdjust.currentATokenBalance.toString()),
          precision: TYPICAL_PRECISION,
          symbol: tokens.STETH,
        }

        finalPosition = new Position(
          finalDebt,
          finalCollateral,
          aaveStEthPriceInEth,
          openPositionTransition.simulation.position.category,
        )
      } else {
        this.skip()
      }

      hre.tracer.enabled = false
    })

    it('Open Position Tx should pass', () => {
      expect(openTxStatus).to.be.true
    })

    it('Adjust Tx should pass', () => {
      expect(txStatus).to.be.true
    })

    it('Should draw debt according to multiple', async () => {
      expectToBe(
        finalPosition.debt.amount.toString(),
        'gte',
        positionTransition.simulation.position.debt.amount.toString(),
      )
    })

    it('Should collect fee', async () => {
      const feeRecipientWethBalanceAfter = await balanceOf(
        ADDRESSES.main.WETH,
        ADDRESSES.main.feeRecipient,
        { config },
      )

      const actualWethFees = feeRecipientWethBalanceAfter.minus(feeRecipientWethBalanceBefore)

      // Test for equivalence within slippage adjusted range when taking fee from target token
      expectToBe(
        new BigNumber(
          positionTransition.simulation.swap.tokenFee
            .div(ONE.minus(slippage).minus(TESTING_OFFSET))
            .toString(),
        ).toFixed(0),
        'gte',
        actualWethFees,
      )

      expectToBe(positionTransition.simulation.swap.tokenFee, 'lte', actualWethFees)
    })
  })

  describe(`[1inch] Increase Multiple: With ${tokens.ETH} collateral & ${tokens.USDC} debt`, () => {
    const slippage = new BigNumber(0.1)
    const depositEthAmount = amountToWei(new BigNumber(1))
    const multiple = new BigNumber(2)
    const ethPrecision = TYPICAL_PRECISION
    const USDCPrecision = 6
    const adjustToMultiple = new BigNumber(2.75)

    let aaveWethPriceInEth: BigNumber
    let system: DeployedSystemInfo

    let openTxStatus: boolean
    let txStatus: boolean

    let feeRecipientUSDCBalanceBefore: BigNumber

    let finalPosition: IPosition
    let positionTransition: IPositionTransition

    before(async function () {
      const shouldRun1InchTests = process.env.RUN_1INCH_TESTS === '1'
      if (shouldRun1InchTests) {
        await resetNodeToLatestBlock(provider)
        const { system: _system } = await deploySystem(config, false, false)
        system = _system
        hre.tracer.enabled = process.env.TRACE_TX === 'true' || false

        const addresses = {
          ...mainnetAddresses,
          operationExecutor: system.common.operationExecutor.address,
        }

        feeRecipientUSDCBalanceBefore = await balanceOf(
          ADDRESSES.main.USDC,
          ADDRESSES.main.feeRecipient,
          { config },
        )

        const proxy = system.common.dsProxy.address
        const debtToken = { symbol: 'USDC' as AAVETokens, precision: USDCPrecision }
        const collateralToken = { symbol: 'ETH' as AAVETokens, precision: ethPrecision }

        const openPositionTransition = await strategies.aave.open(
          {
            depositedByUser: {
              collateralToken: { amountInBaseUnit: depositEthAmount },
            },
            slippage,
            multiple,
            debtToken: { symbol: tokens.USDC, precision: USDCPrecision },
            collateralToken: { symbol: tokens.ETH, precision: ethPrecision },
            positionType: 'Earn',
          },
          {
            isDPMProxy: false,
            addresses,
            provider,
            protocol: {
              version: 2,
              getCurrentPosition: strategies.aave.view,
              getProtocolData: protocols.getAaveProtocolData,
            },
            getSwapData: getOneInchCall(system.common.swap.address),
            proxy: system.common.dsProxy.address,
            user: config.address,
          },
        )

        const [_openTxStatus] = await executeThroughProxy(
          system.common.dsProxy.address,
          {
            address: system.common.operationExecutor.address,
            calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
              openPositionTransition.transaction.calls,
              openPositionTransition.transaction.operationName,
            ]),
          },
          signer,
          depositEthAmount.toFixed(0),
        )
        openTxStatus = _openTxStatus

        const currentPositionBeforeAdjust = await strategies.aave.view(
          {
            proxy,
            collateralToken,
            debtToken,
          },
          {
            addresses,
            provider,
          },
        )

        positionTransition = await strategies.aave.adjust(
          {
            slippage,
            multiple: adjustToMultiple,
            debtToken,
            collateralToken,
          },
          {
            isDPMProxy: false,
            addresses,
            provider,
            getSwapData: getOneInchCall(system.common.swap.address),
            proxy,
            user: config.address,
            currentPosition: currentPositionBeforeAdjust,
          },
        )

        feeRecipientUSDCBalanceBefore = await balanceOf(
          ADDRESSES.main.USDC,
          ADDRESSES.main.feeRecipient,
          { config },
        )

        const [_txStatus] = await executeThroughProxy(
          system.common.dsProxy.address,
          {
            address: system.common.operationExecutor.address,
            calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
              positionTransition.transaction.calls,
              positionTransition.transaction.operationName,
            ]),
          },
          signer,
          '0',
        )
        txStatus = _txStatus

        const aavePriceOracle = new ethers.Contract(
          addresses.aavePriceOracle,
          aavePriceOracleABI,
          provider,
        )

        aaveWethPriceInEth = await aavePriceOracle
          .getAssetPrice(addresses.WETH)
          .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString())))

        const aaveUSDCPriceInEth = await aavePriceOracle
          .getAssetPrice(addresses.USDC)
          .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString())))

        const userWethReserveDataAfterAdjust = await aaveDataProvider.getUserReserveData(
          ADDRESSES.main.WETH,
          system.common.dsProxy.address,
        )
        const userUSDCReserveDataAfterAdjust = await aaveDataProvider.getUserReserveData(
          ADDRESSES.main.USDC,
          system.common.dsProxy.address,
        )

        const finalDebt = {
          amount: new BigNumber(userUSDCReserveDataAfterAdjust.currentVariableDebt.toString()),
          precision: USDCPrecision,
          symbol: tokens.USDC,
        }
        const finalCollateral = {
          amount: new BigNumber(userWethReserveDataAfterAdjust.currentATokenBalance.toString()),
          precision: ethPrecision,
          symbol: tokens.ETH,
        }

        const oracle = aaveWethPriceInEth.div(aaveUSDCPriceInEth)
        finalPosition = new Position(
          finalDebt,
          finalCollateral,
          oracle,
          openPositionTransition.simulation.position.category,
        )
      } else {
        this.skip()
      }

      hre.tracer.enabled = false
    })

    it('Open Position Tx should pass', () => {
      expect(openTxStatus).to.be.true
    })

    it('Adjust Tx should pass', () => {
      expect(txStatus).to.be.true
    })

    it('Should draw debt according to multiple', async () => {
      expectToBe(
        finalPosition.debt.amount.toString(),
        'gte',
        positionTransition.simulation.position.debt.amount.toString(),
      )
    })

    it('Should collect fee', async () => {
      const feeRecipientUSDCBalanceAfter = await balanceOf(
        ADDRESSES.main.USDC,
        ADDRESSES.main.feeRecipient,
        { config },
      )

      const actualUSDCFees = feeRecipientUSDCBalanceAfter.minus(feeRecipientUSDCBalanceBefore)

      // Test for equivalence within slippage adjusted range when taking fee from target token
      expectToBe(
        new BigNumber(
          positionTransition.simulation.swap.tokenFee
            .div(ONE.minus(slippage).minus(TESTING_OFFSET))
            .toString(),
        ).toFixed(0),
        'gte',
        actualUSDCFees,
      )

      expectToBe(positionTransition.simulation.swap.tokenFee, 'lte', actualUSDCFees)
    })
  })

  describe(`[1inch] Decrease Multiple: With ${tokens.STETH} collateral & ${tokens.USDC} debt`, () => {
    const slippage = new BigNumber(0.2)
    const USDCPrecision = 6
    const stETHPrecision = TYPICAL_PRECISION
    const depositAmount = amountToWei(new BigNumber(100), USDCPrecision)
    const multiple = new BigNumber(2)
    const adjustDownToMultiple = new BigNumber(1.3)

    let aaveStEthPriceInEth: BigNumber
    let system: DeployedSystemInfo

    let openTxStatus: boolean
    let txStatus: boolean

    let feeRecipientUSDCBalanceBefore: BigNumber

    let finalPosition: IPosition
    let positionTransition: IPositionTransition

    before(async function () {
      const shouldRun1InchTests = process.env.RUN_1INCH_TESTS === '1'
      if (shouldRun1InchTests) {
        await resetNodeToLatestBlock(provider)
        const { system: _system } = await deploySystem(config, false, false)
        system = _system

        const addresses = {
          ...mainnetAddresses,
          operationExecutor: system.common.operationExecutor.address,
        }

        const proxy = system.common.dsProxy.address
        const debtToken = { symbol: tokens.USDC, precision: USDCPrecision }
        const collateralToken = { symbol: tokens.STETH, precision: stETHPrecision }

        await swapUniswapTokens(
          ADDRESSES.main.WETH,
          ADDRESSES.main.USDC,
          amountToWei(new BigNumber(100)).toFixed(0),
          ONE.toFixed(0),
          config.address,
          config,
        )

        const DEBT_TOKEN = new ethers.Contract(ADDRESSES.main.USDC, ERC20ABI, provider)
        await DEBT_TOKEN.connect(signer).approve(
          system.common.userProxyAddress,
          depositAmount.toFixed(0),
        )

        const openPositionTransition = await strategies.aave.open(
          {
            depositedByUser: {
              debtToken: { amountInBaseUnit: depositAmount },
            },
            positionType: 'Earn',
            slippage,
            multiple,
            debtToken,
            collateralToken,
          },
          {
            isDPMProxy: false,
            addresses,
            provider,
            protocol: {
              version: 2,
              getCurrentPosition: strategies.aave.view,
              getProtocolData: protocols.getAaveProtocolData,
            },
            getSwapData: getOneInchCall(system.common.swap.address, [], true),
            proxy: system.common.dsProxy.address,
            user: config.address,
          },
        )

        const [_openTxStatus] = await executeThroughProxy(
          system.common.dsProxy.address,
          {
            address: system.common.operationExecutor.address,
            calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
              openPositionTransition.transaction.calls,
              openPositionTransition.transaction.operationName,
            ]),
          },
          signer,
          '',
        )
        openTxStatus = _openTxStatus

        const currentPositionBeforeAdjust = await strategies.aave.view(
          {
            proxy,
            collateralToken,
            debtToken,
          },
          {
            addresses,
            provider,
          },
        )

        hre.tracer.enabled = process.env.TRACE_TX === 'true' || false
        positionTransition = await strategies.aave.adjust(
          {
            slippage,
            multiple: adjustDownToMultiple,
            debtToken,
            collateralToken,
          },
          {
            isDPMProxy: false,
            addresses,
            provider,
            getSwapData: getOneInchCall(system.common.swap.address, [], true),
            proxy,
            user: config.address,
            currentPosition: currentPositionBeforeAdjust,
          },
        )

        feeRecipientUSDCBalanceBefore = await balanceOf(
          ADDRESSES.main.USDC,
          ADDRESSES.main.feeRecipient,
          { config },
        )

        const [_txStatus] = await executeThroughProxy(
          system.common.dsProxy.address,
          {
            address: system.common.operationExecutor.address,
            calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
              positionTransition.transaction.calls,
              OPERATION_NAMES.common.CUSTOM_OPERATION,
            ]),
          },
          signer,
          depositAmount.toFixed(0),
        )
        txStatus = _txStatus
        hre.tracer.enabled = false
        const aavePriceOracle = new ethers.Contract(
          addresses.aavePriceOracle,
          aavePriceOracleABI,
          provider,
        )

        aaveStEthPriceInEth = await aavePriceOracle
          .getAssetPrice(addresses.STETH)
          .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString())))

        const userStEthReserveDataAfterAdjust = await aaveDataProvider.getUserReserveData(
          ADDRESSES.main.STETH,
          system.common.dsProxy.address,
        )
        const userUSDCReserveDataAfterAdjust = await aaveDataProvider.getUserReserveData(
          ADDRESSES.main.USDC,
          system.common.dsProxy.address,
        )

        const finalDebt = {
          amount: new BigNumber(userUSDCReserveDataAfterAdjust.currentVariableDebt.toString()),
          precision: debtToken.precision,
          symbol: debtToken.symbol,
        }
        const finalCollateral = {
          amount: new BigNumber(userStEthReserveDataAfterAdjust.currentATokenBalance.toString()),
          precision: collateralToken.precision,
          symbol: collateralToken.symbol,
        }

        finalPosition = new Position(
          finalDebt,
          finalCollateral,
          aaveStEthPriceInEth,
          openPositionTransition.simulation.position.category,
        )
      } else {
        this.skip()
      }
    })

    it('Open Position Tx should pass', () => {
      expect(openTxStatus).to.be.true
    })

    it('Adjust Tx should pass', () => {
      expect(txStatus).to.be.true
    })

    it('Should draw debt according to multiple', async () => {
      expectToBe(
        finalPosition.debt.amount.toString(),
        'gte',
        positionTransition.simulation.position.debt.amount.toString(),
      )
    })

    it('Should collect fee', async () => {
      const feeRecipientUSDCBalanceAfter = await balanceOf(
        ADDRESSES.main.USDC,
        ADDRESSES.main.feeRecipient,
        { config },
      )

      const actualUSDCFees = feeRecipientUSDCBalanceAfter.minus(feeRecipientUSDCBalanceBefore)

      // Test for equivalence within slippage adjusted range when taking fee from target token
      expectToBe(
        new BigNumber(
          positionTransition.simulation.swap.tokenFee
            .div(ONE.minus(slippage).minus(TESTING_OFFSET))
            .toString(),
        ).toFixed(0),
        'gte',
        actualUSDCFees,
      )

      expectToBe(positionTransition.simulation.swap.tokenFee, 'lte', actualUSDCFees)
    })
  })

  describe(`[1inch] Decrease Multiple: With ${tokens.WBTC} collateral & ${tokens.USDC} debt`, () => {
    const slippage = new BigNumber(0.2)
    const USDCPrecision = 6
    const wBTCPrecision = 8
    const depositWBTCAmount = amountToWei(new BigNumber(1), wBTCPrecision)
    const multiple = new BigNumber(2)
    const adjustDownToMultiple = new BigNumber(1.3)

    let aaveWBTCPriceInEthPriceInEth: BigNumber
    let system: DeployedSystemInfo

    let openTxStatus: boolean
    let txStatus: boolean

    let feeRecipientUSDCBalanceBefore: BigNumber

    let finalPosition: IPosition
    let positionTransition: IPositionTransition

    before(async function () {
      const shouldRun1InchTests = process.env.RUN_1INCH_TESTS === '1'
      if (shouldRun1InchTests) {
        await resetNodeToLatestBlock(provider)
        const { system: _system } = await deploySystem(config, false, false)
        system = _system

        const addresses = {
          ...mainnetAddresses,
          operationExecutor: system.common.operationExecutor.address,
        }

        const proxy = system.common.dsProxy.address
        const debtToken = { symbol: tokens.USDC, precision: USDCPrecision }
        const collateralToken = { symbol: tokens.WBTC, precision: wBTCPrecision }

        await swapUniswapTokens(
          ADDRESSES.main.WETH,
          ADDRESSES.main.WBTC,
          amountToWei(new BigNumber(100)).toFixed(0),
          ONE.toFixed(0),
          config.address,
          config,
        )

        const COLL_TOKEN = new ethers.Contract(ADDRESSES.main.WBTC, ERC20ABI, provider)
        await COLL_TOKEN.connect(signer).approve(
          system.common.userProxyAddress,
          depositWBTCAmount.toFixed(0),
        )

        const openPositionTransition = await strategies.aave.open(
          {
            depositedByUser: {
              collateralToken: { amountInBaseUnit: depositWBTCAmount },
            },
            positionType: 'Multiply',
            slippage,
            multiple,
            debtToken,
            collateralToken,
          },
          {
            isDPMProxy: false,
            addresses,
            provider,
            protocol: {
              version: 2,
              getCurrentPosition: strategies.aave.view,
              getProtocolData: protocols.getAaveProtocolData,
            },
            getSwapData: getOneInchCall(system.common.swap.address, [], true),
            proxy: system.common.dsProxy.address,
            user: config.address,
          },
        )

        hre.tracer.enabled = process.env.TRACE_TX === 'true' || false
        const [_openTxStatus] = await executeThroughProxy(
          system.common.dsProxy.address,
          {
            address: system.common.operationExecutor.address,
            calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
              openPositionTransition.transaction.calls,
              openPositionTransition.transaction.operationName,
            ]),
          },
          signer,
          '',
        )
        openTxStatus = _openTxStatus

        const currentPositionBeforeAdjust = await strategies.aave.view(
          {
            proxy,
            collateralToken,
            debtToken,
          },
          {
            addresses,
            provider,
          },
        )

        positionTransition = await strategies.aave.adjust(
          {
            slippage,
            multiple: adjustDownToMultiple,
            debtToken,
            collateralToken,
            // collectSwapFeeFrom: 'targetToken',
          },
          {
            isDPMProxy: false,
            addresses,
            provider,
            getSwapData: getOneInchCall(system.common.swap.address, [], true),
            proxy,
            user: config.address,
            currentPosition: currentPositionBeforeAdjust,
          },
        )

        feeRecipientUSDCBalanceBefore = await balanceOf(
          ADDRESSES.main.USDC,
          ADDRESSES.main.feeRecipient,
          { config },
        )

        const [_txStatus] = await executeThroughProxy(
          system.common.dsProxy.address,
          {
            address: system.common.operationExecutor.address,
            calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
              positionTransition.transaction.calls,
              positionTransition.transaction.operationName,
            ]),
          },
          signer,
          '',
        )
        txStatus = _txStatus

        const aavePriceOracle = new ethers.Contract(
          addresses.aavePriceOracle,
          aavePriceOracleABI,
          provider,
        )

        aaveWBTCPriceInEthPriceInEth = await aavePriceOracle
          .getAssetPrice(addresses.WBTC)
          .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString())))

        const userWBTCReserveDataAfterAdjust = await aaveDataProvider.getUserReserveData(
          ADDRESSES.main.WBTC,
          system.common.dsProxy.address,
        )
        const userUSDCReserveDataAfterAdjust = await aaveDataProvider.getUserReserveData(
          ADDRESSES.main.USDC,
          system.common.dsProxy.address,
        )
        hre.tracer.enabled = false
        const finalDebt = {
          amount: new BigNumber(userUSDCReserveDataAfterAdjust.currentVariableDebt.toString()),
          precision: debtToken.precision,
          symbol: debtToken.symbol,
        }
        const finalCollateral = {
          amount: new BigNumber(userWBTCReserveDataAfterAdjust.currentATokenBalance.toString()),
          precision: collateralToken.precision,
          symbol: collateralToken.symbol,
        }

        finalPosition = new Position(
          finalDebt,
          finalCollateral,
          aaveWBTCPriceInEthPriceInEth,
          openPositionTransition.simulation.position.category,
        )
      } else {
        this.skip()
      }
    })

    it('Open Position Tx should pass', () => {
      expect(openTxStatus).to.be.true
    })

    it('Adjust Tx should pass', () => {
      expect(txStatus).to.be.true
    })

    it('Should draw debt according to multiple', async () => {
      expectToBe(
        finalPosition.debt.amount.toString(),
        'gte',
        positionTransition.simulation.position.debt.amount.toString(),
      )
    })

    it('Should collect fee', async () => {
      const feeRecipientUSDCBalanceAfter = await balanceOf(
        ADDRESSES.main.USDC,
        ADDRESSES.main.feeRecipient,
        { config },
      )

      const actualUSDCFees = feeRecipientUSDCBalanceAfter.minus(feeRecipientUSDCBalanceBefore)

      // Test for equivalence within slippage adjusted range when taking fee from target token
      expectToBe(
        new BigNumber(
          positionTransition.simulation.swap.tokenFee
            .div(ONE.minus(slippage).minus(TESTING_OFFSET))
            .toString(),
        ).toFixed(0),
        'gte',
        actualUSDCFees,
      )
    })
  })
})
