import { JsonRpcProvider } from '@ethersproject/providers'
import { ADDRESSES, ONE, Position, strategies, ZERO } from '@oasisdex/oasis-actions'
import aavePriceOracleABI from '@oasisdex/oasis-actions/lib/src/abi/aavePriceOracle.json'
import { PositionType } from '@oasisdex/oasis-actions/lib/src/strategies/types/PositionType'
import { IPositionTransition } from '@oasisdex/oasis-actions/src'
import { amountFromWei } from '@oasisdex/oasis-actions/src/helpers'
import { AAVETokens, TOKEN_DEFINITIONS } from '@oasisdex/oasis-actions/src/operations/aave/tokens'
import { Address } from '@oasisdex/oasis-actions/src/strategies/types/IPositionRepository'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { loadFixture } from 'ethereum-waffle'
import { Contract, ethers, Signer } from 'ethers'

import AAVEDataProviderABI from '../../abi/aaveDataProvider.json'
import AAVELendigPoolABI from '../../abi/aaveLendingPool.json'
import ERC20ABI from '../../abi/IERC20.json'
import { AAVEAccountData, AAVEReserveData } from '../../helpers/aave'
import { executeThroughProxy } from '../../helpers/deploy'
import { resetNodeToLatestBlock } from '../../helpers/init'
import { restoreSnapshot } from '../../helpers/restoreSnapshot'
import { getOneInchCall } from '../../helpers/swap/OneInchCall'
import { oneInchCallMock } from '../../helpers/swap/OneInchCallMock'
import { swapUniswapTokens } from '../../helpers/swap/uniswap'
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
  let userAddress: Address

  before(async () => {
    ;({ config, provider, signer, address: userAddress } = await loadFixture(initialiseConfig))

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

    let positionTransition: IPositionTransition
    let openTxStatus: boolean
    let txStatus: boolean

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
      userAddress: Address,
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
        debtToken.depositOnOpenAmountInWei.gt(ZERO) &&
        (await swapUniswapTokens(
          ADDRESSES.main.WETH,
          debtToken.address,
          swapETHtoDepositTokens.toFixed(0),
          ONE.toFixed(0),
          config.address,
          config,
        ))

      !collateralToken.isEth &&
        collateralToken.depositOnOpenAmountInWei.gt(ZERO) &&
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
          positionArgs: {
            positionId: 123,
            positionType: positionType,
            protocol: 'AAVE' as const,
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
          proxy,
          user: userAddress,
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

      if (!openTxStatus) throw new Error('open t/x failed')
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

      // Now close the position
      const positionTransition = await strategies.aave.close(
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
          currentPosition: positionAfterOpen,
          getSwapData: oneInchCallMock(mockMarketPriceOnClose, {
            from: collateralToken.precision,
            to: debtToken.precision,
          }),
          proxy,
          user: userAddress,
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
            positionTransition.transaction.calls,
            positionTransition.transaction.operationName,
          ]),
        },
        signer,
        '0',
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
        positionTransition.simulation.position.category,
      )

      return {
        system,
        address: config.address,
        positionTransition,
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

    describe(`With ${tokens.stETH} collateral & ${tokens.ETH} debt`, () => {
      const depositAmount = amountToWei(new BigNumber(1))

      let userStEthReserveData: AAVEReserveData
      let userAccountData: AAVEAccountData
      let feeRecipientWethBalanceBefore: BigNumber
      let system: DeployedSystemInfo

      before(async () => {
        const setup = await setupClosePositionTest(
          {
            depositOnOpenAmountInWei: ZERO,
            symbol: tokens.stETH,
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
          userAddress,
          'Earn',
        )
        system = setup.system
        txStatus = setup.txStatus
        openTxStatus = setup.openTxStatus
        positionTransition = setup.positionTransition
        userStEthReserveData = setup.userCollateralReserveData
        userAccountData = setup.userAccountData
        feeRecipientWethBalanceBefore = setup.feeRecipientBalanceBefore
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

      it(`Should withdraw all ${tokens.stETH} tokens from aave`, () => {
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
            positionTransition.simulation
              .swap!.tokenFee.div(ONE.minus(slippage).minus(TESTING_OFFSET))
              .toString(),
          ).toFixed(0),
          'gte',
          actualWethFees,
        )

        expectToBe(positionTransition.simulation.swap!.tokenFee, 'lte', actualWethFees)
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
      let userAccountData: AAVEAccountData
      let feeRecipientUSDCBalanceBefore: BigNumber
      let system: DeployedSystemInfo

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
          userAddress,
          'Multiply',
        )
        system = setup.system
        txStatus = setup.txStatus
        openTxStatus = setup.openTxStatus
        positionTransition = setup.positionTransition
        userWethReserveData = setup.userCollateralReserveData
        userAccountData = setup.userAccountData
        feeRecipientUSDCBalanceBefore = setup.feeRecipientBalanceBefore
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
            positionTransition.simulation
              .swap!.tokenFee.div(ONE.minus(slippage).minus(TESTING_OFFSET))
              .toString(),
          ).toFixed(0),
          'gte',
          actualUSDCFees,
        )

        expectToBe(positionTransition.simulation.swap!.tokenFee, 'lte', actualUSDCFees)
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

    describe(`With ${tokens.wBTC} collateral & ${tokens.USDC} debt`, () => {
      const depositWBTCAmount = new BigNumber(6)

      let userWethReserveData: AAVEReserveData
      let userAccountData: AAVEAccountData
      let feeRecipientUSDCBalanceBefore: BigNumber
      let system: DeployedSystemInfo

      before(async () => {
        const setup = await setupClosePositionTest(
          {
            depositOnOpenAmountInWei: amountToWei(depositWBTCAmount, 8),
            symbol: tokens.wBTC,
            address: ADDRESSES.main.wBTC,
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
          userAddress,
          'Multiply',
          blockNumber,
        )
        system = setup.system
        txStatus = setup.txStatus
        openTxStatus = setup.openTxStatus
        positionTransition = setup.positionTransition
        userWethReserveData = setup.userCollateralReserveData
        userAccountData = setup.userAccountData
        feeRecipientUSDCBalanceBefore = setup.feeRecipientBalanceBefore
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
            positionTransition.simulation
              .swap!.tokenFee.div(ONE.minus(slippage).minus(TESTING_OFFSET))
              .toString(),
          ).toFixed(0),
          'gte',
          actualUSDCFees,
        )

        expectToBe(positionTransition.simulation.swap!.tokenFee, 'lte', actualUSDCFees)
      })

      it('should not be any token left on proxy', async () => {
        const proxyWBTCBalance = await balanceOf(
          ADDRESSES.main.wBTC,
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

  describe('Should close position with real oneInch', () => {
    const multiple = new BigNumber(2)
    const slippage = new BigNumber(0.2)
    const depositAmount = amountToWei(new BigNumber(20))

    let openTxStatus: boolean
    let txStatus: boolean

    let userStEthReserveData: AAVEReserveData
    let userAccountData: AAVEAccountData
    let system: DeployedSystemInfo

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
        const debtToken = TOKEN_DEFINITIONS.ETH
        const collateralToken = TOKEN_DEFINITIONS.stETH
        const openPositionTransition = await strategies.aave.open(
          {
            depositedByUser: {
              debtToken: { amountInBaseUnit: depositAmount },
            },
            positionArgs: {
              positionId: 123,
              positionType: 'Earn',
              protocol: 'AAVE' as const,
            },
            slippage,
            multiple,
            debtToken,
            collateralToken,
          },
          {
            addresses,
            provider,
            getSwapData: getOneInchCall(system.common.swap.address, ['ST_ETH']),
            proxy,
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
            symbol: tokens.stETH,
          },
          aaveStEthTokenPriceInEthOnOpen,
          openPositionTransition.simulation.position.category,
        )

        const positionTransition = await strategies.aave.close(
          {
            collateralToken: TOKEN_DEFINITIONS.stETH,
            debtToken: TOKEN_DEFINITIONS.ETH,
            slippage,
            collateralAmountLockedInProtocolInWei: stEthAmount,
            collectSwapFeeFrom: 'targetToken',
          },
          {
            addresses,
            provider,
            currentPosition: positionAfterOpen,
            getSwapData: getOneInchCall(system.common.swap.address),
            proxy: system.common.dsProxy.address,
            user: config.address,
          },
        )

        const [_closeTxStatus] = await executeThroughProxy(
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
        txStatus = _closeTxStatus

        userAccountData = await aaveLendingPool.getUserAccountData(system.common.dsProxy.address)
        userStEthReserveData = await aaveDataProvider.getUserReserveData(
          ADDRESSES.main.stETH,
          system.common.dsProxy.address,
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
  })
})
