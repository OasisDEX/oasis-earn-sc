import { JsonRpcProvider } from '@ethersproject/providers'
import {
  ADDRESSES,
  IPosition,
  IStrategy,
  ONE,
  OPERATION_NAMES,
  Position,
  strategies,
  ZERO,
} from '@oasisdex/oasis-actions'
import aavePriceOracleABI from '@oasisdex/oasis-actions/lib/src/abi/aavePriceOracle.json'
import { amountFromWei } from '@oasisdex/oasis-actions/lib/src/helpers'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { loadFixture } from 'ethereum-waffle'
import { Contract, ContractReceipt, ethers, Signer } from 'ethers'

import AAVEDataProviderABI from '../../abi/aaveDataProvider.json'
import AAVELendigPoolABI from '../../abi/aaveLendingPool.json'
import ERC20ABI from '../../abi/IERC20.json'
import { AAVEAccountData, AAVEReserveData } from '../../helpers/aave'
import { executeThroughProxy } from '../../helpers/deploy'
import init, { resetNodeToLatestBlock } from '../../helpers/init'
import { restoreSnapshot } from '../../helpers/restoreSnapshot'
import { getOneInchCall } from '../../helpers/swap/OneIchCall'
import { oneInchCallMock } from '../../helpers/swap/OneInchCallMock'
import { RuntimeConfig } from '../../helpers/types/common'
import { amountToWei, balanceOf } from '../../helpers/utils'
import { DeployedSystemInfo, deploySystem } from '../deploySystem'
import { initialiseConfig } from '../fixtures/setup'
import { expectToBe, expectToBeEqual } from '../utils'

describe(`Strategy | AAVE | Adjust Position`, async () => {
  let WETH: Contract
  let stETH: Contract
  let aaveLendingPool: Contract
  let aaveDataProvider: Contract
  let provider: JsonRpcProvider
  let config: RuntimeConfig
  let signer: Signer
  let address: string

  const mainnetAddresses = {
    DAI: ADDRESSES.main.DAI,
    ETH: ADDRESSES.main.ETH,
    WETH: ADDRESSES.main.WETH,
    stETH: ADDRESSES.main.stETH,
    aaveProtocolDataProvider: ADDRESSES.main.aave.DataProvider,
    chainlinkEthUsdPriceFeed: ADDRESSES.main.chainlinkEthUsdPriceFeed,
    aavePriceOracle: ADDRESSES.main.aavePriceOracle,
    aaveLendingPool: ADDRESSES.main.aave.MainnetLendingPool,
  }

  before(async () => {
    config = await init()
    provider = config.provider
    signer = config.signer
    address = config.address

    aaveLendingPool = new Contract(
      ADDRESSES.main.aave.MainnetLendingPool,
      AAVELendigPoolABI,
      provider,
    )
    aaveDataProvider = new Contract(ADDRESSES.main.aave.DataProvider, AAVEDataProviderABI, provider)
    WETH = new Contract(ADDRESSES.main.WETH, ERC20ABI, provider)
    stETH = new Contract(ADDRESSES.main.stETH, ERC20ABI, provider)
  })

  describe('On forked chain', () => {
    const depositAmount = amountToWei(new BigNumber(60 / 1e12))
    const multiple = new BigNumber(2)
    const slippage = new BigNumber(0.1)
    let aaveStEthPriceInEth: BigNumber

    let system: DeployedSystemInfo

    let openStrategy: IStrategy

    let txStatus: boolean
    let tx: ContractReceipt

    let userAccountData: AAVEAccountData
    let userStEthReserveData: AAVEReserveData
    let actualPosition: IPosition

    let feeRecipientWethBalanceBefore: BigNumber

    before(async () => {
      ;({ config, provider, signer, address } = await loadFixture(initialiseConfig))
      const testBlockWithSufficientLiquidityInUswapPool = 15695000
      const snapshot = await restoreSnapshot(
        config,
        provider,
        testBlockWithSufficientLiquidityInUswapPool,
      )
      system = snapshot.deployed.system

      const addresses = {
        ...mainnetAddresses,
        operationExecutor: system.common.operationExecutor.address,
      }

      openStrategy = await strategies.aave.openStEth(
        {
          depositAmount,
          slippage,
          multiple,
          collectFeeFromSourceToken: true,
        },
        {
          addresses,
          provider,
          getSwapData: oneInchCallMock(new BigNumber(0.979)),
          dsProxy: system.common.dsProxy.address,
        },
      )

      feeRecipientWethBalanceBefore = await balanceOf(
        ADDRESSES.main.WETH,
        ADDRESSES.main.feeRecipient,
        { config, isFormatted: true },
      )

      const [_txStatus, _tx] = await executeThroughProxy(
        system.common.dsProxy.address,
        {
          address: system.common.operationExecutor.address,
          calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
            openStrategy.calls,
            OPERATION_NAMES.common.CUSTOM_OPERATION,
          ]),
        },
        signer,
        depositAmount.toFixed(0),
      )
      txStatus = _txStatus
      tx = _tx

      userAccountData = await aaveLendingPool.getUserAccountData(system.common.dsProxy.address)
      userStEthReserveData = await aaveDataProvider.getUserReserveData(
        ADDRESSES.main.stETH,
        system.common.dsProxy.address,
      )

      actualPosition = new Position(
        { amount: new BigNumber(userAccountData.totalDebtETH.toString()) },
        { amount: new BigNumber(userStEthReserveData.currentATokenBalance.toString()) },
        aaveStEthPriceInEth,
        openStrategy.simulation.position.category,
      )
    })

    it('Open Position Tx should pass', () => {
      expect(txStatus).to.be.true
    })

    it('Should draw debt according to multiple', () => {
      expectToBe(
        openStrategy.simulation.position.debt.amount.minus(ONE).toFixed(0),
        'lte',
        new BigNumber(userAccountData.totalDebtETH.toString()),
      )
    })

    describe('Increase Loan-to-Value (Increase risk)', () => {
      let adjustStrategyIncreaseRisk: IStrategy
      const adjustMultipleUp = new BigNumber(3.5)
      let increaseRiskTxStatus: boolean
      let increaseRiskTx: ContractReceipt
      let afterUserAccountData: AAVEAccountData
      let afterUserStEthReserveData: AAVEReserveData
      let actualPositionAfterIncreaseAdjust: IPosition

      before(async () => {
        const addresses = {
          ...mainnetAddresses,
          operationExecutor: system.common.operationExecutor.address,
        }

        const beforeUserAccountData = await aaveLendingPool.getUserAccountData(
          system.common.dsProxy.address,
        )
        const beforeUserStEthReserveData = await aaveDataProvider.getUserReserveData(
          ADDRESSES.main.stETH,
          system.common.dsProxy.address,
        )

        adjustStrategyIncreaseRisk = await strategies.aave.adjustStEth(
          {
            slippage,
            multiple: adjustMultipleUp,
            collectFeeFromSourceToken: true,
          },
          {
            addresses,
            provider,
            position: {
              debt: {
                amount: new BigNumber(beforeUserAccountData.totalDebtETH.toString()),
              },
              collateral: {
                amount: new BigNumber(beforeUserStEthReserveData.currentATokenBalance.toString()),
              },
              category: {
                liquidationThreshold: new BigNumber(0.75),
                maxLoanToValue: new BigNumber(0.73),
                dustLimit: new BigNumber(0),
              },
            },
            getSwapData: oneInchCallMock(new BigNumber(0.979)),
            dsProxy: system.common.dsProxy.address,
          },
        )

        feeRecipientWethBalanceBefore = await balanceOf(
          ADDRESSES.main.WETH,
          ADDRESSES.main.feeRecipient,
          { config, isFormatted: true },
        )

        const [_txStatus, _tx] = await executeThroughProxy(
          system.common.dsProxy.address,
          {
            address: system.common.operationExecutor.address,
            calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
              adjustStrategyIncreaseRisk.calls,
              OPERATION_NAMES.common.CUSTOM_OPERATION,
            ]),
          },
          signer,
        )
        increaseRiskTxStatus = _txStatus
        increaseRiskTx = _tx

        afterUserAccountData = await aaveLendingPool.getUserAccountData(
          system.common.dsProxy.address,
        )

        afterUserStEthReserveData = await aaveDataProvider.getUserReserveData(
          ADDRESSES.main.stETH,
          system.common.dsProxy.address,
        )

        const aavePriceOracle = new ethers.Contract(
          addresses.aavePriceOracle,
          aavePriceOracleABI,
          provider,
        )

        aaveStEthPriceInEth = await aavePriceOracle
          .getAssetPrice(addresses.stETH)
          .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString())))

        actualPositionAfterIncreaseAdjust = new Position(
          { amount: new BigNumber(afterUserAccountData.totalDebtETH.toString()) },
          { amount: new BigNumber(afterUserStEthReserveData.currentATokenBalance.toString()) },
          aaveStEthPriceInEth,
          openStrategy.simulation.position.category,
        )
      })

      it('Increase Position Risk T/x should pass', () => {
        expect(increaseRiskTxStatus).to.be.true
      })

      it('Should draw debt according to multiple', async () => {
        expectToBe(
          adjustStrategyIncreaseRisk.simulation.position.debt.amount.minus(ONE).toFixed(0),
          'lte',
          new BigNumber(afterUserAccountData.totalDebtETH.toString()),
        )
      })

      it('Should collect fee', async () => {
        const feeRecipientWethBalanceAfter = await balanceOf(
          ADDRESSES.main.WETH,
          ADDRESSES.main.feeRecipient,
          { config, isFormatted: true },
        )

        expectToBeEqual(
          new BigNumber(adjustStrategyIncreaseRisk.simulation.swap.sourceTokenFee.toFixed(6)),
          feeRecipientWethBalanceAfter.minus(feeRecipientWethBalanceBefore).toFixed(6),
        )
      })
    })
  })

  describe('On latest block using one inch exchange and api', () => {
    const slippage = new BigNumber(0.1)
    const depositAmount = amountToWei(new BigNumber(60 / 1e15))
    const multiple = new BigNumber(2)
    let aaveStEthPriceInEth: BigNumber

    let system: DeployedSystemInfo

    let openStrategy: IStrategy
    let txStatus: boolean

    let userAccountData: AAVEAccountData
    let userStEthReserveData: AAVEReserveData

    let feeRecipientWethBalanceBefore: BigNumber

    let actualPosition: IPosition

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

        openStrategy = await strategies.aave.openStEth(
          {
            depositAmount,
            slippage,
            multiple,
            collectFeeFromSourceToken: true,
          },
          {
            addresses,
            provider,
            getSwapData: getOneInchCall(system.common.swap.address),
            dsProxy: system.common.dsProxy.address,
          },
        )

        feeRecipientWethBalanceBefore = await balanceOf(
          ADDRESSES.main.WETH,
          ADDRESSES.main.feeRecipient,
          { config, isFormatted: true },
        )

        const [_txStatus] = await executeThroughProxy(
          system.common.dsProxy.address,
          {
            address: system.common.operationExecutor.address,
            calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
              openStrategy.calls,
              OPERATION_NAMES.common.CUSTOM_OPERATION,
            ]),
          },
          signer,
          depositAmount.toFixed(0),
        )
        txStatus = _txStatus

        userAccountData = await aaveLendingPool.getUserAccountData(system.common.dsProxy.address)
        userStEthReserveData = await aaveDataProvider.getUserReserveData(
          ADDRESSES.main.stETH,
          system.common.dsProxy.address,
        )

        const aavePriceOracle = new ethers.Contract(
          addresses.aavePriceOracle,
          aavePriceOracleABI,
          provider,
        )

        aaveStEthPriceInEth = await aavePriceOracle
          .getAssetPrice(addresses.stETH)
          .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString())))

        actualPosition = new Position(
          { amount: new BigNumber(userAccountData.totalDebtETH.toString()) },
          { amount: new BigNumber(userStEthReserveData.currentATokenBalance.toString()) },
          aaveStEthPriceInEth,
          openStrategy.simulation.position.category,
        )
      } else {
        this.skip()
      }
    })

    it('Open Position Tx should pass', () => {
      expect(txStatus).to.be.true
    })

    it('Should draw debt according to multiple', () => {
      expectToBe(
        openStrategy.simulation.position.debt.amount.minus(ONE).toFixed(0),
        'lte',
        new BigNumber(userAccountData.totalDebtETH.toString()),
      )
    })

    describe('Increase Loan-to-Value (Increase risk)', () => {
      let adjustStrategyIncreaseRisk: IStrategy
      const adjustMultipleUp = new BigNumber(3.5)
      let increaseRiskTxStatus: boolean
      let increaseRiskTx: ContractReceipt
      let afterUserAccountData: AAVEAccountData
      let afterUserStEthReserveData: AAVEReserveData
      let actualPositionAfterIncreaseAdjust: IPosition

      before(async () => {
        const addresses = {
          ...mainnetAddresses,
          operationExecutor: system.common.operationExecutor.address,
        }

        const beforeUserAccountData = await aaveLendingPool.getUserAccountData(
          system.common.dsProxy.address,
        )
        const beforeUserStEthReserveData = await aaveDataProvider.getUserReserveData(
          ADDRESSES.main.stETH,
          system.common.dsProxy.address,
        )

        adjustStrategyIncreaseRisk = await strategies.aave.adjustStEth(
          {
            slippage,
            multiple: adjustMultipleUp,
            collectFeeFromSourceToken: true,
          },
          {
            addresses,
            provider,
            position: {
              debt: {
                amount: new BigNumber(beforeUserAccountData.totalDebtETH.toString()),
              },
              collateral: {
                amount: new BigNumber(beforeUserStEthReserveData.currentATokenBalance.toString()),
              },
              category: {
                liquidationThreshold: new BigNumber(0.75),
                maxLoanToValue: new BigNumber(0.73),
                dustLimit: new BigNumber(0),
              },
            },
            getSwapData: getOneInchCall(system.common.swap.address),
            dsProxy: system.common.dsProxy.address,
          },
        )

        feeRecipientWethBalanceBefore = await balanceOf(
          ADDRESSES.main.WETH,
          ADDRESSES.main.feeRecipient,
          { config, isFormatted: true },
        )

        const [_txStatus, _tx] = await executeThroughProxy(
          system.common.dsProxy.address,
          {
            address: system.common.operationExecutor.address,
            calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
              adjustStrategyIncreaseRisk.calls,
              OPERATION_NAMES.common.CUSTOM_OPERATION,
            ]),
          },
          signer,
        )
        increaseRiskTxStatus = _txStatus
        increaseRiskTx = _tx

        afterUserAccountData = await aaveLendingPool.getUserAccountData(
          system.common.dsProxy.address,
        )

        afterUserStEthReserveData = await aaveDataProvider.getUserReserveData(
          ADDRESSES.main.stETH,
          system.common.dsProxy.address,
        )

        actualPositionAfterIncreaseAdjust = new Position(
          { amount: new BigNumber(afterUserAccountData.totalDebtETH.toString()) },
          { amount: new BigNumber(afterUserStEthReserveData.currentATokenBalance.toString()) },
          aaveStEthPriceInEth,
          openStrategy.simulation.position.category,
        )
      })

      it('Increase Position Risk T/x should pass', () => {
        expect(increaseRiskTxStatus).to.be.true
      })

      it('Should draw debt according to multiply', async () => {
        expectToBe(
          adjustStrategyIncreaseRisk.simulation.position.debt.amount.minus(ONE).toFixed(0),
          'lte',
          new BigNumber(afterUserAccountData.totalDebtETH.toString()),
        )
      })

      it('Should collect fee', async () => {
        const feeRecipientWethBalanceAfter = await balanceOf(
          ADDRESSES.main.WETH,
          ADDRESSES.main.feeRecipient,
          { config, isFormatted: true },
        )

        expectToBeEqual(
          new BigNumber(adjustStrategyIncreaseRisk.simulation.swap.sourceTokenFee.toFixed(6)),
          feeRecipientWethBalanceAfter.minus(feeRecipientWethBalanceBefore).toFixed(6),
        )
      })
    })
  })

  describe('On forked chain', () => {
    const depositAmount = amountToWei(new BigNumber(60 / 1e15))
    const multiple = new BigNumber(2)
    const slippage = new BigNumber(0.1)
    let aaveStEthPriceInEth: BigNumber

    let system: DeployedSystemInfo

    let openStrategy: IStrategy

    let txStatus: boolean
    let tx: ContractReceipt

    let userAccountData: AAVEAccountData
    let userStEthReserveData: AAVEReserveData
    let actualPosition: IPosition

    let feeRecipientWethBalanceBefore: BigNumber

    before(async () => {
      ;({ config, provider, signer, address } = await loadFixture(initialiseConfig))
      const testBlockThatWorksWithUSwap = 15695000
      const snapshot = await restoreSnapshot(config, provider, testBlockThatWorksWithUSwap)
      system = snapshot.deployed.system

      const addresses = {
        ...mainnetAddresses,
        operationExecutor: system.common.operationExecutor.address,
      }

      openStrategy = await strategies.aave.openStEth(
        {
          depositAmount,
          slippage,
          multiple,
          collectFeeFromSourceToken: true,
        },
        {
          addresses,
          provider,
          getSwapData: oneInchCallMock(new BigNumber(0.979)),
          dsProxy: system.common.dsProxy.address,
        },
      )

      feeRecipientWethBalanceBefore = await balanceOf(
        ADDRESSES.main.WETH,
        ADDRESSES.main.feeRecipient,
        { config, isFormatted: true },
      )

      const [_txStatus, _tx] = await executeThroughProxy(
        system.common.dsProxy.address,
        {
          address: system.common.operationExecutor.address,
          calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
            openStrategy.calls,
            OPERATION_NAMES.common.CUSTOM_OPERATION,
          ]),
        },
        signer,
        depositAmount.toFixed(0),
      )
      txStatus = _txStatus
      tx = _tx

      userAccountData = await aaveLendingPool.getUserAccountData(system.common.dsProxy.address)
      userStEthReserveData = await aaveDataProvider.getUserReserveData(
        ADDRESSES.main.stETH,
        system.common.dsProxy.address,
      )

      const aavePriceOracle = new ethers.Contract(
        addresses.aavePriceOracle,
        aavePriceOracleABI,
        provider,
      )

      aaveStEthPriceInEth = await aavePriceOracle
        .getAssetPrice(addresses.stETH)
        .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString())))

      actualPosition = new Position(
        { amount: new BigNumber(userAccountData.totalDebtETH.toString()) },
        { amount: new BigNumber(userStEthReserveData.currentATokenBalance.toString()) },
        aaveStEthPriceInEth,
        openStrategy.simulation.position.category,
      )
    })

    it('Open Position Tx should pass', () => {
      expect(txStatus).to.be.true
    })

    it('Should draw debt according to multiple', () => {
      expectToBe(
        openStrategy.simulation.position.debt.amount.minus(ONE).toFixed(0),
        'lte',
        new BigNumber(userAccountData.totalDebtETH.toString()),
      )
    })

    describe('Decrease Loan-to-Value (Reduce risk)', () => {
      let adjustStrategyReduceRisk: IStrategy
      const adjustMultipleDown = new BigNumber(1.5)
      let reduceRiskTxStatus: boolean
      let reduceRiskTx: ContractReceipt

      let afterUserAccountData: AAVEAccountData
      let afterUserStEthReserveData: AAVEReserveData
      let actualPositionAfterDecreasingRisk: IPosition

      before(async () => {
        const addresses = {
          ...mainnetAddresses,
          operationExecutor: system.common.operationExecutor.address,
        }

        const beforeUserAccountData = await aaveLendingPool.getUserAccountData(
          system.common.dsProxy.address,
        )
        const beforeUserStEthReserveData = await aaveDataProvider.getUserReserveData(
          ADDRESSES.main.stETH,
          system.common.dsProxy.address,
        )

        adjustStrategyReduceRisk = await strategies.aave.adjustStEth(
          {
            slippage,
            multiple: adjustMultipleDown,
            collectFeeFromSourceToken: false,
          },
          {
            addresses,
            provider,
            position: {
              debt: {
                amount: new BigNumber(beforeUserAccountData.totalDebtETH.toString()),
              },
              collateral: {
                amount: new BigNumber(beforeUserStEthReserveData.currentATokenBalance.toString()),
              },
              category: {
                liquidationThreshold: new BigNumber(0.75),
                maxLoanToValue: new BigNumber(0.73),
                dustLimit: new BigNumber(0),
              },
            },
            getSwapData: oneInchCallMock(new BigNumber(1 / 0.976)),
            dsProxy: system.common.dsProxy.address,
          },
        )

        feeRecipientWethBalanceBefore = await balanceOf(
          ADDRESSES.main.WETH,
          ADDRESSES.main.feeRecipient,
          { config, isFormatted: true },
        )

        const [_txStatus, _tx] = await executeThroughProxy(
          system.common.dsProxy.address,
          {
            address: system.common.operationExecutor.address,
            calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
              adjustStrategyReduceRisk.calls,
              OPERATION_NAMES.common.CUSTOM_OPERATION,
            ]),
          },
          signer,
        )
        reduceRiskTxStatus = _txStatus
        reduceRiskTx = _tx

        afterUserAccountData = await aaveLendingPool.getUserAccountData(
          system.common.dsProxy.address,
        )

        afterUserStEthReserveData = await aaveDataProvider.getUserReserveData(
          ADDRESSES.main.stETH,
          system.common.dsProxy.address,
        )

        actualPositionAfterDecreasingRisk = new Position(
          { amount: new BigNumber(afterUserAccountData.totalDebtETH.toString()) },
          { amount: new BigNumber(afterUserStEthReserveData.currentATokenBalance.toString()) },
          aaveStEthPriceInEth,
          openStrategy.simulation.position.category,
        )
      })

      it('Reduce Position Risk T/x should pass', () => {
        expect(reduceRiskTxStatus).to.be.true
      })

      it('Should reduce collateral according to multiple', () => {
        expectToBe(
          adjustStrategyReduceRisk.simulation.position.collateral.amount.minus(ONE).toFixed(0),
          'lte',
          new BigNumber(afterUserStEthReserveData.currentATokenBalance.toString()),
        )
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

      it('Should collect fee', async () => {
        const feeRecipientWethBalanceAfter = await balanceOf(
          ADDRESSES.main.WETH,
          ADDRESSES.main.feeRecipient,
          { config, isFormatted: true },
        )

        expectToBeEqual(
          new BigNumber(adjustStrategyReduceRisk.simulation.swap.targetTokenFee.toFixed(6)),
          feeRecipientWethBalanceAfter.minus(feeRecipientWethBalanceBefore).toFixed(6),
        )
      })
    })
  })

  describe('On latest block using one inch exchange and api', () => {
    const slippage = new BigNumber(0.1)
    const depositAmount = amountToWei(new BigNumber(60 / 1e15))
    const multiple = new BigNumber(2)
    let aaveStEthPriceInEth: BigNumber

    let system: DeployedSystemInfo

    let openStrategy: IStrategy
    let txStatus: boolean

    let userAccountData: AAVEAccountData
    let userStEthReserveData: AAVEReserveData

    let feeRecipientWethBalanceBefore: BigNumber

    let actualPosition: IPosition

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

        openStrategy = await strategies.aave.openStEth(
          {
            depositAmount,
            slippage,
            multiple,
            collectFeeFromSourceToken: true,
          },
          {
            addresses,
            provider,
            getSwapData: getOneInchCall(system.common.swap.address),
            dsProxy: system.common.dsProxy.address,
          },
        )

        feeRecipientWethBalanceBefore = await balanceOf(
          ADDRESSES.main.WETH,
          ADDRESSES.main.feeRecipient,
          { config, isFormatted: true },
        )

        const [_txStatus] = await executeThroughProxy(
          system.common.dsProxy.address,
          {
            address: system.common.operationExecutor.address,
            calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
              openStrategy.calls,
              OPERATION_NAMES.common.CUSTOM_OPERATION,
            ]),
          },
          signer,
          depositAmount.toFixed(0),
        )
        txStatus = _txStatus

        userAccountData = await aaveLendingPool.getUserAccountData(system.common.dsProxy.address)
        userStEthReserveData = await aaveDataProvider.getUserReserveData(
          ADDRESSES.main.stETH,
          system.common.dsProxy.address,
        )

        const aavePriceOracle = new ethers.Contract(
          addresses.aavePriceOracle,
          aavePriceOracleABI,
          provider,
        )

        aaveStEthPriceInEth = await aavePriceOracle
          .getAssetPrice(addresses.stETH)
          .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString())))

        actualPosition = new Position(
          { amount: new BigNumber(userAccountData.totalDebtETH.toString()) },
          { amount: new BigNumber(userStEthReserveData.currentATokenBalance.toString()) },
          aaveStEthPriceInEth,
          openStrategy.simulation.position.category,
        )
      } else {
        this.skip()
      }
    })

    it('Open Position Tx should pass', () => {
      expect(txStatus).to.be.true
    })

    it('Should draw debt according to multiple', () => {
      expectToBe(
        openStrategy.simulation.position.debt.amount.minus(ONE).toFixed(0),
        'lte',
        new BigNumber(userAccountData.totalDebtETH.toString()),
      )
    })

    describe('Decrease Loan-to-Value (Decrease risk)', () => {
      let adjustStrategyReduceRisk: IStrategy
      const adjustMultipleDown = new BigNumber(1.5)
      let reduceRiskTxStatus: boolean
      let reduceRiskTx: ContractReceipt

      let afterUserAccountData: AAVEAccountData
      let afterUserStEthReserveData: AAVEReserveData
      let actualPositionAfterDecreasingRisk: IPosition

      before(async () => {
        const addresses = {
          ...mainnetAddresses,
          operationExecutor: system.common.operationExecutor.address,
        }

        const beforeUserAccountData = await aaveLendingPool.getUserAccountData(
          system.common.dsProxy.address,
        )
        const beforeUserStEthReserveData = await aaveDataProvider.getUserReserveData(
          ADDRESSES.main.stETH,
          system.common.dsProxy.address,
        )

        adjustStrategyReduceRisk = await strategies.aave.adjustStEth(
          {
            slippage,
            multiple: adjustMultipleDown,
            collectFeeFromSourceToken: false,
          },
          {
            addresses,
            provider,
            position: {
              debt: {
                amount: new BigNumber(beforeUserAccountData.totalDebtETH.toString()),
              },
              collateral: {
                amount: new BigNumber(beforeUserStEthReserveData.currentATokenBalance.toString()),
              },
              category: {
                liquidationThreshold: new BigNumber(0.75),
                maxLoanToValue: new BigNumber(0.73),
                dustLimit: new BigNumber(0),
              },
            },
            getSwapData: getOneInchCall(system.common.swap.address),
            dsProxy: system.common.dsProxy.address,
          },
        )

        feeRecipientWethBalanceBefore = await balanceOf(
          ADDRESSES.main.WETH,
          ADDRESSES.main.feeRecipient,
          { config, isFormatted: true },
        )

        const [_txStatus, _tx] = await executeThroughProxy(
          system.common.dsProxy.address,
          {
            address: system.common.operationExecutor.address,
            calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
              adjustStrategyReduceRisk.calls,
              OPERATION_NAMES.common.CUSTOM_OPERATION,
            ]),
          },
          signer,
        )
        reduceRiskTxStatus = _txStatus
        reduceRiskTx = _tx

        afterUserAccountData = await aaveLendingPool.getUserAccountData(
          system.common.dsProxy.address,
        )

        afterUserStEthReserveData = await aaveDataProvider.getUserReserveData(
          ADDRESSES.main.stETH,
          system.common.dsProxy.address,
        )

        actualPositionAfterDecreasingRisk = new Position(
          { amount: new BigNumber(afterUserAccountData.totalDebtETH.toString()) },
          { amount: new BigNumber(afterUserStEthReserveData.currentATokenBalance.toString()) },
          aaveStEthPriceInEth,
          openStrategy.simulation.position.category,
        )
      })

      it('Reduce Position Risk T/x should pass', () => {
        expect(reduceRiskTxStatus).to.be.true
      })

      it('Should reduce collateral according to multiple', () => {
        expectToBe(
          adjustStrategyReduceRisk.simulation.position.collateral.amount.minus(ONE).toFixed(0),
          'lte',
          new BigNumber(afterUserStEthReserveData.currentATokenBalance.toString()),
        )
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

      it('Should collect fee', async () => {
        const feeRecipientWethBalanceAfter = await balanceOf(
          ADDRESSES.main.WETH,
          ADDRESSES.main.feeRecipient,
          { config, isFormatted: true },
        )

        expectToBeEqual(
          new BigNumber(adjustStrategyReduceRisk.simulation.swap.targetTokenFee.toFixed(6)),
          feeRecipientWethBalanceAfter.minus(feeRecipientWethBalanceBefore).toFixed(6),
        )
      })
    })
  })
})
