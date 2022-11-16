import { JsonRpcProvider } from '@ethersproject/providers'
import {
  ADDRESSES,
  IPosition,
  ONE,
  OPERATION_NAMES,
  Position,
  strategies,
  TYPICAL_PRECISION,
  ZERO,
} from '@oasisdex/oasis-actions'
import aavePriceOracleABI from '@oasisdex/oasis-actions/lib/src/abi/aavePriceOracle.json'
import { amountFromWei } from '@oasisdex/oasis-actions/lib/src/helpers'
import { IPositionMutation } from '@oasisdex/oasis-actions/src'
import { AAVETokens } from '@oasisdex/oasis-actions/src/operations/aave/tokens'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { loadFixture } from 'ethereum-waffle'
import { Contract, ContractReceipt, ethers, Signer } from 'ethers'

import AAVEDataProviderABI from '../../abi/aaveDataProvider.json'
import AAVELendigPoolABI from '../../abi/aaveLendingPool.json'
import ERC20ABI from '../../abi/IERC20.json'
import { AAVEAccountData, AAVEReserveData } from '../../helpers/aave'
import { executeThroughProxy } from '../../helpers/deploy'
import init, { impersonateRichAccount, resetNodeToLatestBlock } from '../../helpers/init'
import { restoreSnapshot } from '../../helpers/restoreSnapshot'
import { getOneInchCall } from '../../helpers/swap/OneInchCall'
import { oneInchCallMock } from '../../helpers/swap/OneInchCallMock'
import { RuntimeConfig } from '../../helpers/types/common'
import { amountToWei, balanceOf } from '../../helpers/utils'
import { mainnetAddresses } from '../addresses'
import { testBlockNumber } from '../config'
import { tokens } from '../constants'
import { DeployedSystemInfo } from '../deploySystem'
import { initialiseConfig } from '../fixtures/setup'
import { expectToBe, expectToBeEqual, TESTING_OFFSET } from '../utils'

describe(`Strategy | AAVE | Adjust Position`, async function () {
  let aaveLendingPool: Contract
  let aaveDataProvider: Contract
  let provider: JsonRpcProvider
  let config: RuntimeConfig
  let signer: Signer

  before(async function () {
    ;({ config, provider, signer } = await loadFixture(initialiseConfig))

    aaveLendingPool = new Contract(
      ADDRESSES.main.aave.MainnetLendingPool,
      AAVELendigPoolABI,
      provider,
    )

    aaveDataProvider = new Contract(ADDRESSES.main.aave.DataProvider, AAVEDataProviderABI, provider)
  })

  describe('On forked chain', () => {
    const multiple = new BigNumber(2)
    const slippage = new BigNumber(0.1)

    let positionMutation: IPositionMutation
    let positionAfterOpen: IPosition
    let openTxStatus: boolean
    let txStatus: boolean
    let tx: ContractReceipt

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
      isFeeFromSourceTokenOnOpen: boolean,
      isFeeFromSourceTokenOnAdjust: boolean,
      blockNumber?: number,
    ) {
      const _blockNumber = blockNumber || testBlockNumber
      const { snapshot, config: newConfig } = await restoreSnapshot(config, provider, _blockNumber)
      config = newConfig
      signer = newConfig.signer

      const system = snapshot.deployed.system

      const addresses = {
        ...mainnetAddresses,
        operationExecutor: system.common.operationExecutor.address,
      }

      if (!collateralToken.isEth) {
        const COLL_TOKEN = new ethers.Contract(collateralToken.address, ERC20ABI, provider).connect(
          signer,
        )
        await COLL_TOKEN.connect(signer).approve(
          system.common.userProxyAddress,
          collateralToken.depositOnOpenAmountInWei.toFixed(0),
        )
      }
      if (!debtToken.isEth) {
        const DEBT_TOKEN = new ethers.Contract(debtToken.address, ERC20ABI, provider).connect(
          signer,
        )
        await DEBT_TOKEN.connect(signer).approve(
          system.common.userProxyAddress,
          debtToken.depositOnOpenAmountInWei.toFixed(0),
        )
      }

      const ethDepositAmt = (debtToken.isEth ? debtToken.depositOnOpenAmountInWei : ZERO).plus(
        collateralToken.isEth ? collateralToken.depositOnOpenAmountInWei : ZERO,
      )

      // Set up the position
      const openPositionMutation = await strategies.aave.open(
        {
          depositedByUser: {
            debtInWei: debtToken.depositOnOpenAmountInWei,
            collateralInWei: collateralToken.depositOnOpenAmountInWei,
          },
          slippage,
          multiple,
          debtToken: { symbol: debtToken.symbol, precision: debtToken.precision },
          collateralToken: {
            symbol: collateralToken.symbol,
            precision: collateralToken.precision,
          },
          collectSwapFeeFrom: isFeeFromSourceTokenOnOpen ? 'sourceToken' : 'targetToken',
        },
        {
          addresses,
          provider,
          getSwapData: oneInchCallMock(mockMarketPriceOnOpen, {
            from: debtToken.precision,
            to: collateralToken.precision,
          }),
          proxy: system.common.dsProxy.address,
        },
      )

      const [_openTxStatus] = await executeThroughProxy(
        system.common.dsProxy.address,
        {
          address: system.common.operationExecutor.address,
          calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
            openPositionMutation.transaction.calls,
            OPERATION_NAMES.common.CUSTOM_OPERATION,
          ]),
        },
        signer,
        ethDepositAmt.toFixed(0),
      )
      const openTxStatus = _openTxStatus

      if (!collateralToken.isEth) {
        const COLL_TOKEN = new ethers.Contract(collateralToken.address, ERC20ABI, provider).connect(
          signer,
        )
        await COLL_TOKEN.connect(signer).approve(
          system.common.userProxyAddress,
          collateralToken.depositOnAdjustAmountInWei.toFixed(0),
        )
      }
      if (!debtToken.isEth) {
        const DEBT_TOKEN = new ethers.Contract(debtToken.address, ERC20ABI, provider).connect(
          signer,
        )
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

      console.log('EXISTING OUTSIDE')
      console.log(
        'DEBT:',
        new BigNumber(userDebtReserveData.currentVariableDebt.toString()).toString(),
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
        openPositionMutation.simulation.position.category,
      )
      console.log(
        'debt:',
        new BigNumber(userDebtReserveData.currentVariableDebt.toString()).toString(),
      )
      console.log('debt precision:', debtToken.precision)
      console.log(
        'coll:',
        new BigNumber(userCollateralReserveData.currentATokenBalance.toString()).toString(),
      )
      console.log('coll precision:', collateralToken.precision)
      console.log('actualPosition multiple:', positionAfterOpen.riskRatio.multiple.toString())
      console.log('oracle:', oracle.toString())

      // Now adjust the position
      const isIncreasingRisk = adjustToMultiple.gte(positionAfterOpen.riskRatio.multiple)
      const positionMutation = await strategies.aave.adjust(
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
          collectSwapFeeFrom: isFeeFromSourceTokenOnAdjust ? 'sourceToken' : 'targetToken',
        },
        {
          addresses,
          provider,
          position: positionAfterOpen,
          getSwapData: oneInchCallMock(mockMarketPriceOnAdjust, {
            from: isIncreasingRisk ? debtToken.precision : collateralToken.precision,
            to: isIncreasingRisk ? collateralToken.precision : debtToken.precision,
          }),
          proxy: system.common.dsProxy.address,
        },
      )

      let isFeeFromDebtToken = true
      if (isIncreasingRisk && isFeeFromSourceTokenOnAdjust) {
        isFeeFromDebtToken = true
      }
      if (isIncreasingRisk && !isFeeFromSourceTokenOnAdjust) {
        isFeeFromDebtToken = false
      }
      if (!isIncreasingRisk && isFeeFromSourceTokenOnAdjust) {
        isFeeFromDebtToken = false
      }
      if (!isIncreasingRisk && !isFeeFromSourceTokenOnAdjust) {
        isFeeFromDebtToken = true
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
            positionMutation.transaction.calls,
            OPERATION_NAMES.common.CUSTOM_OPERATION,
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

      console.log('debtToken.address:', debtToken.address)
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

      console.log('FINAL OUTSIDE')
      console.log(
        'DEBT-Current:',
        new BigNumber(userDebtReserveDataAfterAdjust.currentVariableDebt.toString()).toString(),
      )
      console.log(
        'DEBT-Scaled:',
        new BigNumber(userDebtReserveDataAfterAdjust.scaledVariableDebt.toString()).toString(),
      )

      const finalPosition = new Position(
        {
          amount: new BigNumber(userDebtReserveDataAfterAdjust.currentVariableDebt.toString()),
          precision: debtToken.precision,
          symbol: debtToken.symbol,
        },
        {
          amount: new BigNumber(
            userCollateralReserveDataAfterAdjust.currentATokenBalance.toString(),
          ),
          precision: collateralToken.precision,
          symbol: collateralToken.symbol,
        },
        oracleAfterAdjust,
        positionMutation.simulation.position.category,
      )

      return {
        system,
        address: config.address,
        positionMutation,
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

    describe.skip(`Increase Multiple: With ${tokens.STETH} collateral & ${tokens.ETH} debt`, function () {
      const depositAmount = amountToWei(new BigNumber(1))
      const adjustMultipleUp = new BigNumber(3.5)

      let userStEthReserveData: AAVEReserveData
      let userWethReserveData: AAVEReserveData
      let userEthBalanceBeforeTx: BigNumber
      let userAccountData: AAVEAccountData
      let feeRecipientWethBalanceBefore: BigNumber
      let finalPosition: IPosition
      let system: DeployedSystemInfo
      let address: string

      before(async () => {
        const setup = await setupAdjustPositionTest(
          {
            depositOnOpenAmountInWei: ZERO,
            depositOnAdjustAmountInWei: ZERO,
            symbol: tokens.STETH,
            address: ADDRESSES.main.stETH,
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
          true,
          true,
        )
        address = setup.address
        system = setup.system
        txStatus = setup.txStatus
        tx = setup.tx
        openTxStatus = setup.openTxStatus
        positionMutation = setup.positionMutation
        finalPosition = setup.finalPosition
        positionAfterOpen = setup.positionAfterOpen
        userStEthReserveData = setup.userCollateralReserveData
        userWethReserveData = setup.userDebtReserveData
        userAccountData = setup.userAccountData
        feeRecipientWethBalanceBefore = setup.feeRecipientBalanceBefore
        userEthBalanceBeforeTx = setup.userEthBalanceBeforeTx
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
          positionMutation.simulation.position.debt.amount.toString(),
        )
      })

      it('Should collect fee', async () => {
        const feeRecipientWethBalanceAfter = await balanceOf(
          ADDRESSES.main.WETH,
          ADDRESSES.main.feeRecipient,
          { config },
        )
        console.log('FEE')
        console.log('feeRecipientWethBalanceBefore:', feeRecipientWethBalanceBefore.toString())
        console.log('feeRecipientWethBalanceAfter:', feeRecipientWethBalanceAfter.toString())

        const actualWethFees = feeRecipientWethBalanceAfter.minus(feeRecipientWethBalanceBefore)

        // Test for equivalence within slippage adjusted range when taking fee from target token
        expectToBe(
          new BigNumber(
            positionMutation.simulation.swap.tokenFee
              .div(ONE.minus(slippage).minus(TESTING_OFFSET))
              .toString(),
          ).toFixed(0),
          'gte',
          actualWethFees,
        )

        expectToBe(positionMutation.simulation.swap.tokenFee, 'lte', actualWethFees)
      })
    })

    describe.skip(`Increase Multiple: With ${tokens.ETH} collateral & ${tokens.USDC} debt`, function () {
      const depositAmount = amountToWei(new BigNumber(1))
      const adjustMultipleUp = new BigNumber(3.5)

      let userWethReserveData: AAVEReserveData
      let userUSDCReserveData: AAVEReserveData
      let userEthBalanceBeforeTx: BigNumber
      let userAccountData: AAVEAccountData
      let feeRecipientWethBalanceBefore: BigNumber
      let finalPosition: IPosition
      let system: DeployedSystemInfo
      let address: string

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
          true,
          true,
        )
        address = setup.address
        system = setup.system
        txStatus = setup.txStatus
        tx = setup.tx
        openTxStatus = setup.openTxStatus
        positionMutation = setup.positionMutation
        finalPosition = setup.finalPosition
        positionAfterOpen = setup.positionAfterOpen
        userWethReserveData = setup.userCollateralReserveData
        userUSDCReserveData = setup.userDebtReserveData
        userAccountData = setup.userAccountData
        feeRecipientWethBalanceBefore = setup.feeRecipientBalanceBefore
        userEthBalanceBeforeTx = setup.userEthBalanceBeforeTx
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
          positionMutation.simulation.position.debt.amount.toString(),
        )
      })

      it('Should collect fee', async () => {
        const feeRecipientUSDCBalanceAfter = await balanceOf(
          ADDRESSES.main.USDC,
          ADDRESSES.main.feeRecipient,
          { config },
        )
        console.log('FEE')
        console.log('feeRecipientWethBalanceBefore:', feeRecipientWethBalanceBefore.toString())
        console.log('feeRecipientUSDCBalanceAfter:', feeRecipientUSDCBalanceAfter.toString())

        const actualUSDCFees = feeRecipientUSDCBalanceAfter.minus(feeRecipientWethBalanceBefore)

        // Test for equivalence within slippage adjusted range when taking fee from target token
        expectToBe(
          new BigNumber(
            positionMutation.simulation.swap.tokenFee
              .div(ONE.minus(slippage).minus(TESTING_OFFSET))
              .toString(),
          ).toFixed(0),
          'gte',
          actualUSDCFees,
        )

        expectToBe(positionMutation.simulation.swap.tokenFee, 'lte', actualUSDCFees)
      })
    })

    describe.skip(`Increase Multiple: With ${tokens.WBTC} collateral & ${tokens.USDC} debt`, function () {
      const depositWBTCAmount = new BigNumber(6)
      const adjustMultipleUp = new BigNumber(3.5)

      let userWBTCReserveData: AAVEReserveData
      let userUSDCReserveData: AAVEReserveData
      let userAccountData: AAVEAccountData
      let feeRecipientUSDCBalanceBefore: BigNumber
      let finalPosition: IPosition
      let system: DeployedSystemInfo
      let address: string

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
          true,
          true,
        )
        address = setup.address
        system = setup.system
        txStatus = setup.txStatus
        tx = setup.tx
        openTxStatus = setup.openTxStatus
        positionMutation = setup.positionMutation
        finalPosition = setup.finalPosition
        positionAfterOpen = setup.positionAfterOpen
        userWBTCReserveData = setup.userCollateralReserveData
        userUSDCReserveData = setup.userDebtReserveData
        userAccountData = setup.userAccountData
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
          positionMutation.simulation.position.debt.amount.toString(),
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
            positionMutation.simulation.swap.tokenFee
              .div(ONE.minus(slippage).minus(TESTING_OFFSET))
              .toString(),
          ).toFixed(0),
          'gte',
          actualUSDCFees,
        )

        expectToBe(positionMutation.simulation.swap.tokenFee, 'lte', actualUSDCFees)
      })
    })

    describe(`Decrease Multiple: With ${tokens.STETH} collateral & ${tokens.ETH} debt`, function () {
      const depositAmount = amountToWei(new BigNumber(1))
      const adjustMultipleDown = new BigNumber(1.5)

      let userStEthReserveData: AAVEReserveData
      let userWethReserveData: AAVEReserveData
      let userEthBalanceBeforeTx: BigNumber
      let userAccountData: AAVEAccountData
      let feeRecipientWethBalanceBefore: BigNumber
      let finalPosition: IPosition
      let system: DeployedSystemInfo
      let address: string

      before(async () => {
        const setup = await setupAdjustPositionTest(
          {
            depositOnOpenAmountInWei: ZERO,
            depositOnAdjustAmountInWei: ZERO,
            symbol: tokens.STETH,
            address: ADDRESSES.main.stETH,
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
          true,
          false,
        )
        address = setup.address
        system = setup.system
        txStatus = setup.txStatus
        tx = setup.tx
        openTxStatus = setup.openTxStatus
        positionMutation = setup.positionMutation
        finalPosition = setup.finalPosition
        positionAfterOpen = setup.positionAfterOpen
        userStEthReserveData = setup.userCollateralReserveData
        userWethReserveData = setup.userDebtReserveData
        userAccountData = setup.userAccountData
        feeRecipientWethBalanceBefore = setup.feeRecipientBalanceBefore
        userEthBalanceBeforeTx = setup.userEthBalanceBeforeTx
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
          positionMutation.simulation.position.debt.amount.toString(),
        )
      })

      it('Should collect fee', async () => {
        const feeRecipientWethBalanceAfter = await balanceOf(
          ADDRESSES.main.WETH,
          ADDRESSES.main.feeRecipient,
          { config },
        )
        console.log('FEE')
        console.log('feeRecipientWethBalanceBefore:', feeRecipientWethBalanceBefore.toString())
        console.log('feeRecipientWethBalanceAfter:', feeRecipientWethBalanceAfter.toString())

        const actualWethFees = feeRecipientWethBalanceAfter.minus(feeRecipientWethBalanceBefore)
        console.log('actualWethFees', actualWethFees.toString())
        // Test for equivalence within slippage adjusted range when taking fee from target token
        expectToBe(
          new BigNumber(
            positionMutation.simulation.swap.tokenFee
              .div(ONE.minus(slippage).minus(TESTING_OFFSET))
              .toString(),
          ).toFixed(0),
          'gte',
          actualWethFees,
        )

        expectToBe(positionMutation.simulation.swap.tokenFee, 'lte', actualWethFees)
      })
    })

    // before(async () => {
    //   ;({ config, provider, signer } = await loadFixture(initialiseConfig))

    //   const { snapshot } = await restoreSnapshot(config, provider, testBlockNumber)
    //   system = snapshot.deployed.system

    //   const addresses = {
    //     ...mainnetAddresses,
    //     operationExecutor: system.common.operationExecutor.address,
    //   }

    //   openPositionMutation = await strategies.aave.open(
    //     {
    //       depositedByUser: {
    //         debtInWei: depositAmount,
    //       },
    //       slippage,
    //       multiple,
    //       debtToken: { symbol: tokens.ETH },
    //       collateralToken: { symbol: tokens.STETH },
    //     },
    //     {
    //       addresses,
    //       provider,
    //       getSwapData: oneInchCallMock(new BigNumber(0.979)),
    //       proxy: system.common.dsProxy.address,
    //     },
    //   )

    //   feeRecipientWethBalanceBefore = await balanceOf(
    //     ADDRESSES.main.WETH,
    //     ADDRESSES.main.feeRecipient,
    //     { config, isFormatted: true },
    //   )

    //   const [_txStatus] = await executeThroughProxy(
    //     system.common.dsProxy.address,
    //     {
    //       address: system.common.operationExecutor.address,
    //       calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
    //         openPositionMutation.transaction.calls,
    //         OPERATION_NAMES.common.CUSTOM_OPERATION,
    //       ]),
    //     },
    //     signer,
    //     depositAmount.toFixed(0),
    //   )
    //   txStatus = _txStatus

    //   userAccountData = await aaveLendingPool.getUserAccountData(system.common.dsProxy.address)
    //   userStEthReserveData = await aaveDataProvider.getUserReserveData(
    //     ADDRESSES.main.stETH,
    //     system.common.dsProxy.address,
    //   )

    //   actualPosition = new Position(
    //     {
    //       amount: new BigNumber(userAccountData.totalDebtETH.toString()),
    //       symbol: tokens.ETH,
    //     },
    //     {
    //       amount: new BigNumber(userStEthReserveData.currentATokenBalance.toString()),
    //       symbol: tokens.STETH,
    //     },
    //     aaveStEthPriceInEth,
    //     openPositionMutation.simulation.position.category,
    //   )
    // })

    // it('Open Position Tx should pass', () => {
    //   expect(txStatus).to.be.true
    // })

    // it('Should draw debt according to multiple', () => {
    //   expect(actualPosition.debt.amount.toString()).to.be.oneOf([
    //     openPositionMutation.simulation.position.debt.amount.toString(),
    //     openPositionMutation.simulation.position.debt.amount.plus(ONE).toString(),
    //   ])
    // })

    // it('Increase Position Risk T/x should pass', () => {
    //   expect(increaseRiskTxStatus).to.be.true
    // })

    // describe('Increase Loan-to-Value (Increase risk)', () => {
    //   let adjustPositionUpMutation: IPositionMutation
    //   const adjustMultipleUp = new BigNumber(3.5)
    //   let increaseRiskTxStatus: boolean
    //   let afterUserAccountData: AAVEAccountData
    //   let afterUserStEthReserveData: AAVEReserveData
    //   let actualPositionAfterIncreaseAdjust: IPosition

    //   before(async () => {
    //     const addresses = {
    //       ...mainnetAddresses,
    //       operationExecutor: system.common.operationExecutor.address,
    //     }

    //     const beforeUserAccountData = await aaveLendingPool.getUserAccountData(
    //       system.common.dsProxy.address,
    //     )
    //     const beforeUserStEthReserveData = await aaveDataProvider.getUserReserveData(
    //       ADDRESSES.main.stETH,
    //       system.common.dsProxy.address,
    //     )

    //     adjustPositionUpMutation = await strategies.aave.adjust(
    //       {
    //         slippage,
    //         multiple: adjustMultipleUp,
    //         debtToken: { symbol: tokens.ETH },
    //         collateralToken: { symbol: tokens.STETH },
    //       },
    //       {
    //         addresses,
    //         provider,
    //         position: {
    //           debt: new PositionBalance({
    //             symbol: tokens.ETH,
    //             amount: new BigNumber(beforeUserAccountData.totalDebtETH.toString()),
    //           }),
    //           collateral: new PositionBalance({
    //             symbol: tokens.STETH,
    //             amount: new BigNumber(beforeUserStEthReserveData.currentATokenBalance.toString()),
    //           }),
    //           category: {
    //             liquidationThreshold: new BigNumber(0.75),
    //             maxLoanToValue: new BigNumber(0.73),
    //             dustLimit: new BigNumber(0),
    //           },
    //         },
    //         getSwapData: oneInchCallMock(new BigNumber(0.979)),
    //         proxy: system.common.dsProxy.address,
    //       },
    //     )

    //     feeRecipientWethBalanceBefore = await balanceOf(
    //       ADDRESSES.main.WETH,
    //       ADDRESSES.main.feeRecipient,
    //       { config, isFormatted: true },
    //     )

    //     const [_txStatus] = await executeThroughProxy(
    //       system.common.dsProxy.address,
    //       {
    //         address: system.common.operationExecutor.address,
    //         calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
    //           adjustPositionUpMutation.transaction.calls,
    //           OPERATION_NAMES.common.CUSTOM_OPERATION,
    //         ]),
    //       },
    //       signer,
    //     )
    //     increaseRiskTxStatus = _txStatus

    //     afterUserAccountData = await aaveLendingPool.getUserAccountData(
    //       system.common.dsProxy.address,
    //     )

    //     afterUserStEthReserveData = await aaveDataProvider.getUserReserveData(
    //       ADDRESSES.main.stETH,
    //       system.common.dsProxy.address,
    //     )

    //     const aavePriceOracle = new ethers.Contract(
    //       addresses.aavePriceOracle,
    //       aavePriceOracleABI,
    //       provider,
    //     )

    //     aaveStEthPriceInEth = await aavePriceOracle
    //       .getAssetPrice(addresses.stETH)
    //       .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString())))

    //     actualPositionAfterIncreaseAdjust = new Position(
    //       {
    //         amount: new BigNumber(afterUserAccountData.totalDebtETH.toString()),
    //         symbol: tokens.ETH,
    //       },
    //       {
    //         amount: new BigNumber(afterUserStEthReserveData.currentATokenBalance.toString()),
    //         symbol: tokens.STETH,
    //       },
    //       aaveStEthPriceInEth,
    //       openPositionMutation.simulation.position.category,
    //     )
    //   })

    //   it('Increase Position Risk T/x should pass', () => {
    //     expect(increaseRiskTxStatus).to.be.true
    //   })

    //   it('Should draw debt according to multiple', async () => {
    //     expect(actualPositionAfterIncreaseAdjust.debt.amount.toString()).to.be.oneOf([
    //       adjustPositionUpMutation.simulation.position.debt.amount.minus(ONE).toString(),
    //       adjustPositionUpMutation.simulation.position.debt.amount.toString(),
    //     ])
    //   })

    //   it('Should collect fee', async () => {
    //     const feeRecipientWethBalanceAfter = await balanceOf(
    //       ADDRESSES.main.WETH,
    //       ADDRESSES.main.feeRecipient,
    //       { config, isFormatted: true },
    //     )

    //     expectToBeEqual(
    //       new BigNumber(adjustPositionUpMutation.simulation.swap.tokenFee.toFixed(6)),
    //       feeRecipientWethBalanceAfter.minus(feeRecipientWethBalanceBefore).toFixed(6),
    //     )
    //   })
    // })
  })

  // describe('On latest block using one inch exchange and api', () => {
  //   const slippage = new BigNumber(0.1)
  //   const depositAmount = amountToWei(new BigNumber(60 / 1e15))
  //   const multiple = new BigNumber(2)
  //   let aaveStEthPriceInEth: BigNumber

  //   let system: DeployedSystemInfo

  //   let openPositionMutation: IPositionMutation
  //   let txStatus: boolean

  //   let userAccountData: AAVEAccountData
  //   let userStEthReserveData: AAVEReserveData

  //   let feeRecipientWethBalanceBefore: BigNumber

  //   let actualPosition: IPosition

  //   before(async function () {
  //     const shouldRun1InchTests = process.env.RUN_1INCH_TESTS === '1'
  //     if (shouldRun1InchTests) {
  //       await resetNodeToLatestBlock(provider)
  //       const { signer } = await impersonateRichAccount(provider)
  //       const { system: _system } = await deploySystem(config, false, false)
  //       system = _system

  //       const addresses = {
  //         ...mainnetAddresses,
  //         operationExecutor: system.common.operationExecutor.address,
  //       }

  //       openPositionMutation = await strategies.aave.open(
  //         {
  //           depositedByUser: {
  //             debtInWei: depositAmount,
  //           },
  //           slippage,
  //           multiple,
  //           debtToken: { symbol: tokens.ETH },
  //           collateralToken: { symbol: tokens.STETH },
  //         },
  //         {
  //           addresses,
  //           provider,
  //           getSwapData: getOneInchCall(system.common.swap.address),
  //           proxy: system.common.dsProxy.address,
  //         },
  //       )

  //       feeRecipientWethBalanceBefore = await balanceOf(
  //         ADDRESSES.main.WETH,
  //         ADDRESSES.main.feeRecipient,
  //         { config, isFormatted: true },
  //       )

  //       userAccountData = await aaveLendingPool.getUserAccountData(system.common.dsProxy.address)

  //       const [_txStatus] = await executeThroughProxy(
  //         system.common.dsProxy.address,
  //         {
  //           address: system.common.operationExecutor.address,
  //           calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
  //             openPositionMutation.transaction.calls,
  //             OPERATION_NAMES.common.CUSTOM_OPERATION,
  //           ]),
  //         },
  //         signer,
  //         depositAmount.toFixed(0),
  //       )
  //       txStatus = _txStatus

  //       userAccountData = await aaveLendingPool.getUserAccountData(system.common.dsProxy.address)
  //       userStEthReserveData = await aaveDataProvider.getUserReserveData(
  //         ADDRESSES.main.stETH,
  //         system.common.dsProxy.address,
  //       )

  //       const aavePriceOracle = new ethers.Contract(
  //         addresses.aavePriceOracle,
  //         aavePriceOracleABI,
  //         provider,
  //       )

  //       aaveStEthPriceInEth = await aavePriceOracle
  //         .getAssetPrice(addresses.stETH)
  //         .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString())))

  //       actualPosition = new Position(
  //         new PositionBalance({
  //           amount: new BigNumber(userAccountData.totalDebtETH.toString()),
  //           symbol: tokens.ETH,
  //         }),
  //         new PositionBalance({
  //           amount: new BigNumber(userStEthReserveData.currentATokenBalance.toString()),
  //           symbol: tokens.STETH,
  //         }),
  //         aaveStEthPriceInEth,
  //         openPositionMutation.simulation.position.category,
  //       )
  //     } else {
  //       this.skip()
  //     }
  //   })

  //   it('Open Position Tx should pass', () => {
  //     expect(txStatus).to.be.true
  //   })

  //   it('Should draw debt according to multiple', () => {
  //     expect(new BigNumber(actualPosition.debt.amount.toString()).toString()).to.be.oneOf([
  //       openPositionMutation.simulation.position.debt.amount.toString(),
  //       openPositionMutation.simulation.position.debt.amount.minus(ONE).toString(),
  //     ])
  //   })

  //   describe('Increase Loan-to-Value (Increase risk)', () => {
  //     let adjustPositionUpMutation: IPositionMutation
  //     const adjustMultipleUp = new BigNumber(3.5)
  //     let increaseRiskTxStatus: boolean
  //     let afterUserAccountData: AAVEAccountData
  //     let afterUserStEthReserveData: AAVEReserveData
  //     let actualPositionAfterIncreaseAdjust: IPosition

  //     before(async () => {
  //       const addresses = {
  //         ...mainnetAddresses,
  //         operationExecutor: system.common.operationExecutor.address,
  //       }

  //       const beforeUserAccountData = await aaveLendingPool.getUserAccountData(
  //         system.common.dsProxy.address,
  //       )
  //       const beforeUserStEthReserveData = await aaveDataProvider.getUserReserveData(
  //         ADDRESSES.main.stETH,
  //         system.common.dsProxy.address,
  //       )

  //       adjustPositionUpMutation = await strategies.aave.adjust(
  //         {
  //           slippage,
  //           multiple: adjustMultipleUp,
  //           debtToken: { symbol: tokens.ETH },
  //           collateralToken: { symbol: tokens.STETH },
  //         },
  //         {
  //           addresses,
  //           provider,
  //           position: {
  //             debt: new PositionBalance({
  //               symbol: tokens.ETH,
  //               amount: new BigNumber(beforeUserAccountData.totalDebtETH.toString()),
  //             }),
  //             collateral: new PositionBalance({
  //               symbol: tokens.STETH,
  //               amount: new BigNumber(beforeUserStEthReserveData.currentATokenBalance.toString()),
  //             }),
  //             category: {
  //               liquidationThreshold: new BigNumber(0.75),
  //               maxLoanToValue: new BigNumber(0.73),
  //               dustLimit: new BigNumber(0),
  //             },
  //           },
  //           getSwapData: getOneInchCall(system.common.swap.address),
  //           proxy: system.common.dsProxy.address,
  //         },
  //       )

  //       feeRecipientWethBalanceBefore = await balanceOf(
  //         ADDRESSES.main.WETH,
  //         ADDRESSES.main.feeRecipient,
  //         { config, isFormatted: true },
  //       )

  //       const [_txStatus] = await executeThroughProxy(
  //         system.common.dsProxy.address,
  //         {
  //           address: system.common.operationExecutor.address,
  //           calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
  //             adjustPositionUpMutation.transaction.calls,
  //             OPERATION_NAMES.common.CUSTOM_OPERATION,
  //           ]),
  //         },
  //         signer,
  //       )
  //       increaseRiskTxStatus = _txStatus

  //       afterUserAccountData = await aaveLendingPool.getUserAccountData(
  //         system.common.dsProxy.address,
  //       )

  //       afterUserStEthReserveData = await aaveDataProvider.getUserReserveData(
  //         ADDRESSES.main.stETH,
  //         system.common.dsProxy.address,
  //       )

  //       actualPositionAfterIncreaseAdjust = new Position(
  //         {
  //           amount: new BigNumber(afterUserAccountData.totalDebtETH.toString()),
  //           symbol: tokens.ETH,
  //         },
  //         {
  //           amount: new BigNumber(afterUserStEthReserveData.currentATokenBalance.toString()),
  //           symbol: tokens.STETH,
  //         },
  //         aaveStEthPriceInEth,
  //         openPositionMutation.simulation.position.category,
  //       )
  //     })

  //     it('Increase Position Risk T/x should pass', () => {
  //       expect(increaseRiskTxStatus).to.be.true
  //     })

  //     it('Should draw debt according to multiply', async () => {
  //       expect(
  //         new BigNumber(actualPositionAfterIncreaseAdjust.debt.amount.toString()).toString(),
  //       ).to.be.oneOf([
  //         adjustPositionUpMutation.simulation.position.debt.amount.toString(),
  //         adjustPositionUpMutation.simulation.position.debt.amount.minus(ONE).toString(),
  //       ])
  //     })

  //     it('Should collect fee', async () => {
  //       const feeRecipientWethBalanceAfter = await balanceOf(
  //         ADDRESSES.main.WETH,
  //         ADDRESSES.main.feeRecipient,
  //         { config, isFormatted: true },
  //       )

  //       expectToBeEqual(
  //         new BigNumber(adjustPositionUpMutation.simulation.swap.tokenFee.toFixed(6)),
  //         feeRecipientWethBalanceAfter.minus(feeRecipientWethBalanceBefore).toFixed(6),
  //       )
  //     })
  //   })
  // })

  // describe('On forked chain', () => {
  //   const depositAmount = amountToWei(new BigNumber(60 / 1e15))
  //   const multiple = new BigNumber(2)
  //   const slippage = new BigNumber(0.1)

  //   let system: DeployedSystemInfo

  //   let openPositionMutation: IPositionMutation

  //   let txStatus: boolean

  //   let userAccountData: AAVEAccountData

  //   let feeRecipientWethBalanceBefore: BigNumber

  //   before(async () => {
  //     ;({ config, provider, signer } = await loadFixture(initialiseConfig))

  //     const { snapshot, config: newConfig } = await restoreSnapshot(
  //       config,
  //       provider,
  //       testBlockNumber,
  //     )
  //     // config = newConfig
  //     system = snapshot.deployed.system

  //     const addresses = {
  //       ...mainnetAddresses,
  //       operationExecutor: system.common.operationExecutor.address,
  //     }

  //     openPositionMutation = await strategies.aave.open(
  //       {
  //         depositedByUser: {
  //           debtInWei: depositAmount,
  //         },
  //         slippage,
  //         multiple,
  //         debtToken: { symbol: tokens.ETH },
  //         collateralToken: { symbol: tokens.STETH },
  //       },
  //       {
  //         addresses,
  //         provider,
  //         getSwapData: oneInchCallMock(new BigNumber(0.979)),
  //         proxy: system.common.dsProxy.address,
  //       },
  //     )

  //     feeRecipientWethBalanceBefore = await balanceOf(
  //       ADDRESSES.main.WETH,
  //       ADDRESSES.main.feeRecipient,
  //       { config, isFormatted: true },
  //     )

  //     const [_txStatus] = await executeThroughProxy(
  //       system.common.dsProxy.address,
  //       {
  //         address: system.common.operationExecutor.address,
  //         calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
  //           openPositionMutation.transaction.calls,
  //           OPERATION_NAMES.common.CUSTOM_OPERATION,
  //         ]),
  //       },
  //       signer,
  //       depositAmount.toFixed(0),
  //     )
  //     txStatus = _txStatus

  //     userAccountData = await aaveLendingPool.getUserAccountData(system.common.dsProxy.address)
  //   })

  //   it('Open Position Tx should pass', () => {
  //     expect(txStatus).to.be.true
  //   })

  //   it('Should draw debt according to multiple', () => {
  //     expectToBe(
  //       openPositionMutation.simulation.position.debt.amount.minus(ONE).toFixed(0),
  //       'lte',
  //       new BigNumber(userAccountData.totalDebtETH.toString()),
  //     )
  //   })

  //   describe('Decrease Loan-to-Value (Reduce risk)', () => {
  //     let adjustPositionDownMutation: IPositionMutation
  //     const adjustMultipleDown = new BigNumber(1.5)
  //     let reduceRiskTxStatus: boolean

  //     let afterUserStEthReserveData: AAVEReserveData

  //     before(async () => {
  //       const addresses = {
  //         ...mainnetAddresses,
  //         operationExecutor: system.common.operationExecutor.address,
  //       }

  //       const beforeUserAccountData = await aaveLendingPool.getUserAccountData(
  //         system.common.dsProxy.address,
  //       )
  //       const beforeUserStEthReserveData = await aaveDataProvider.getUserReserveData(
  //         ADDRESSES.main.stETH,
  //         system.common.dsProxy.address,
  //       )

  //       adjustPositionDownMutation = await strategies.aave.adjust(
  //         {
  //           slippage,
  //           multiple: adjustMultipleDown,
  //           debtToken: { symbol: tokens.ETH },
  //           collateralToken: { symbol: tokens.STETH },
  //         },
  //         {
  //           addresses,
  //           provider,
  //           position: {
  //             debt: new PositionBalance({
  //               symbol: tokens.ETH,
  //               precision: TYPICAL_PRECISION,
  //               amount: new BigNumber(beforeUserAccountData.totalDebtETH.toString()),
  //             }),
  //             collateral: new PositionBalance({
  //               symbol: tokens.STETH,
  //               precision: TYPICAL_PRECISION,
  //               amount: new BigNumber(beforeUserStEthReserveData.currentATokenBalance.toString()),
  //             }),
  //             category: {
  //               liquidationThreshold: new BigNumber(0.75),
  //               maxLoanToValue: new BigNumber(0.73),
  //               dustLimit: new BigNumber(0),
  //             },
  //           },
  //           getSwapData: oneInchCallMock(new BigNumber(1 / 0.976)),
  //           proxy: system.common.dsProxy.address,
  //         },
  //       )

  //       feeRecipientWethBalanceBefore = await balanceOf(
  //         ADDRESSES.main.WETH,
  //         ADDRESSES.main.feeRecipient,
  //         { config, isFormatted: true },
  //       )

  //       const [_txStatus] = await executeThroughProxy(
  //         system.common.dsProxy.address,
  //         {
  //           address: system.common.operationExecutor.address,
  //           calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
  //             adjustPositionDownMutation.transaction.calls,
  //             OPERATION_NAMES.common.CUSTOM_OPERATION,
  //           ]),
  //         },
  //         signer,
  //       )
  //       reduceRiskTxStatus = _txStatus

  //       afterUserStEthReserveData = await aaveDataProvider.getUserReserveData(
  //         ADDRESSES.main.stETH,
  //         system.common.dsProxy.address,
  //       )
  //     })

  //     it('Reduce Position Risk T/x should pass', () => {
  //       expect(reduceRiskTxStatus).to.be.true
  //     })

  //     it('Should reduce collateral according to multiple', () => {
  //       expect(
  //         new BigNumber(afterUserStEthReserveData.currentATokenBalance.toString()).toString(),
  //       ).to.be.oneOf([
  //         adjustPositionDownMutation.simulation.position.collateral.amount.toFixed(0),
  //         adjustPositionDownMutation.simulation.position.collateral.amount.minus(ONE).toFixed(0),
  //       ])
  //     })

  //     it('should not be any token left on proxy', async () => {
  //       const proxyWethBalance = await balanceOf(
  //         ADDRESSES.main.WETH,
  //         system.common.dsProxy.address,
  //         {
  //           config,
  //           isFormatted: true,
  //         },
  //       )
  //       const proxyStEthBalance = await balanceOf(
  //         ADDRESSES.main.stETH,
  //         system.common.dsProxy.address,
  //         {
  //           config,
  //           isFormatted: true,
  //         },
  //       )
  //       const proxyEthBalance = await balanceOf(ADDRESSES.main.ETH, system.common.dsProxy.address, {
  //         config,
  //         isFormatted: true,
  //       })

  //       expectToBeEqual(proxyWethBalance, ZERO)
  //       expectToBeEqual(proxyStEthBalance, ZERO)
  //       expectToBeEqual(proxyEthBalance, ZERO)
  //     })

  //     it('Should collect fee', async () => {
  //       const feeRecipientWethBalanceAfter = await balanceOf(
  //         ADDRESSES.main.WETH,
  //         ADDRESSES.main.feeRecipient,
  //         { config, isFormatted: true },
  //       )

  //       expectToBeEqual(
  //         new BigNumber(adjustPositionDownMutation.simulation.swap.tokenFee.toFixed(6)),
  //         feeRecipientWethBalanceAfter.minus(feeRecipientWethBalanceBefore).toFixed(6),
  //       )
  //     })
  //   })
  // })

  // describe('On latest block using one inch exchange and api', () => {
  //   const slippage = new BigNumber(0.1)
  //   const depositAmount = amountToWei(new BigNumber(60 / 1e15))
  //   const multiple = new BigNumber(2)
  //   let aaveStEthPriceInEth: BigNumber

  //   let system: DeployedSystemInfo

  //   let openPositionMutation: IPositionMutation
  //   let txStatus: boolean

  //   let userAccountData: AAVEAccountData

  //   let feeRecipientWethBalanceBefore: BigNumber

  //   before(async function () {
  //     const shouldRun1InchTests = process.env.RUN_1INCH_TESTS === '1'
  //     if (shouldRun1InchTests) {
  //       await resetNodeToLatestBlock(provider)
  //       const { system: _system } = await deploySystem(config, false, false)
  //       system = _system

  //       const addresses = {
  //         ...mainnetAddresses,
  //         operationExecutor: system.common.operationExecutor.address,
  //       }

  //       openPositionMutation = await strategies.aave.open(
  //         {
  //           depositedByUser: {
  //             debtInWei: depositAmount,
  //           },
  //           slippage,
  //           multiple,
  //           debtToken: { symbol: tokens.ETH },
  //           collateralToken: { symbol: tokens.STETH },
  //         },
  //         {
  //           addresses,
  //           provider,
  //           getSwapData: getOneInchCall(system.common.swap.address),
  //           proxy: system.common.dsProxy.address,
  //         },
  //       )

  //       feeRecipientWethBalanceBefore = await balanceOf(
  //         ADDRESSES.main.WETH,
  //         ADDRESSES.main.feeRecipient,
  //         { config, isFormatted: true },
  //       )

  //       const [_txStatus] = await executeThroughProxy(
  //         system.common.dsProxy.address,
  //         {
  //           address: system.common.operationExecutor.address,
  //           calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
  //             openPositionMutation.transaction.calls,
  //             OPERATION_NAMES.common.CUSTOM_OPERATION,
  //           ]),
  //         },
  //         signer,
  //         depositAmount.toFixed(0),
  //       )
  //       txStatus = _txStatus

  //       userAccountData = await aaveLendingPool.getUserAccountData(system.common.dsProxy.address)
  //     } else {
  //       this.skip()
  //     }
  //   })

  //   it('Open Position Tx should pass', () => {
  //     expect(txStatus).to.be.true
  //   })

  //   it('Should draw debt according to multiple', () => {
  //     expectToBe(
  //       openPositionMutation.simulation.position.debt.amount.minus(ONE).toFixed(0),
  //       'lte',
  //       new BigNumber(userAccountData.totalDebtETH.toString()),
  //     )
  //   })

  //   describe('Decrease Loan-to-Value (Decrease risk)', () => {
  //     let adjustPositionDownMutation: IPositionMutation
  //     const adjustMultipleDown = new BigNumber(1.5)
  //     let reduceRiskTxStatus: boolean

  //     let afterReduceUserAccountData: AAVEAccountData
  //     let afterReduceUserStEthReserveData: AAVEReserveData
  //     let actualPositionAfterDecreasingRisk: IPosition

  //     before(async () => {
  //       const addresses = {
  //         ...mainnetAddresses,
  //         operationExecutor: system.common.operationExecutor.address,
  //       }

  //       const beforeUserAccountData = await aaveLendingPool.getUserAccountData(
  //         system.common.dsProxy.address,
  //       )
  //       const beforeUserStEthReserveData = await aaveDataProvider.getUserReserveData(
  //         ADDRESSES.main.stETH,
  //         system.common.dsProxy.address,
  //       )

  //       adjustPositionDownMutation = await strategies.aave.adjust(
  //         {
  //           slippage,
  //           multiple: adjustMultipleDown,
  //           debtToken: { symbol: tokens.ETH },
  //           collateralToken: { symbol: tokens.STETH },
  //         },
  //         {
  //           addresses,
  //           provider,
  //           position: {
  //             debt: new PositionBalance({
  //               symbol: tokens.ETH,
  //               amount: new BigNumber(beforeUserAccountData.totalDebtETH.toString()),
  //             }),
  //             collateral: new PositionBalance({
  //               symbol: tokens.STETH,
  //               amount: new BigNumber(beforeUserStEthReserveData.currentATokenBalance.toString()),
  //             }),
  //             category: {
  //               liquidationThreshold: new BigNumber(0.75),
  //               maxLoanToValue: new BigNumber(0.73),
  //               dustLimit: new BigNumber(0),
  //             },
  //           },
  //           getSwapData: getOneInchCall(system.common.swap.address),
  //           proxy: system.common.dsProxy.address,
  //         },
  //       )

  //       feeRecipientWethBalanceBefore = await balanceOf(
  //         ADDRESSES.main.WETH,
  //         ADDRESSES.main.feeRecipient,
  //         { config, isFormatted: true },
  //       )

  //       const [_txStatus] = await executeThroughProxy(
  //         system.common.dsProxy.address,
  //         {
  //           address: system.common.operationExecutor.address,
  //           calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
  //             adjustPositionDownMutation.transaction.calls,
  //             OPERATION_NAMES.common.CUSTOM_OPERATION,
  //           ]),
  //         },
  //         signer,
  //       )
  //       reduceRiskTxStatus = _txStatus

  //       afterReduceUserAccountData = await aaveLendingPool.getUserAccountData(
  //         system.common.dsProxy.address,
  //       )

  //       afterReduceUserStEthReserveData = await aaveDataProvider.getUserReserveData(
  //         ADDRESSES.main.stETH,
  //         system.common.dsProxy.address,
  //       )

  //       const aavePriceOracle = new ethers.Contract(
  //         addresses.aavePriceOracle,
  //         aavePriceOracleABI,
  //         provider,
  //       )

  //       aaveStEthPriceInEth = await aavePriceOracle
  //         .getAssetPrice(addresses.stETH)
  //         .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString())))

  //       actualPositionAfterDecreasingRisk = new Position(
  //         new PositionBalance({
  //           amount: new BigNumber(afterReduceUserAccountData.totalDebtETH.toString()),
  //           symbol: tokens.ETH,
  //         }),
  //         new PositionBalance({
  //           amount: new BigNumber(afterReduceUserStEthReserveData.currentATokenBalance.toString()),
  //           symbol: tokens.STETH,
  //         }),
  //         aaveStEthPriceInEth,
  //         openPositionMutation.simulation.position.category,
  //       )
  //     })

  //     it('Reduce Position Risk T/x should pass', () => {
  //       expect(reduceRiskTxStatus).to.be.true
  //     })

  //     it('Should reduce collateral according to multiple', () => {
  //       expect(actualPositionAfterDecreasingRisk.collateral.amount.toString()).to.be.oneOf([
  //         adjustPositionDownMutation.simulation.position.collateral.amount.toFixed(0),
  //         adjustPositionDownMutation.simulation.position.collateral.amount.minus(ONE).toFixed(0),
  //       ])
  //     })

  //     it('should not be any token left on proxy', async () => {
  //       const proxyWethBalance = await balanceOf(
  //         ADDRESSES.main.WETH,
  //         system.common.dsProxy.address,
  //         {
  //           config,
  //           isFormatted: true,
  //         },
  //       )
  //       const proxyStEthBalance = await balanceOf(
  //         ADDRESSES.main.stETH,
  //         system.common.dsProxy.address,
  //         {
  //           config,
  //           isFormatted: true,
  //         },
  //       )
  //       const proxyEthBalance = await balanceOf(ADDRESSES.main.ETH, system.common.dsProxy.address, {
  //         config,
  //         isFormatted: true,
  //       })

  //       expectToBeEqual(proxyWethBalance, ZERO)
  //       expectToBeEqual(proxyStEthBalance, ZERO)
  //       expectToBeEqual(proxyEthBalance, ZERO)
  //     })

  //     it('Should collect fee', async () => {
  //       const feeRecipientWethBalanceAfter = await balanceOf(
  //         ADDRESSES.main.WETH,
  //         ADDRESSES.main.feeRecipient,
  //         { config, isFormatted: true },
  //       )

  //       expectToBeEqual(
  //         new BigNumber(adjustPositionDownMutation.simulation.swap.tokenFee.toFixed(6)),
  //         feeRecipientWethBalanceAfter.minus(feeRecipientWethBalanceBefore).toFixed(6),
  //       )
  //     })
  //   })
  // })
})
