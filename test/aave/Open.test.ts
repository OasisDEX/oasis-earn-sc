import { JsonRpcProvider } from '@ethersproject/providers'
import {
  ADDRESSES,
  IPosition,
  OPERATION_NAMES,
  Position,
  strategies,
} from '@oasisdex/oasis-actions'
import aavePriceOracleABI from '@oasisdex/oasis-actions/lib/src/abi/aavePriceOracle.json'
import { amountFromWei } from '@oasisdex/oasis-actions/lib/src/helpers'
import { IPositionMutation, ONE } from '@oasisdex/oasis-actions/src'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { loadFixture } from 'ethereum-waffle'
import { Contract, ethers, Signer } from 'ethers'

import AAVEDataProviderABI from '../../abi/aaveDataProvider.json'
import AAVELendigPoolABI from '../../abi/aaveLendingPool.json'
import { AAVEAccountData, AAVEReserveData } from '../../helpers/aave'
import { executeThroughProxy } from '../../helpers/deploy'
import { resetNodeToLatestBlock } from '../../helpers/init'
import { restoreSnapshot } from '../../helpers/restoreSnapshot'
import { getOneInchCall } from '../../helpers/swap/OneIchCall'
import { oneInchCallMock } from '../../helpers/swap/OneInchCallMock'
import { RuntimeConfig } from '../../helpers/types/common'
import { amountToWei, balanceOf } from '../../helpers/utils'
import { testBlockNumber } from '../config'
import { DeployedSystemInfo, deploySystem } from '../deploySystem'
import { initialiseConfig } from '../fixtures/setup'
import { expectToBe, expectToBeEqual, MULTIPLE_TESTING_OFFSET } from '../utils'

const tokens = {
  ETH: 'ETH',
  WBTC: 'WBTC',
  STETH: 'STETH',
  USDC: 'USDC',
} as const

describe(`Strategy | AAVE | Open Position`, async () => {
  let aaveLendingPool: Contract
  let aaveDataProvider: Contract
  let provider: JsonRpcProvider
  let config: RuntimeConfig
  let signer: Signer

  const mainnetAddresses = {
    DAI: ADDRESSES.main.DAI,
    ETH: ADDRESSES.main.ETH,
    WETH: ADDRESSES.main.WETH,
    stETH: ADDRESSES.main.stETH,
    wBTC: ADDRESSES.main.WBTC,
    USDC: ADDRESSES.main.USDC,
    chainlinkEthUsdPriceFeed: ADDRESSES.main.chainlinkEthUsdPriceFeed,
    aaveProtocolDataProvider: ADDRESSES.main.aave.DataProvider,
    aavePriceOracle: ADDRESSES.main.aavePriceOracle,
    aaveLendingPool: ADDRESSES.main.aave.MainnetLendingPool,
  }

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
    let aaveCollateralTokenPriceInEth: BigNumber
    let aaveDebtTokenPriceInEth: BigNumber

    let system: DeployedSystemInfo

    let positionMutation: IPositionMutation
    let txStatus: boolean

    let userAccountData: AAVEAccountData
    let userReserveData: AAVEReserveData
    let actualPosition: IPosition

    let feeRecipientWethBalanceBefore: BigNumber

    describe.skip(`With ${tokens.STETH} collateral & ${tokens.ETH} debt`, () => {
      const depositEthAmount = amountToWei(new BigNumber(60 / 1e15))
      before(async () => {
        const snapshot = await restoreSnapshot(config, provider, testBlockNumber)
        system = snapshot.deployed.system

        const addresses = {
          ...mainnetAddresses,
          operationExecutor: system.common.operationExecutor.address,
        }

        positionMutation = await strategies.aave.open(
          {
            depositedByUser: { debtInWei: depositEthAmount },
            slippage,
            multiple,
            debtToken: { symbol: tokens.ETH },
            collateralToken: { symbol: tokens.STETH },
          },
          {
            addresses,
            provider,
            getSwapData: oneInchCallMock(new BigNumber(0.9759)),
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
              positionMutation.transaction.calls,
              OPERATION_NAMES.common.CUSTOM_OPERATION,
            ]),
          },
          signer,
          depositEthAmount.toFixed(0),
        )
        txStatus = _txStatus

        userAccountData = await aaveLendingPool.getUserAccountData(system.common.dsProxy.address)
        userReserveData = await aaveDataProvider.getUserReserveData(
          ADDRESSES.main.stETH,
          system.common.dsProxy.address,
        )

        const aavePriceOracle = new ethers.Contract(
          addresses.aavePriceOracle,
          aavePriceOracleABI,
          provider,
        )

        aaveCollateralTokenPriceInEth = await aavePriceOracle
          .getAssetPrice(addresses.stETH)
          .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString())))

        actualPosition = new Position(
          { amount: new BigNumber(userAccountData.totalDebtETH.toString()), symbol: tokens.ETH },
          {
            amount: new BigNumber(userReserveData.currentATokenBalance.toString()),
            symbol: tokens.STETH,
          },
          aaveCollateralTokenPriceInEth,
          positionMutation.simulation.position.category,
        )
      })

      it('Tx should pass', () => {
        expect(txStatus).to.be.true
      })

      it('Should draw debt according to multiple', () => {
        expectToBeEqual(
          positionMutation.simulation.position.debt.amount.toFixed(0),
          new BigNumber(userAccountData.totalDebtETH.toString()),
        )
      })

      it(`Should deposit all ${tokens.STETH} tokens to aave`, () => {
        expectToBe(
          positionMutation.simulation.swap.minToTokenAmount,
          'lte',
          new BigNumber(userReserveData.currentATokenBalance.toString()),
        )
      })

      it('Should achieve target multiple', () => {
        expectToBe(
          positionMutation.simulation.position.riskRatio.multiple,
          'gte',
          actualPosition.riskRatio.multiple,
        )
      })

      it('Should collect fee', async () => {
        const feeRecipientWethBalanceAfter = await balanceOf(
          ADDRESSES.main.WETH,
          ADDRESSES.main.feeRecipient,
          { config, isFormatted: true },
        )

        expectToBeEqual(
          new BigNumber(positionMutation.simulation.swap.sourceTokenFee),
          feeRecipientWethBalanceAfter.minus(feeRecipientWethBalanceBefore),
        )
      })
    })

    describe(`With ${tokens.ETH} collateral & ${tokens.USDC} debt`, () => {
      const depositEthAmount = new BigNumber(600)
      const precisionAdjustmentUSDC = new BigNumber(1e12)

      let userEthReserveData: AAVEReserveData
      let userUSDCReserveData: AAVEReserveData

      let feeRecipientUSDCBalanceBefore: BigNumber

      before(async () => {
        const snapshot = await restoreSnapshot(config, provider, testBlockNumber)
        system = snapshot.deployed.system

        const addresses = {
          ...mainnetAddresses,
          operationExecutor: system.common.operationExecutor.address,
        }

        console.log('config.address', config.address)
        console.log('system.common.dsProxy.address', system.common.dsProxy.address)
        positionMutation = await strategies.aave.open(
          {
            depositedByUser: {
              collateralInWei: amountToWei(depositEthAmount),
            },
            slippage,
            multiple,
            debtToken: { symbol: tokens.USDC, precision: 6 },
            collateralToken: { symbol: tokens.ETH },
          },
          {
            addresses,
            provider,
            getSwapData: oneInchCallMock(new BigNumber(1300)),
            proxy: system.common.dsProxy.address,
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
              positionMutation.transaction.calls,
              OPERATION_NAMES.common.CUSTOM_OPERATION,
            ]),
          },
          signer,
          amountToWei(depositEthAmount).toFixed(0),
        )
        txStatus = _txStatus

        userAccountData = await aaveLendingPool.getUserAccountData(system.common.dsProxy.address)
        console.log('here')
        userEthReserveData = await aaveDataProvider.getUserReserveData(
          ADDRESSES.main.WETH,
          system.common.dsProxy.address,
        )

        console.log('ADDRESSES.main.USDC', ADDRESSES.main.USDC)
        userUSDCReserveData = await aaveDataProvider.getUserReserveData(
          ADDRESSES.main.USDC,
          system.common.dsProxy.address,
        )

        const aavePriceOracle = new ethers.Contract(
          addresses.aavePriceOracle,
          aavePriceOracleABI,
          provider,
        )

        aaveCollateralTokenPriceInEth = await aavePriceOracle
          .getAssetPrice(addresses.WETH)
          .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString())))

        aaveDebtTokenPriceInEth = await aavePriceOracle
          .getAssetPrice(addresses.USDC)
          .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString())))

        const oracle = aaveCollateralTokenPriceInEth.div(aaveDebtTokenPriceInEth)
        actualPosition = new Position(
          {
            amount: new BigNumber(userUSDCReserveData.currentVariableDebt.toString()).times(
              precisionAdjustmentUSDC,
            ),
            symbol: tokens.USDC,
          },
          {
            amount: new BigNumber(userEthReserveData.currentATokenBalance.toString()),
            symbol: tokens.ETH,
          },
          oracle,
          positionMutation.simulation.position.category,
        )
      })

      it('Tx should pass', () => {
        expect(txStatus).to.be.true
      })

      it('Should draw debt according to multiple', () => {
        expectToBeEqual(
          positionMutation.simulation.position.debt.amount.div(precisionAdjustmentUSDC).toFixed(0),
          new BigNumber(userUSDCReserveData.currentVariableDebt.toString()).toFixed(0),
        )
      })

      it(`Should deposit all ${tokens.ETH} tokens to aave`, () => {
        expectToBe(
          positionMutation.simulation.position.collateral.amount,
          'lte',
          new BigNumber(userEthReserveData.currentATokenBalance.toString()).toFixed(0),
        )
      })

      it('Should achieve target multiple', () => {
        expectToBe(
          positionMutation.simulation.position.riskRatio.multiple.times(
            ONE.minus(MULTIPLE_TESTING_OFFSET),
          ),
          'lte',
          actualPosition.riskRatio.multiple,
        )

        expectToBe(
          positionMutation.simulation.position.riskRatio.multiple,
          'gte',
          actualPosition.riskRatio.multiple,
        )
      })

      it('Should collect fee', async () => {
        const feeRecipientUSDCBalanceAfter = await balanceOf(
          ADDRESSES.main.USDC,
          ADDRESSES.main.feeRecipient,
          { config },
        )

        expectToBeEqual(
          amountToWei(new BigNumber(positionMutation.simulation.swap.sourceTokenFee), 6).toFixed(0),
          feeRecipientUSDCBalanceAfter.minus(feeRecipientUSDCBalanceBefore),
        )
      })
    })
  })

  describe.skip('On latest block using one inch exchange and api', () => {
    const depositEthAmount = amountToWei(new BigNumber(60 / 1e15))
    const multiple = new BigNumber(2)
    const slippage = new BigNumber(0.1)

    let system: DeployedSystemInfo

    let positionMutation: IPositionMutation
    let txStatus: boolean

    let userAccountData: AAVEAccountData
    let userStEthReserveData: AAVEReserveData

    let feeRecipientWethBalanceBefore: BigNumber

    before(async function () {
      const shouldRun1InchTests = process.env.RUN_1INCH_TESTS === '1'
      if (shouldRun1InchTests) {
        //Reset to the latest block
        await resetNodeToLatestBlock(provider)
        const { system: _system } = await deploySystem(config, false, false)
        system = _system

        const addresses = {
          ...mainnetAddresses,
          operationExecutor: system.common.operationExecutor.address,
        }

        feeRecipientWethBalanceBefore = await balanceOf(
          ADDRESSES.main.WETH,
          ADDRESSES.main.feeRecipient,
          { config, isFormatted: true },
        )

        positionMutation = await strategies.aave.open(
          {
            depositedByUser: { debtInWei: depositEthAmount },
            slippage,
            multiple,
            debtToken: { symbol: 'ETH' },
            collateralToken: { symbol: 'STETH' },
          },
          {
            addresses,
            provider,
            getSwapData: getOneInchCall(system.common.swap.address),
            proxy: system.common.dsProxy.address,
          },
        )

        const [_txStatus] = await executeThroughProxy(
          system.common.dsProxy.address,
          {
            address: system.common.operationExecutor.address,
            calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
              positionMutation.transaction.calls,
              OPERATION_NAMES.common.CUSTOM_OPERATION,
            ]),
          },
          signer,
          depositEthAmount.toFixed(0),
        )
        txStatus = _txStatus

        userAccountData = await aaveLendingPool.getUserAccountData(system.common.dsProxy.address)
        userStEthReserveData = await aaveDataProvider.getUserReserveData(
          ADDRESSES.main.stETH,
          system.common.dsProxy.address,
        )
      } else {
        this.skip()
      }
    })

    it('Tx should pass', () => {
      expect(txStatus).to.be.true
    })

    it('Should draw debt according to multiple', () => {
      expectToBeEqual(
        positionMutation.simulation.position.debt.amount.toFixed(0),
        new BigNumber(userAccountData.totalDebtETH.toString()),
      )
    })

    it('Should deposit all stEth tokens to aave', () => {
      expectToBe(
        positionMutation.simulation.swap.minToTokenAmount,
        'lte',
        new BigNumber(userStEthReserveData.currentATokenBalance.toString()),
      )
    })

    it('Should collect fee', async () => {
      const feeRecipientWethBalanceAfter = await balanceOf(
        ADDRESSES.main.WETH,
        ADDRESSES.main.feeRecipient,
        { config, isFormatted: true },
      )

      expectToBeEqual(
        new BigNumber(positionMutation.simulation.swap.sourceTokenFee),
        feeRecipientWethBalanceAfter.minus(feeRecipientWethBalanceBefore),
      )
    })
  })
})
