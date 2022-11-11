import { JsonRpcProvider } from '@ethersproject/providers'
import {
  ADDRESSES,
  IPosition,
  ONE,
  OPERATION_NAMES,
  Position,
  strategies,
  ZERO,
} from '@oasisdex/oasis-actions'
import aavePriceOracleABI from '@oasisdex/oasis-actions/lib/src/abi/aavePriceOracle.json'
import { IPositionMutation } from '@oasisdex/oasis-actions/src'
import { amountFromWei } from '@oasisdex/oasis-actions/src/helpers'
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
import { impersonateRichAccount, resetNodeToLatestBlock } from '../../helpers/init'
import { restoreSnapshot } from '../../helpers/restoreSnapshot'
import { getOneInchCall } from '../../helpers/swap/OneInchCall'
import { oneInchCallMock } from '../../helpers/swap/OneInchCallMock'
import { RuntimeConfig } from '../../helpers/types/common'
import { amountToWei, balanceOf } from '../../helpers/utils'
import { mainnetAddresses } from '../addresses'
import { testBlockNumber } from '../config'
import { tokens } from '../constants'
import { DeployedSystemInfo, deploySystem } from '../deploySystem'
import { initialiseConfig } from '../fixtures/setup'
import { expectToBe, expectToBeEqual, TESTING_OFFSET } from '../utils'

describe(`Strategy | AAVE | Close Position`, async () => {
  let aaveLendingPool: Contract
  let aaveDataProvider: Contract
  let provider: JsonRpcProvider
  let config: RuntimeConfig
  let signer: Signer

  before(async () => {
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
    const blockNumber = 15695000 // Required to marry up with market price

    let positionMutation: IPositionMutation
    let positionAfterOpen: IPosition
    let openTxStatus: boolean
    let txStatus: boolean
    let tx: ContractReceipt

    async function setupClosePositionTest(
      collateralToken: {
        depositOnOpenAmountInWei: BigNumber
        symbol: AAVETokens
        address: string
        precision: number
        isEth: boolean
      },
      debtToken: {
        depositOnOpenAmountInWei: BigNumber
        symbol: AAVETokens
        address: string
        precision: number
        isEth: boolean
      },
      mockMarketPriceOnOpen: BigNumber,
      mockMarketPriceOnClose: BigNumber,
      isFeeFromDebtToken: boolean,
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
          collateralToken: { symbol: collateralToken.symbol, precision: collateralToken.precision },
          collectSwapFeeFrom: isFeeFromDebtToken ? 'sourceToken' : 'targetToken',
        },
        {
          addresses,
          provider,
          getSwapData: oneInchCallMock(mockMarketPriceOnOpen),
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
        openPositionMutation.simulation.position.category,
      )

      // Now close the position
      const positionMutation = await strategies.aave.close(
        {
          slippage,
          collateralAmountLockedInProtocolInWei: positionAfterOpen.collateral.amount,
          debtToken: { symbol: debtToken.symbol, precision: debtToken.precision },
          collateralToken: {
            symbol: collateralToken.symbol,
            precision: collateralToken.precision,
          },
          collectSwapFeeFrom: isFeeFromDebtToken ? 'targetToken' : 'sourceToken',
        },
        {
          addresses,
          provider,
          position: positionAfterOpen,
          getSwapData: oneInchCallMock(mockMarketPriceOnClose, {
            from: collateralToken.precision,
            to: debtToken.precision,
          }),
          proxy: system.common.dsProxy.address,
        },
      )

      const feeRecipientBalanceBeforeClose = await balanceOf(
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

      const afterCloseUserAccountData = await aaveLendingPool.getUserAccountData(
        system.common.dsProxy.address,
      )

      const userCollateralReserveDataAfterClose = await aaveDataProvider.getUserReserveData(
        collateralToken.address,
        system.common.dsProxy.address,
      )

      const userDebtReserveDataAfterClose = await aaveDataProvider.getUserReserveData(
        debtToken.address,
        system.common.dsProxy.address,
      )

      const aavePriceOracleAfterClose = new ethers.Contract(
        addresses.aavePriceOracle,
        aavePriceOracleABI,
        provider,
      )

      const aaveCollateralTokenPriceInEthAfterClose = collateralToken.isEth
        ? ONE
        : await aavePriceOracleAfterClose
            .getAssetPrice(collateralToken.address)
            .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString())))

      const aaveDebtTokenPriceInEthAfterClose = debtToken.isEth
        ? ONE
        : await aavePriceOracleAfterClose
            .getAssetPrice(debtToken.address)
            .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString())))

      const oracleAfterClose = aaveCollateralTokenPriceInEthAfterClose.div(
        aaveDebtTokenPriceInEthAfterClose,
      )

      const finalPosition = new Position(
        {
          amount: new BigNumber(userDebtReserveDataAfterClose.currentVariableDebt.toString()),
          precision: debtToken.precision,
          symbol: debtToken.symbol,
        },
        {
          amount: new BigNumber(
            userCollateralReserveDataAfterClose.currentATokenBalance.toString(),
          ),
          precision: collateralToken.precision,
          symbol: collateralToken.symbol,
        },
        oracleAfterClose,
        positionMutation.simulation.position.category,
      )

      return {
        system,
        address: config.address,
        positionMutation,
        feeRecipientBalanceBefore: feeRecipientBalanceBeforeClose,
        openTxStatus,
        txStatus,
        tx,
        oracle,
        positionAfterOpen,
        finalPosition,
        userEthBalanceBeforeTx,
        userCollateralReserveData: userCollateralReserveDataAfterClose,
        userDebtReserveData: userCollateralReserveDataAfterClose,
        userAccountData: afterCloseUserAccountData,
      }
    }

    describe(`With ${tokens.STETH} collateral & ${tokens.ETH} debt`, () => {
      const depositAmount = amountToWei(new BigNumber(1))

      let userStEthReserveData: AAVEReserveData
      let userWethReserveData: AAVEReserveData
      let userEthBalanceBeforeTx: BigNumber
      let userAccountData: AAVEAccountData
      let feeRecipientWethBalanceBefore: BigNumber
      let finalPosition: IPosition
      let system: DeployedSystemInfo
      let address: string

      before(async () => {
        const setup = await setupClosePositionTest(
          {
            depositOnOpenAmountInWei: ZERO,
            symbol: tokens.STETH,
            address: ADDRESSES.main.stETH,
            precision: 18,
            isEth: false,
          },
          {
            depositOnOpenAmountInWei: depositAmount,
            symbol: tokens.ETH,
            address: ADDRESSES.main.WETH,
            precision: 18,
            isEth: true,
          },
          new BigNumber(0.9759),
          ONE.div(new BigNumber(0.9759)),
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

      it('Close Tx should pass', () => {
        expect(txStatus).to.be.true
      })

      it('Should payback all debt', () => {
        expectToBeEqual(new BigNumber(userAccountData.totalDebtETH.toString()), ZERO)
      })

      it(`Should withdraw all ${tokens.STETH} tokens from aave`, () => {
        //due to quirks of how stEth works there might be 1 wei left in aave
        expectToBe(new BigNumber(userStEthReserveData.currentATokenBalance.toString()), 'lte', ONE)
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
            positionMutation.simulation.swap.tokenFee
              .div(ONE.minus(slippage).minus(TESTING_OFFSET))
              .toString(),
          ).toFixed(0),
          'gte',
          actualWethFees,
        )

        expectToBe(positionMutation.simulation.swap.tokenFee, 'lte', actualWethFees)
      })

      it('should not be any token left on proxy', async () => {
        const proxyWethBalance = await balanceOf(
          ADDRESSES.main.WETH,
          system.common.dsProxy.address,
          {
            config,
            isFormatted: true,
          },
        )
        const proxyStEthBalance = await balanceOf(
          ADDRESSES.main.stETH,
          system.common.dsProxy.address,
          {
            config,
            isFormatted: true,
          },
        )
        const proxyEthBalance = await balanceOf(ADDRESSES.main.ETH, system.common.dsProxy.address, {
          config,
          isFormatted: true,
        })

        expectToBeEqual(proxyWethBalance, ZERO)
        expectToBeEqual(proxyStEthBalance, ZERO)
        expectToBeEqual(proxyEthBalance, ZERO)
      })
    })

    describe(`With ${tokens.ETH} collateral & ${tokens.USDC} debt`, () => {
      const depositEthAmount = amountToWei(new BigNumber(1))

      let userWethReserveData: AAVEReserveData
      let userUSDCReserveData: AAVEReserveData
      let userEthBalanceBeforeTx: BigNumber
      let userAccountData: AAVEAccountData
      let feeRecipientUSDCBalanceBefore: BigNumber
      let finalPosition: IPosition
      let system: DeployedSystemInfo
      let address: string

      before(async () => {
        const setup = await setupClosePositionTest(
          {
            depositOnOpenAmountInWei: depositEthAmount,
            symbol: tokens.ETH,
            address: ADDRESSES.main.WETH,
            precision: 18,
            isEth: true,
          },
          {
            depositOnOpenAmountInWei: ZERO,
            symbol: tokens.USDC,
            address: ADDRESSES.main.USDC,
            precision: 6,
            isEth: false,
          },
          new BigNumber(1351),
          ONE.div(new BigNumber(1351)),
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
        feeRecipientUSDCBalanceBefore = setup.feeRecipientBalanceBefore
        userEthBalanceBeforeTx = setup.userEthBalanceBeforeTx
      })

      it('Open Tx should pass', () => {
        expect(openTxStatus).to.be.true
      })

      it('Close Tx should pass', () => {
        expect(txStatus).to.be.true
      })

      it('Should payback all debt', () => {
        expectToBeEqual(new BigNumber(userAccountData.totalDebtETH.toString()), ZERO)
      })

      it(`Should withdraw all ${tokens.ETH} tokens from aave`, () => {
        //due to quirks of how stEth works there might be 1 wei left in aave
        expectToBe(new BigNumber(userWethReserveData.currentATokenBalance.toString()), 'lte', ONE)
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

      it('should not be any token left on proxy', async () => {
        const proxyWethBalance = await balanceOf(
          ADDRESSES.main.WETH,
          system.common.dsProxy.address,
          {
            config,
          },
        )
        const proxyUSDCBalance = await balanceOf(
          ADDRESSES.main.USDC,
          system.common.dsProxy.address,
          {
            config,
          },
        )

        expectToBeEqual(proxyWethBalance, ZERO)
        expectToBeEqual(proxyUSDCBalance, ZERO)
      })
    })

    describe(`With ${tokens.WBTC} collateral & ${tokens.USDC} debt`, () => {
      const depositWBTCAmount = new BigNumber(6)

      let userWethReserveData: AAVEReserveData
      let userUSDCReserveData: AAVEReserveData
      let userEthBalanceBeforeTx: BigNumber
      let userAccountData: AAVEAccountData
      let feeRecipientUSDCBalanceBefore: BigNumber
      let finalPosition: IPosition
      let system: DeployedSystemInfo
      let address: string

      before(async () => {
        const setup = await setupClosePositionTest(
          {
            depositOnOpenAmountInWei: amountToWei(depositWBTCAmount, 8),
            symbol: tokens.WBTC,
            address: ADDRESSES.main.WBTC,
            precision: 8,
            isEth: false,
          },
          {
            depositOnOpenAmountInWei: ZERO,
            symbol: tokens.USDC,
            address: ADDRESSES.main.USDC,
            precision: 6,
            isEth: false,
          },
          new BigNumber(19829),
          ONE.div(new BigNumber(19829)),
          true,
          blockNumber,
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
        feeRecipientUSDCBalanceBefore = setup.feeRecipientBalanceBefore
        userEthBalanceBeforeTx = setup.userEthBalanceBeforeTx
      })

      it('Open Tx should pass', () => {
        expect(openTxStatus).to.be.true
      })

      it('Close Tx should pass', () => {
        expect(txStatus).to.be.true
      })

      it('Should payback all debt', () => {
        expectToBeEqual(new BigNumber(userAccountData.totalDebtETH.toString()), ZERO)
      })

      it(`Should withdraw all ${tokens.ETH} tokens from aave`, () => {
        //due to quirks of how stEth works there might be 1 wei left in aave
        expectToBe(new BigNumber(userWethReserveData.currentATokenBalance.toString()), 'lte', ONE)
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

      it('should not be any token left on proxy', async () => {
        const proxyWBTCBalance = await balanceOf(
          ADDRESSES.main.WBTC,
          system.common.dsProxy.address,
          {
            config,
          },
        )
        const proxyUSDCBalance = await balanceOf(
          ADDRESSES.main.USDC,
          system.common.dsProxy.address,
          {
            config,
          },
        )

        expectToBeEqual(proxyWBTCBalance, ZERO)
        expectToBeEqual(proxyUSDCBalance, ZERO)
      })
    })
  })

  /**
   * NOTE: This test seems to periodically fail due to 1inch occassionally
   * routing the t/x via a uniswap pool that has a very low liquidity
   * and it seems to break the constant product K invariant on the pool.
   * Mostly likely because of out by 1 wei issues given Lido STETH is a rebased token
   */
  describe.skip('Should close position with real oneInch', () => {
    const multiple = new BigNumber(2)
    const slippage = new BigNumber(0.1)
    const depositAmount = amountToWei(new BigNumber(1))

    let positionMutation: IPositionMutation
    let positionAfterOpen: IPosition
    let openTxStatus: boolean
    let txStatus: boolean
    let tx: ContractReceipt

    let userStEthReserveData: AAVEReserveData
    let userWethReserveData: AAVEReserveData
    let userEthBalanceBeforeTx: BigNumber
    let userAccountData: AAVEAccountData
    let feeRecipientWethBalanceBefore: BigNumber
    let finalPosition: IPosition
    let system: DeployedSystemInfo
    let address: string

    before(async function () {
      const shouldRun1InchTests = process.env.RUN_1INCH_TESTS === '1'
      if (shouldRun1InchTests) {
        await resetNodeToLatestBlock(provider)
        const { signer, address } = await impersonateRichAccount(provider)
        config.signer = signer
        config.address = address

        const { system: _system } = await deploySystem(config, false, false)
        system = _system

        const addresses = {
          ...mainnetAddresses,
          operationExecutor: system.common.operationExecutor.address,
        }

        const openPositionMutation = await strategies.aave.open(
          {
            depositedByUser: {
              debtInWei: depositAmount,
            },
            slippage,
            multiple,
            debtToken: { symbol: tokens.ETH },
            collateralToken: {
              symbol: tokens.STETH,
            },
          },
          {
            addresses,
            provider,
            getSwapData: getOneInchCall(system.common.swap.address, ['ST_ETH']),
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
          depositAmount.toFixed(0),
        )
        openTxStatus = _openTxStatus

        feeRecipientWethBalanceBefore = await balanceOf(
          ADDRESSES.main.WETH,
          ADDRESSES.main.feeRecipient,
          { config, isFormatted: true },
        )

        const beforeCloseUserWethReserveData = await aaveDataProvider.getUserReserveData(
          ADDRESSES.main.WETH,
          system.common.dsProxy.address,
        )

        const beforeCloseUserStEthReserveData = await aaveDataProvider.getUserReserveData(
          ADDRESSES.main.stETH,
          system.common.dsProxy.address,
        )

        const stEthAmount = new BigNumber(
          beforeCloseUserStEthReserveData.currentATokenBalance.toString(),
        )

        const aavePriceOracle = new ethers.Contract(
          addresses.aavePriceOracle,
          aavePriceOracleABI,
          provider,
        )

        const aaveStEthTokenPriceInEthOnOpen = await aavePriceOracle
          .getAssetPrice(ADDRESSES.main.stETH)
          .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString())))

        const positionAfterOpen = new Position(
          {
            amount: new BigNumber(beforeCloseUserWethReserveData.currentVariableDebt.toString()),
            precision: 18,
            symbol: tokens.ETH,
          },
          {
            amount: new BigNumber(beforeCloseUserStEthReserveData.currentATokenBalance.toString()),
            precision: 18,
            symbol: tokens.STETH,
          },
          aaveStEthTokenPriceInEthOnOpen,
          openPositionMutation.simulation.position.category,
        )

        const positionMutation = await strategies.aave.close(
          {
            collateralToken: { symbol: tokens.STETH },
            debtToken: { symbol: tokens.ETH },
            slippage,
            collateralAmountLockedInProtocolInWei: stEthAmount,
            collectSwapFeeFrom: 'targetToken',
          },
          {
            addresses,
            provider,
            position: positionAfterOpen,
            getSwapData: getOneInchCall(system.common.swap.address, ['ST_ETH']),
            proxy: system.common.dsProxy.address,
          },
        )

        userEthBalanceBeforeTx = await balanceOf(ADDRESSES.main.ETH, address, {
          config,
          isFormatted: true,
        })

        const [_closeTxStatus, _closeTx] = await executeThroughProxy(
          system.common.dsProxy.address,
          {
            address: system.common.operationExecutor.address,
            calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
              positionMutation.transaction.calls,
              OPERATION_NAMES.common.CUSTOM_OPERATION,
            ]),
          },
          signer,
          '0',
        )
        txStatus = _closeTxStatus
        tx = _closeTx

        userAccountData = await aaveLendingPool.getUserAccountData(system.common.dsProxy.address)
        userStEthReserveData = await aaveDataProvider.getUserReserveData(
          ADDRESSES.main.stETH,
          system.common.dsProxy.address,
        )

        userWethReserveData = await aaveDataProvider.getUserReserveData(
          ADDRESSES.main.WETH,
          system.common.dsProxy.address,
        )

        const aaveStEthTokenPriceInEth = await aavePriceOracle
          .getAssetPrice(ADDRESSES.main.stETH)
          .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString())))

        const aaveWethTokenPriceInEth = await aavePriceOracle
          .getAssetPrice(ADDRESSES.main.WETH)
          .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString())))

        const oracle = aaveStEthTokenPriceInEth.div(aaveWethTokenPriceInEth)

        finalPosition = new Position(
          {
            amount: new BigNumber(userWethReserveData.currentVariableDebt.toString()),
            precision: 18,
            symbol: tokens.ETH,
          },
          {
            amount: new BigNumber(userStEthReserveData.currentATokenBalance.toString()),
            precision: 18,
            symbol: tokens.STETH,
          },
          oracle,
          positionMutation.simulation.position.category,
        )
      } else {
        this.skip()
      }
    })

    it('Open Tx should pass', () => {
      expect(openTxStatus).to.be.true
    })

    it('Close Tx should pass', () => {
      expect(txStatus).to.be.true
    })

    it('Should payback all debt', () => {
      expectToBeEqual(new BigNumber(userAccountData.totalDebtETH.toString()), ZERO)
    })

    it('Should withdraw all stEth tokens from aave', () => {
      expectToBe(new BigNumber(userStEthReserveData.currentATokenBalance.toString()), 'lte', ONE)
    })

    // it('Should collect fee', async () => {
    //   const feeRecipientWethBalanceAfter = await balanceOf(
    //     ADDRESSES.main.WETH,
    //     ADDRESSES.main.feeRecipient,
    //     { config, isFormatted: true },
    //   )

    //   expectToBeEqual(
    //     new BigNumber(closePositionMutation.simulation.swap.sourceTokenFee),
    //     feeRecipientWethBalanceAfter.minus(feeRecipientWethBalanceBefore),
    //   )
    // })

    // it('should not be any token left on proxy', async () => {
    //   const proxyWethBalance = await balanceOf(ADDRESSES.main.WETH, system.common.dsProxy.address, {
    //     config,
    //     isFormatted: true,
    //   })
    //   const proxyStEthBalance = await balanceOf(
    //     ADDRESSES.main.stETH,
    //     system.common.dsProxy.address,
    //     {
    //       config,
    //       isFormatted: true,
    //     },
    //   )
    //   const proxyEthBalance = await balanceOf(ADDRESSES.main.ETH, system.common.dsProxy.address, {
    //     config,
    //     isFormatted: true,
    //   })

    //   expectToBeEqual(proxyWethBalance, ZERO)
    //   expectToBeEqual(proxyStEthBalance, ZERO)
    //   expectToBeEqual(proxyEthBalance, ZERO)
    // })

    // it('should return eth to the user', async () => {
    //   const userEthBalanceAfterTx = await balanceOf(ADDRESSES.main.ETH, address, {
    //     config,
    //     isFormatted: true,
    //   })

    //   const txCost = amountFromWei(new BigNumber(tx.gasUsed.mul(tx.effectiveGasPrice).toString()))

    //   const delta = userEthBalanceAfterTx.minus(userEthBalanceBeforeTx).plus(txCost)

    //   const expectToGet = amountFromWei(closePositionMutation.simulation.swap.toTokenAmount)
    //     .minus(closePositionMutation.simulation.swap.sourceTokenFee)
    //     .minus(amountFromWei(depositAmount).times(multiple).minus(amountFromWei(depositAmount)))

    //   expectToBe(delta, 'gte', expectToGet)
    // })
  })
})
