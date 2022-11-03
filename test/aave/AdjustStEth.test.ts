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
import { PositionBalance } from '@oasisdex/oasis-actions/lib/src/helpers/calculations/Position'
import { IPositionMutation } from '@oasisdex/oasis-actions/src'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { loadFixture } from 'ethereum-waffle'
import { Contract, ethers, Signer } from 'ethers'

import AAVEDataProviderABI from '../../abi/aaveDataProvider.json'
import AAVELendigPoolABI from '../../abi/aaveLendingPool.json'
import { AAVEAccountData, AAVEReserveData } from '../../helpers/aave'
import { executeThroughProxy } from '../../helpers/deploy'
import init, { impersonateRichAccount, resetNodeToLatestBlock } from '../../helpers/init'
import { restoreSnapshot } from '../../helpers/restoreSnapshot'
import { getOneInchCall } from '../../helpers/swap/OneIchCall'
import { oneInchCallMock } from '../../helpers/swap/OneInchCallMock'
import { RuntimeConfig } from '../../helpers/types/common'
import { amountToWei, balanceOf } from '../../helpers/utils'
import { mainnetAddresses } from '../addresses'
import { testBlockNumber } from '../config'
import { tokens } from '../constants'
import { DeployedSystemInfo, deploySystem } from '../deploySystem'
import { initialiseConfig } from '../fixtures/setup'
import { expectToBe, expectToBeEqual } from '../utils'

describe(`Strategy | AAVE | Adjust Position`, async () => {
  let aaveLendingPool: Contract
  let aaveDataProvider: Contract
  let provider: JsonRpcProvider
  let config: RuntimeConfig
  let signer: Signer

  before(async () => {
    config = await init()
    provider = config.provider
    signer = config.signer

    aaveLendingPool = new Contract(
      ADDRESSES.main.aave.MainnetLendingPool,
      AAVELendigPoolABI,
      provider,
    )

    aaveDataProvider = new Contract(ADDRESSES.main.aave.DataProvider, AAVEDataProviderABI, provider)
  })

  describe('On forked chain', () => {
    const depositAmount = amountToWei(new BigNumber(60 / 1e12))
    const multiple = new BigNumber(2)
    const slippage = new BigNumber(0.1)

    let aaveStEthPriceInEth: BigNumber
    let system: DeployedSystemInfo

    let openPositionMutation: IPositionMutation

    let txStatus: boolean

    let userAccountData: AAVEAccountData
    let userStEthReserveData: AAVEReserveData
    let actualPosition: IPosition

    let feeRecipientWethBalanceBefore: BigNumber

    before(async () => {
      ;({ config, provider, signer } = await loadFixture(initialiseConfig))

      const { snapshot } = await restoreSnapshot(config, provider, testBlockNumber)
      system = snapshot.deployed.system

      const addresses = {
        ...mainnetAddresses,
        operationExecutor: system.common.operationExecutor.address,
      }

      openPositionMutation = await strategies.aave.open(
        {
          depositedByUser: {
            debtInWei: depositAmount,
          },
          slippage,
          multiple,
          debtToken: { symbol: tokens.ETH },
          collateralToken: { symbol: tokens.STETH },
        },
        {
          addresses,
          provider,
          getSwapData: oneInchCallMock(new BigNumber(0.979)),
          proxy: system.common.dsProxy.address,
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
            openPositionMutation.transaction.calls,
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

      actualPosition = new Position(
        {
          amount: new BigNumber(userAccountData.totalDebtETH.toString()),
          symbol: tokens.ETH,
        },
        {
          amount: new BigNumber(userStEthReserveData.currentATokenBalance.toString()),
          symbol: tokens.STETH,
        },
        aaveStEthPriceInEth,
        openPositionMutation.simulation.position.category,
      )
    })

    it('Open Position Tx should pass', () => {
      expect(txStatus).to.be.true
    })

    it('Should draw debt according to multiple', () => {
      expect(actualPosition.debt.amount.toString()).to.be.oneOf([
        openPositionMutation.simulation.position.debt.amount.toString(),
        openPositionMutation.simulation.position.debt.amount.plus(ONE).toString(),
      ])
    })

    describe('Increase Loan-to-Value (Increase risk)', () => {
      let adjustPositionUpMutation: IPositionMutation
      const adjustMultipleUp = new BigNumber(3.5)
      let increaseRiskTxStatus: boolean
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

        adjustPositionUpMutation = await strategies.aave.adjust(
          {
            slippage,
            multiple: adjustMultipleUp,
            debtToken: { symbol: tokens.ETH },
            collateralToken: { symbol: tokens.STETH },
          },
          {
            addresses,
            provider,
            position: {
              debt: new PositionBalance({
                symbol: tokens.ETH,
                amount: new BigNumber(beforeUserAccountData.totalDebtETH.toString()),
              }),
              collateral: new PositionBalance({
                symbol: tokens.STETH,
                amount: new BigNumber(beforeUserStEthReserveData.currentATokenBalance.toString()),
              }),
              category: {
                liquidationThreshold: new BigNumber(0.75),
                maxLoanToValue: new BigNumber(0.73),
                dustLimit: new BigNumber(0),
              },
            },
            getSwapData: oneInchCallMock(new BigNumber(0.979)),
            proxy: system.common.dsProxy.address,
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
              adjustPositionUpMutation.transaction.calls,
              OPERATION_NAMES.common.CUSTOM_OPERATION,
            ]),
          },
          signer,
        )
        increaseRiskTxStatus = _txStatus

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
          {
            amount: new BigNumber(afterUserAccountData.totalDebtETH.toString()),
            symbol: tokens.ETH,
          },
          {
            amount: new BigNumber(afterUserStEthReserveData.currentATokenBalance.toString()),
            symbol: tokens.STETH,
          },
          aaveStEthPriceInEth,
          openPositionMutation.simulation.position.category,
        )
      })

      it('Increase Position Risk T/x should pass', () => {
        expect(increaseRiskTxStatus).to.be.true
      })

      it('Should draw debt according to multiple', async () => {
        expect(actualPositionAfterIncreaseAdjust.debt.amount.toString()).to.be.oneOf([
          adjustPositionUpMutation.simulation.position.debt.amount.minus(ONE).toString(),
          adjustPositionUpMutation.simulation.position.debt.amount.toString(),
        ])
      })

      it('Should collect fee', async () => {
        const feeRecipientWethBalanceAfter = await balanceOf(
          ADDRESSES.main.WETH,
          ADDRESSES.main.feeRecipient,
          { config, isFormatted: true },
        )

        expectToBeEqual(
          new BigNumber(adjustPositionUpMutation.simulation.swap.sourceTokenFee.toFixed(6)),
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

    let openPositionMutation: IPositionMutation
    let txStatus: boolean

    let userAccountData: AAVEAccountData
    let userStEthReserveData: AAVEReserveData

    let feeRecipientWethBalanceBefore: BigNumber

    let actualPosition: IPosition

    before(async function () {
      const shouldRun1InchTests = process.env.RUN_1INCH_TESTS === '1'
      if (shouldRun1InchTests) {
        await resetNodeToLatestBlock(provider)
        const { signer } = await impersonateRichAccount(provider)
        const { system: _system } = await deploySystem(config, false, false)
        system = _system

        const addresses = {
          ...mainnetAddresses,
          operationExecutor: system.common.operationExecutor.address,
        }

        openPositionMutation = await strategies.aave.open(
          {
            depositedByUser: {
              debtInWei: depositAmount,
            },
            slippage,
            multiple,
            debtToken: { symbol: tokens.ETH },
            collateralToken: { symbol: tokens.STETH },
          },
          {
            addresses,
            provider,
            getSwapData: getOneInchCall(system.common.swap.address),
            proxy: system.common.dsProxy.address,
          },
        )

        feeRecipientWethBalanceBefore = await balanceOf(
          ADDRESSES.main.WETH,
          ADDRESSES.main.feeRecipient,
          { config, isFormatted: true },
        )

        userAccountData = await aaveLendingPool.getUserAccountData(system.common.dsProxy.address)

        const [_txStatus] = await executeThroughProxy(
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
          new PositionBalance({
            amount: new BigNumber(userAccountData.totalDebtETH.toString()),
            symbol: tokens.ETH,
          }),
          new PositionBalance({
            amount: new BigNumber(userStEthReserveData.currentATokenBalance.toString()),
            symbol: tokens.STETH,
          }),
          aaveStEthPriceInEth,
          openPositionMutation.simulation.position.category,
        )
      } else {
        this.skip()
      }
    })

    it('Open Position Tx should pass', () => {
      expect(txStatus).to.be.true
    })

    it('Should draw debt according to multiple', () => {
      expect(new BigNumber(actualPosition.debt.amount.toString()).toString()).to.be.oneOf([
        openPositionMutation.simulation.position.debt.amount.toString(),
        openPositionMutation.simulation.position.debt.amount.minus(ONE).toString(),
      ])
    })

    describe('Increase Loan-to-Value (Increase risk)', () => {
      let adjustPositionUpMutation: IPositionMutation
      const adjustMultipleUp = new BigNumber(3.5)
      let increaseRiskTxStatus: boolean
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

        adjustPositionUpMutation = await strategies.aave.adjust(
          {
            slippage,
            multiple: adjustMultipleUp,
            debtToken: { symbol: tokens.ETH },
            collateralToken: { symbol: tokens.STETH },
          },
          {
            addresses,
            provider,
            position: {
              debt: new PositionBalance({
                symbol: tokens.ETH,
                amount: new BigNumber(beforeUserAccountData.totalDebtETH.toString()),
              }),
              collateral: new PositionBalance({
                symbol: tokens.STETH,
                amount: new BigNumber(beforeUserStEthReserveData.currentATokenBalance.toString()),
              }),
              category: {
                liquidationThreshold: new BigNumber(0.75),
                maxLoanToValue: new BigNumber(0.73),
                dustLimit: new BigNumber(0),
              },
            },
            getSwapData: getOneInchCall(system.common.swap.address),
            proxy: system.common.dsProxy.address,
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
              adjustPositionUpMutation.transaction.calls,
              OPERATION_NAMES.common.CUSTOM_OPERATION,
            ]),
          },
          signer,
        )
        increaseRiskTxStatus = _txStatus

        afterUserAccountData = await aaveLendingPool.getUserAccountData(
          system.common.dsProxy.address,
        )

        afterUserStEthReserveData = await aaveDataProvider.getUserReserveData(
          ADDRESSES.main.stETH,
          system.common.dsProxy.address,
        )

        actualPositionAfterIncreaseAdjust = new Position(
          {
            amount: new BigNumber(afterUserAccountData.totalDebtETH.toString()),
            symbol: tokens.ETH,
          },
          {
            amount: new BigNumber(afterUserStEthReserveData.currentATokenBalance.toString()),
            symbol: tokens.STETH,
          },
          aaveStEthPriceInEth,
          openPositionMutation.simulation.position.category,
        )
      })

      it('Increase Position Risk T/x should pass', () => {
        expect(increaseRiskTxStatus).to.be.true
      })

      it('Should draw debt according to multiply', async () => {
        expect(
          new BigNumber(actualPositionAfterIncreaseAdjust.debt.amount.toString()).toString(),
        ).to.be.oneOf([
          adjustPositionUpMutation.simulation.position.debt.amount.toString(),
          adjustPositionUpMutation.simulation.position.debt.amount.minus(ONE).toString(),
        ])
      })

      it('Should collect fee', async () => {
        const feeRecipientWethBalanceAfter = await balanceOf(
          ADDRESSES.main.WETH,
          ADDRESSES.main.feeRecipient,
          { config, isFormatted: true },
        )

        expectToBeEqual(
          new BigNumber(adjustPositionUpMutation.simulation.swap.sourceTokenFee.toFixed(6)),
          feeRecipientWethBalanceAfter.minus(feeRecipientWethBalanceBefore).toFixed(6),
        )
      })
    })
  })

  describe('On forked chain', () => {
    const depositAmount = amountToWei(new BigNumber(60 / 1e15))
    const multiple = new BigNumber(2)
    const slippage = new BigNumber(0.1)

    let system: DeployedSystemInfo

    let openPositionMutation: IPositionMutation

    let txStatus: boolean

    let userAccountData: AAVEAccountData

    let feeRecipientWethBalanceBefore: BigNumber

    before(async () => {
      ;({ config, provider, signer } = await loadFixture(initialiseConfig))
      const { snapshot, config: newConfig } = await restoreSnapshot(
        config,
        provider,
        testBlockNumber,
      )
      config = newConfig
      system = snapshot.deployed.system

      const addresses = {
        ...mainnetAddresses,
        operationExecutor: system.common.operationExecutor.address,
      }

      openPositionMutation = await strategies.aave.open(
        {
          depositedByUser: {
            debtInWei: depositAmount,
          },
          slippage,
          multiple,
          debtToken: { symbol: tokens.ETH },
          collateralToken: { symbol: tokens.STETH },
        },
        {
          addresses,
          provider,
          getSwapData: oneInchCallMock(new BigNumber(0.979)),
          proxy: system.common.dsProxy.address,
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
            openPositionMutation.transaction.calls,
            OPERATION_NAMES.common.CUSTOM_OPERATION,
          ]),
        },
        signer,
        depositAmount.toFixed(0),
      )
      txStatus = _txStatus

      userAccountData = await aaveLendingPool.getUserAccountData(system.common.dsProxy.address)
    })

    it('Open Position Tx should pass', () => {
      expect(txStatus).to.be.true
    })

    it('Should draw debt according to multiple', () => {
      expectToBe(
        openPositionMutation.simulation.position.debt.amount.minus(ONE).toFixed(0),
        'lte',
        new BigNumber(userAccountData.totalDebtETH.toString()),
      )
    })

    describe('Decrease Loan-to-Value (Reduce risk)', () => {
      let adjustPositionDownMutation: IPositionMutation
      const adjustMultipleDown = new BigNumber(1.5)
      let reduceRiskTxStatus: boolean

      let afterUserStEthReserveData: AAVEReserveData

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

        adjustPositionDownMutation = await strategies.aave.adjust(
          {
            slippage,
            multiple: adjustMultipleDown,
            debtToken: { symbol: tokens.ETH },
            collateralToken: { symbol: tokens.STETH },
          },
          {
            addresses,
            provider,
            position: {
              debt: {
                symbol: tokens.ETH,
                precision: TYPICAL_PRECISION,
                amount: new BigNumber(beforeUserAccountData.totalDebtETH.toString()),
              },
              collateral: {
                symbol: tokens.STETH,
                precision: TYPICAL_PRECISION,
                amount: new BigNumber(beforeUserStEthReserveData.currentATokenBalance.toString()),
              },
              category: {
                liquidationThreshold: new BigNumber(0.75),
                maxLoanToValue: new BigNumber(0.73),
                dustLimit: new BigNumber(0),
              },
            },
            getSwapData: oneInchCallMock(new BigNumber(1 / 0.976)),
            proxy: system.common.dsProxy.address,
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
              adjustPositionDownMutation.transaction.calls,
              OPERATION_NAMES.common.CUSTOM_OPERATION,
            ]),
          },
          signer,
        )
        reduceRiskTxStatus = _txStatus

        afterUserStEthReserveData = await aaveDataProvider.getUserReserveData(
          ADDRESSES.main.stETH,
          system.common.dsProxy.address,
        )
      })

      it('Reduce Position Risk T/x should pass', () => {
        expect(reduceRiskTxStatus).to.be.true
      })

      it('Should reduce collateral according to multiple', () => {
        expect(
          new BigNumber(afterUserStEthReserveData.currentATokenBalance.toString()).toString(),
        ).to.be.oneOf([
          adjustPositionDownMutation.simulation.position.collateral.amount.toFixed(0),
          adjustPositionDownMutation.simulation.position.collateral.amount.minus(ONE).toFixed(0),
        ])
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
          new BigNumber(adjustPositionDownMutation.simulation.swap.targetTokenFee.toFixed(6)),
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

    let openPositionMutation: IPositionMutation
    let txStatus: boolean

    let userAccountData: AAVEAccountData

    let feeRecipientWethBalanceBefore: BigNumber

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

        openPositionMutation = await strategies.aave.open(
          {
            depositedByUser: {
              debtInWei: depositAmount,
            },
            slippage,
            multiple,
            debtToken: { symbol: tokens.ETH },
            collateralToken: { symbol: tokens.STETH },
          },
          {
            addresses,
            provider,
            getSwapData: getOneInchCall(system.common.swap.address),
            proxy: system.common.dsProxy.address,
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
              openPositionMutation.transaction.calls,
              OPERATION_NAMES.common.CUSTOM_OPERATION,
            ]),
          },
          signer,
          depositAmount.toFixed(0),
        )
        txStatus = _txStatus

        userAccountData = await aaveLendingPool.getUserAccountData(system.common.dsProxy.address)
      } else {
        this.skip()
      }
    })

    it('Open Position Tx should pass', () => {
      expect(txStatus).to.be.true
    })

    it('Should draw debt according to multiple', () => {
      expectToBe(
        openPositionMutation.simulation.position.debt.amount.minus(ONE).toFixed(0),
        'lte',
        new BigNumber(userAccountData.totalDebtETH.toString()),
      )
    })

    describe('Decrease Loan-to-Value (Decrease risk)', () => {
      let adjustPositionDownMutation: IPositionMutation
      const adjustMultipleDown = new BigNumber(1.5)
      let reduceRiskTxStatus: boolean

      let afterReduceUserAccountData: AAVEAccountData
      let afterReduceUserStEthReserveData: AAVEReserveData
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

        adjustPositionDownMutation = await strategies.aave.adjust(
          {
            slippage,
            multiple: adjustMultipleDown,
            debtToken: { symbol: tokens.ETH },
            collateralToken: { symbol: tokens.STETH },
          },
          {
            addresses,
            provider,
            position: {
              debt: new PositionBalance({
                symbol: tokens.ETH,
                amount: new BigNumber(beforeUserAccountData.totalDebtETH.toString()),
              }),
              collateral: new PositionBalance({
                symbol: tokens.STETH,
                amount: new BigNumber(beforeUserStEthReserveData.currentATokenBalance.toString()),
              }),
              category: {
                liquidationThreshold: new BigNumber(0.75),
                maxLoanToValue: new BigNumber(0.73),
                dustLimit: new BigNumber(0),
              },
            },
            getSwapData: getOneInchCall(system.common.swap.address),
            proxy: system.common.dsProxy.address,
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
              adjustPositionDownMutation.transaction.calls,
              OPERATION_NAMES.common.CUSTOM_OPERATION,
            ]),
          },
          signer,
        )
        reduceRiskTxStatus = _txStatus

        afterReduceUserAccountData = await aaveLendingPool.getUserAccountData(
          system.common.dsProxy.address,
        )

        afterReduceUserStEthReserveData = await aaveDataProvider.getUserReserveData(
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

        actualPositionAfterDecreasingRisk = new Position(
          new PositionBalance({
            amount: new BigNumber(afterReduceUserAccountData.totalDebtETH.toString()),
            symbol: tokens.ETH,
          }),
          new PositionBalance({
            amount: new BigNumber(afterReduceUserStEthReserveData.currentATokenBalance.toString()),
            symbol: tokens.STETH,
          }),
          aaveStEthPriceInEth,
          openPositionMutation.simulation.position.category,
        )
      })

      it('Reduce Position Risk T/x should pass', () => {
        expect(reduceRiskTxStatus).to.be.true
      })

      it('Should reduce collateral according to multiple', () => {
        expect(actualPositionAfterDecreasingRisk.collateral.amount.toString()).to.be.oneOf([
          adjustPositionDownMutation.simulation.position.collateral.amount.toFixed(0),
          adjustPositionDownMutation.simulation.position.collateral.amount.minus(ONE).toFixed(0),
        ])
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
          new BigNumber(adjustPositionDownMutation.simulation.swap.targetTokenFee.toFixed(6)),
          feeRecipientWethBalanceAfter.minus(feeRecipientWethBalanceBefore).toFixed(6),
        )
      })
    })
  })
})
