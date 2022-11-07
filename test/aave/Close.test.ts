import { JsonRpcProvider } from '@ethersproject/providers'
import {
  ADDRESSES,
<<<<<<< HEAD
=======
  IPosition,
>>>>>>> d93f5ce (refactor: Close stategy & Operation to generalise them)
  ONE,
  OPERATION_NAMES,
  Position,
  strategies,
  ZERO,
} from '@oasisdex/oasis-actions'
import aavePriceOracleABI from '@oasisdex/oasis-actions/lib/src/abi/aavePriceOracle.json'
<<<<<<< HEAD
import { IPositionTransition } from '@oasisdex/oasis-actions/src'
import { amountFromWei } from '@oasisdex/oasis-actions/src/helpers'
import { AAVETokens } from '@oasisdex/oasis-actions/src/operations/aave/tokens'
import { Address } from '@oasisdex/oasis-actions/src/strategies/types/IPositionRepository'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { loadFixture } from 'ethereum-waffle'
import { Contract, ethers, Signer } from 'ethers'
=======
import { IPositionMutation } from '@oasisdex/oasis-actions/src'
import { amountFromWei } from '@oasisdex/oasis-actions/src/helpers'
import { PositionBalance } from '@oasisdex/oasis-actions/src/helpers/calculations/Position'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { loadFixture } from 'ethereum-waffle'
import { Contract, ContractReceipt, ethers, Signer } from 'ethers'
>>>>>>> d93f5ce (refactor: Close stategy & Operation to generalise them)

import AAVEDataProviderABI from '../../abi/aaveDataProvider.json'
import AAVELendigPoolABI from '../../abi/aaveLendingPool.json'
import ERC20ABI from '../../abi/IERC20.json'
import { AAVEAccountData, AAVEReserveData } from '../../helpers/aave'
import { executeThroughProxy } from '../../helpers/deploy'
<<<<<<< HEAD
import { impersonateRichAccount, resetNodeToLatestBlock } from '../../helpers/init'
import { restoreSnapshot } from '../../helpers/restoreSnapshot'
import { getOneInchCall } from '../../helpers/swap/OneInchCall'
=======
import { resetNodeToLatestBlock } from '../../helpers/init'
import { restoreSnapshot } from '../../helpers/restoreSnapshot'
import { getOneInchCall } from '../../helpers/swap/OneIchCall'
>>>>>>> d93f5ce (refactor: Close stategy & Operation to generalise them)
import { oneInchCallMock } from '../../helpers/swap/OneInchCallMock'
import { RuntimeConfig } from '../../helpers/types/common'
import { amountToWei, balanceOf } from '../../helpers/utils'
import { mainnetAddresses } from '../addresses'
<<<<<<< HEAD
import { testBlockNumber } from '../config'
import { tokens } from '../constants'
import { DeployedSystemInfo, deploySystem } from '../deploySystem'
import { initialiseConfig } from '../fixtures/setup'
import { expectToBe, expectToBeEqual, TESTING_OFFSET } from '../utils'

describe(`Strategy | AAVE | Close Position`, async () => {
=======
import { tokens } from '../constants'
import { DeployedSystemInfo, deploySystem } from '../deploySystem'
import { initialiseConfig } from '../fixtures/setup'
import { expectToBe, expectToBeEqual } from '../utils'

describe(`Strategy | AAVE | Close Position`, async () => {
  const depositAmount = amountToWei(new BigNumber(60 / 1e12))
  const multiple = new BigNumber(2)
  const slippage = new BigNumber(0.1)
  let aaveStEthPriceInEth: BigNumber

  // In this case we can safely assume this constant value for a given block,
  // this value should be changed when changing block number
  const ethAmountReturnedFromSwap = amountFromWei(new BigNumber('107850'))

  let WETH: Contract
  let stETH: Contract
>>>>>>> d93f5ce (refactor: Close stategy & Operation to generalise them)
  let aaveLendingPool: Contract
  let aaveDataProvider: Contract
  let provider: JsonRpcProvider
  let config: RuntimeConfig
  let signer: Signer
<<<<<<< HEAD
  let userAddress: Address

  before(async () => {
    ;({ config, provider, signer, address: userAddress } = await loadFixture(initialiseConfig))
=======
  let address: string

  let system: DeployedSystemInfo

  let openTxStatus: boolean

  let openPositionMutation: IPositionMutation
  let closePositionMutation: IPositionMutation
  let closeTxStatus: boolean
  let closeTx: ContractReceipt

  let afterCloseUserAccountData: AAVEAccountData
  let afterCloseUserStEthReserveData: AAVEReserveData

  let feeRecipientWethBalanceBefore: BigNumber
  let userEthBalanceBeforeTx: BigNumber

  before(async () => {
    ;({ config, provider, signer, address } = await loadFixture(initialiseConfig))
>>>>>>> d93f5ce (refactor: Close stategy & Operation to generalise them)

    aaveLendingPool = new Contract(
      ADDRESSES.main.aave.MainnetLendingPool,
      AAVELendigPoolABI,
      provider,
    )
    aaveDataProvider = new Contract(ADDRESSES.main.aave.DataProvider, AAVEDataProviderABI, provider)
<<<<<<< HEAD
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
      blockNumber?: number,
    ) {
      const _blockNumber = blockNumber || testBlockNumber
      const { snapshot, config: newConfig } = await restoreSnapshot(config, provider, _blockNumber)
      config = newConfig
      signer = newConfig.signer

      const system = snapshot.deployed.system
=======
    WETH = new Contract(ADDRESSES.main.WETH, ERC20ABI, provider)
    stETH = new Contract(ADDRESSES.main.stETH, ERC20ABI, provider)
  })

  describe('On forked chain', () => {
    const testBlockWithSufficientLiquidityInUswapPool = 15690000
    before(async () => {
      const { snapshot } = await restoreSnapshot(
        config,
        provider,
        testBlockWithSufficientLiquidityInUswapPool,
      )

      system = snapshot.deployed.system
>>>>>>> d93f5ce (refactor: Close stategy & Operation to generalise them)

      const addresses = {
        ...mainnetAddresses,
        operationExecutor: system.common.operationExecutor.address,
      }

<<<<<<< HEAD
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
      const proxy = system.common.dsProxy.address
      const openPositionTransition = await strategies.aave.open(
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
=======
      openPositionMutation = await strategies.aave.open(
        {
          depositedByUser: {
            debtInWei: depositAmount,
          },
          slippage,
          multiple,
          debtToken: { symbol: tokens.ETH },
          collateralToken: { symbol: tokens.STETH },
>>>>>>> d93f5ce (refactor: Close stategy & Operation to generalise them)
        },
        {
          addresses,
          provider,
<<<<<<< HEAD
          getSwapData: oneInchCallMock(mockMarketPriceOnOpen),
          proxy: system.common.dsProxy.address,
          user: userAddress,
          currentPosition: await strategies.aave.view(
            {
              proxy,
              collateralToken,
              debtToken,
            },
            {
              addresses,
              provider,
            },
          ),
=======
          getSwapData: oneInchCallMock(new BigNumber(0.9759)),
          proxy: system.common.dsProxy.address,
>>>>>>> d93f5ce (refactor: Close stategy & Operation to generalise them)
        },
      )

      const [_openTxStatus] = await executeThroughProxy(
        system.common.dsProxy.address,
        {
          address: system.common.operationExecutor.address,
          calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
<<<<<<< HEAD
            openPositionTransition.transaction.calls,
=======
            openPositionMutation.transaction.calls,
>>>>>>> d93f5ce (refactor: Close stategy & Operation to generalise them)
            OPERATION_NAMES.common.CUSTOM_OPERATION,
          ]),
        },
        signer,
<<<<<<< HEAD
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
=======
        depositAmount.toFixed(0),
      )
      openTxStatus = _openTxStatus
>>>>>>> d93f5ce (refactor: Close stategy & Operation to generalise them)

      const aavePriceOracle = new ethers.Contract(
        addresses.aavePriceOracle,
        aavePriceOracleABI,
        provider,
      )

<<<<<<< HEAD
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
          proxy: system.common.dsProxy.address,
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

    describe(`With ${tokens.STETH} collateral & ${tokens.ETH} debt`, () => {
      const depositAmount = amountToWei(new BigNumber(1))

      let userStEthReserveData: AAVEReserveData
      let userAccountData: AAVEAccountData
      let feeRecipientWethBalanceBefore: BigNumber
      let system: DeployedSystemInfo

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
          userAddress,
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
            positionTransition.simulation.swap.tokenFee
              .div(ONE.minus(slippage).minus(TESTING_OFFSET))
              .toString(),
          ).toFixed(0),
          'gte',
          actualWethFees,
        )

        expectToBe(positionTransition.simulation.swap.tokenFee, 'lte', actualWethFees)
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
=======
      aaveStEthPriceInEth = await aavePriceOracle
        .getAssetPrice(addresses.stETH)
        .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString())))

      feeRecipientWethBalanceBefore = await balanceOf(
        ADDRESSES.main.WETH,
        ADDRESSES.main.feeRecipient,
        { config, isFormatted: true },
      )
    })

    it('Open Tx should pass', () => {
      expect(openTxStatus).to.be.true
    })

    describe('Should close on forked chain', () => {
      before(async () => {
        const addresses = {
          ...mainnetAddresses,
          operationExecutor: system.common.operationExecutor.address,
        }

        const beforeCloseUserAccountData = await aaveLendingPool.getUserAccountData(
          system.common.dsProxy.address,
        )

        const beforeCloseUserStEthReserveData = await aaveDataProvider.getUserReserveData(
          ADDRESSES.main.stETH,
          system.common.dsProxy.address,
        )

        const stEthAmount = new BigNumber(
          beforeCloseUserStEthReserveData.currentATokenBalance.toString(),
        )

        const positionAfterOpen = new Position(
          {
            amount: new BigNumber(beforeCloseUserAccountData.totalDebtETH.toString()),
            symbol: tokens.ETH,
          },
          {
            amount: new BigNumber(beforeCloseUserStEthReserveData.currentATokenBalance.toString()),
            symbol: tokens.STETH,
          },
          aaveStEthPriceInEth,
          openPositionMutation.simulation.position.category,
        )

        closePositionMutation = await strategies.aave.close(
          {
            collateralToken: { symbol: tokens.STETH },
            debtToken: { symbol: tokens.ETH },
            slippage,
            collateralAmountLockedInProtocolInWei: stEthAmount,
          },
          {
            addresses,
            provider,
            position: positionAfterOpen,
            getSwapData: oneInchCallMock(ONE.div(new BigNumber(0.9759))),
            proxy: system.common.dsProxy.address,
          },
        )

        userEthBalanceBeforeTx = await balanceOf(ADDRESSES.main.ETH, address, {
>>>>>>> d93f5ce (refactor: Close stategy & Operation to generalise them)
          config,
          isFormatted: true,
        })

<<<<<<< HEAD
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
            positionTransition.simulation.swap.tokenFee
              .div(ONE.minus(slippage).minus(TESTING_OFFSET))
              .toString(),
          ).toFixed(0),
          'gte',
          actualUSDCFees,
        )

        expectToBe(positionTransition.simulation.swap.tokenFee, 'lte', actualUSDCFees)
=======
        const [_closeTxStatus, _closeTx] = await executeThroughProxy(
          system.common.dsProxy.address,
          {
            address: system.common.operationExecutor.address,
            calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
              closePositionMutation.transaction.calls,
              OPERATION_NAMES.common.CUSTOM_OPERATION,
            ]),
          },
          signer,
          '0',
        )

        closeTxStatus = _closeTxStatus
        closeTx = _closeTx

        afterCloseUserAccountData = await aaveLendingPool.getUserAccountData(
          system.common.dsProxy.address,
        )

        afterCloseUserStEthReserveData = await aaveDataProvider.getUserReserveData(
          ADDRESSES.main.stETH,
          system.common.dsProxy.address,
        )
      })

      it('Close Tx should pass', () => {
        expect(closeTxStatus).to.be.true
      })

      it('Should payback all debt', () => {
        expectToBeEqual(new BigNumber(afterCloseUserAccountData.totalDebtETH.toString()), ZERO)
      })

      it('Should withdraw all stEth tokens from aave', () => {
        //due to quirks of how stEth works there might be 1 wei left in aave
        expectToBe(
          new BigNumber(afterCloseUserStEthReserveData.currentATokenBalance.toString()),
          'lte',
          ONE,
        )
      })

      it('Should collect fee', async () => {
        const feeRecipientWethBalanceAfter = await balanceOf(
          ADDRESSES.main.WETH,
          ADDRESSES.main.feeRecipient,
          { config, isFormatted: true },
        )

        //TODO improve precision
        expectToBeEqual(
          ethAmountReturnedFromSwap.times(0.002),
          feeRecipientWethBalanceAfter.minus(feeRecipientWethBalanceBefore),
          5,
        )
>>>>>>> d93f5ce (refactor: Close stategy & Operation to generalise them)
      })

      it('should not be any token left on proxy', async () => {
        const proxyWethBalance = await balanceOf(
          ADDRESSES.main.WETH,
          system.common.dsProxy.address,
          {
            config,
<<<<<<< HEAD
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
      let userAccountData: AAVEAccountData
      let feeRecipientUSDCBalanceBefore: BigNumber
      let system: DeployedSystemInfo

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
          userAddress,
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
            positionTransition.simulation.swap.tokenFee
              .div(ONE.minus(slippage).minus(TESTING_OFFSET))
              .toString(),
          ).toFixed(0),
          'gte',
          actualUSDCFees,
        )

        expectToBe(positionTransition.simulation.swap.tokenFee, 'lte', actualUSDCFees)
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
=======
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

      it('should return eth to the user', async () => {
        const userEthBalanceAfterTx = await balanceOf(ADDRESSES.main.ETH, address, {
          config,
          isFormatted: true,
        })

        const txCost = amountFromWei(
          new BigNumber(closeTx.gasUsed.mul(closeTx.effectiveGasPrice).toString()),
        )

        const delta = userEthBalanceAfterTx.minus(userEthBalanceBeforeTx).plus(txCost)

        expectToBeEqual(delta, ethAmountReturnedFromSwap.minus(10 / 1e15), 4)
>>>>>>> d93f5ce (refactor: Close stategy & Operation to generalise them)
      })
    })
  })

<<<<<<< HEAD
  describe.skip('Should close position with real oneInch', () => {
    const multiple = new BigNumber(2)
    const slippage = new BigNumber(0.1)
    const depositAmount = amountToWei(new BigNumber(1))

    let openTxStatus: boolean
    let txStatus: boolean

    let userStEthReserveData: AAVEReserveData
    let userAccountData: AAVEAccountData
    let system: DeployedSystemInfo
=======
  describe('Should close position with real oneInch', () => {
    const slippage = new BigNumber(0.1)
>>>>>>> d93f5ce (refactor: Close stategy & Operation to generalise them)

    before(async function () {
      const shouldRun1InchTests = process.env.RUN_1INCH_TESTS === '1'
      if (shouldRun1InchTests) {
        await resetNodeToLatestBlock(provider)
<<<<<<< HEAD
        const { signer, address } = await impersonateRichAccount(provider)
        config.signer = signer
        config.address = address

=======
>>>>>>> d93f5ce (refactor: Close stategy & Operation to generalise them)
        const { system: _system } = await deploySystem(config, false, false)
        system = _system

        const addresses = {
          ...mainnetAddresses,
          operationExecutor: system.common.operationExecutor.address,
        }

<<<<<<< HEAD
        const proxy = system.common.dsProxy.address
        const debtToken = { symbol: tokens.ETH }
        const collateralToken = {
          symbol: tokens.STETH,
        }
        const openPositionTransition = await strategies.aave.open(
=======
        const openStrategy = await strategies.aave.open(
>>>>>>> d93f5ce (refactor: Close stategy & Operation to generalise them)
          {
            depositedByUser: {
              debtInWei: depositAmount,
            },
            slippage,
            multiple,
<<<<<<< HEAD
            debtToken,
            collateralToken,
=======
            debtToken: { symbol: tokens.ETH },
            collateralToken: {
              symbol: tokens.STETH,
            },
>>>>>>> d93f5ce (refactor: Close stategy & Operation to generalise them)
          },
          {
            addresses,
            provider,
<<<<<<< HEAD
            getSwapData: getOneInchCall(system.common.swap.address, ['ST_ETH']),
            proxy: system.common.dsProxy.address,
            currentPosition: await strategies.aave.view(
              {
                proxy,
                collateralToken,
                debtToken,
              },
              {
                addresses,
                provider,
              },
            ),
            user: config.address,
=======
            getSwapData: getOneInchCall(system.common.swap.address),
            proxy: system.common.dsProxy.address,
>>>>>>> d93f5ce (refactor: Close stategy & Operation to generalise them)
          },
        )

        const [_openTxStatus] = await executeThroughProxy(
          system.common.dsProxy.address,
          {
            address: system.common.operationExecutor.address,
            calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
<<<<<<< HEAD
              openPositionTransition.transaction.calls,
=======
              openPositionMutation.transaction.calls,
>>>>>>> d93f5ce (refactor: Close stategy & Operation to generalise them)
              OPERATION_NAMES.common.CUSTOM_OPERATION,
            ]),
          },
          signer,
          depositAmount.toFixed(0),
        )
        openTxStatus = _openTxStatus

<<<<<<< HEAD
        const beforeCloseUserWethReserveData = await aaveDataProvider.getUserReserveData(
          ADDRESSES.main.WETH,
=======
        feeRecipientWethBalanceBefore = await balanceOf(
          ADDRESSES.main.WETH,
          ADDRESSES.main.feeRecipient,
          { config, isFormatted: true },
        )

        const beforeCloseUserAccountData = await aaveLendingPool.getUserAccountData(
>>>>>>> d93f5ce (refactor: Close stategy & Operation to generalise them)
          system.common.dsProxy.address,
        )

        const beforeCloseUserStEthReserveData = await aaveDataProvider.getUserReserveData(
          ADDRESSES.main.stETH,
          system.common.dsProxy.address,
        )
<<<<<<< HEAD

=======
>>>>>>> d93f5ce (refactor: Close stategy & Operation to generalise them)
        const stEthAmount = new BigNumber(
          beforeCloseUserStEthReserveData.currentATokenBalance.toString(),
        )

        const aavePriceOracle = new ethers.Contract(
          addresses.aavePriceOracle,
          aavePriceOracleABI,
          provider,
        )

<<<<<<< HEAD
        const aaveStEthTokenPriceInEthOnOpen = await aavePriceOracle
          .getAssetPrice(ADDRESSES.main.stETH)
=======
        aaveStEthPriceInEth = await aavePriceOracle
          .getAssetPrice(addresses.stETH)
>>>>>>> d93f5ce (refactor: Close stategy & Operation to generalise them)
          .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString())))

        const positionAfterOpen = new Position(
          {
<<<<<<< HEAD
            amount: new BigNumber(beforeCloseUserWethReserveData.currentVariableDebt.toString()),
            precision: 18,
=======
            amount: new BigNumber(beforeCloseUserAccountData.totalDebtETH.toString()),
>>>>>>> d93f5ce (refactor: Close stategy & Operation to generalise them)
            symbol: tokens.ETH,
          },
          {
            amount: new BigNumber(beforeCloseUserStEthReserveData.currentATokenBalance.toString()),
<<<<<<< HEAD
            precision: 18,
            symbol: tokens.STETH,
          },
          aaveStEthTokenPriceInEthOnOpen,
          openPositionTransition.simulation.position.category,
        )

        const positionTransition = await strategies.aave.close(
=======
            symbol: tokens.STETH,
          },
          aaveStEthPriceInEth,
          openStrategy.simulation.position.category,
        )

        closePositionMutation = await strategies.aave.close(
>>>>>>> d93f5ce (refactor: Close stategy & Operation to generalise them)
          {
            collateralToken: { symbol: tokens.STETH },
            debtToken: { symbol: tokens.ETH },
            slippage,
            collateralAmountLockedInProtocolInWei: stEthAmount,
<<<<<<< HEAD
            collectSwapFeeFrom: 'targetToken',
=======
>>>>>>> d93f5ce (refactor: Close stategy & Operation to generalise them)
          },
          {
            addresses,
            provider,
<<<<<<< HEAD
            currentPosition: positionAfterOpen,
            getSwapData: getOneInchCall(system.common.swap.address, ['ST_ETH']),
            proxy: system.common.dsProxy.address,
            user: config.address,
          },
        )

        const [_closeTxStatus] = await executeThroughProxy(
=======
            position: positionAfterOpen,
            getSwapData: getOneInchCall(system.common.swap.address),
            proxy: system.common.dsProxy.address,
          },
        )

        userEthBalanceBeforeTx = await balanceOf(ADDRESSES.main.ETH, address, {
          config,
          isFormatted: true,
        })

        const [_closeTxStatus, _closeTx] = await executeThroughProxy(
>>>>>>> d93f5ce (refactor: Close stategy & Operation to generalise them)
          system.common.dsProxy.address,
          {
            address: system.common.operationExecutor.address,
            calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
<<<<<<< HEAD
              positionTransition.transaction.calls,
=======
              closePositionMutation.transaction.calls,
>>>>>>> d93f5ce (refactor: Close stategy & Operation to generalise them)
              OPERATION_NAMES.common.CUSTOM_OPERATION,
            ]),
          },
          signer,
          '0',
        )
<<<<<<< HEAD
        txStatus = _closeTxStatus

        userAccountData = await aaveLendingPool.getUserAccountData(system.common.dsProxy.address)
        userStEthReserveData = await aaveDataProvider.getUserReserveData(
=======
        closeTxStatus = _closeTxStatus
        closeTx = _closeTx

        afterCloseUserAccountData = await aaveLendingPool.getUserAccountData(
          system.common.dsProxy.address,
        )
        afterCloseUserStEthReserveData = await aaveDataProvider.getUserReserveData(
>>>>>>> d93f5ce (refactor: Close stategy & Operation to generalise them)
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
<<<<<<< HEAD
      expect(txStatus).to.be.true
    })

    it('Should payback all debt', () => {
      expectToBeEqual(new BigNumber(userAccountData.totalDebtETH.toString()), ZERO)
    })

    it('Should withdraw all stEth tokens from aave', () => {
      expectToBe(new BigNumber(userStEthReserveData.currentATokenBalance.toString()), 'lte', ONE)
=======
      expect(closeTxStatus).to.be.true
    })

    it('Should payback all debt', () => {
      expectToBeEqual(new BigNumber(afterCloseUserAccountData.totalDebtETH.toString()), ZERO)
    })

    it('Should withdraw all stEth tokens from aave', () => {
      expectToBe(
        new BigNumber(afterCloseUserStEthReserveData.currentATokenBalance.toString()),
        'lte',
        ONE,
      )
    })

    it('Should collect fee', async () => {
      const feeRecipientWethBalanceAfter = await balanceOf(
        ADDRESSES.main.WETH,
        ADDRESSES.main.feeRecipient,
        { config, isFormatted: true },
      )

      expectToBeEqual(
        new BigNumber(closePositionMutation.simulation.swap.sourceTokenFee),
        feeRecipientWethBalanceAfter.minus(feeRecipientWethBalanceBefore),
      )
    })

    it('should not be any token left on proxy', async () => {
      const proxyWethBalance = await balanceOf(ADDRESSES.main.WETH, system.common.dsProxy.address, {
        config,
        isFormatted: true,
      })
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

    it('should return eth to the user', async () => {
      const userEthBalanceAfterTx = await balanceOf(ADDRESSES.main.ETH, address, {
        config,
        isFormatted: true,
      })

      const txCost = amountFromWei(
        new BigNumber(closeTx.gasUsed.mul(closeTx.effectiveGasPrice).toString()),
      )

      const delta = userEthBalanceAfterTx.minus(userEthBalanceBeforeTx).plus(txCost)

      const expectToGet = amountFromWei(closePositionMutation.simulation.swap.toTokenAmount)
        .minus(closePositionMutation.simulation.swap.sourceTokenFee)
        .minus(amountFromWei(depositAmount).times(multiple).minus(amountFromWei(depositAmount)))

      expectToBe(delta, 'gte', expectToGet)
>>>>>>> d93f5ce (refactor: Close stategy & Operation to generalise them)
    })
  })
})
