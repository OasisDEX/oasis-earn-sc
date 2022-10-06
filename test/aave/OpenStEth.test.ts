import { JsonRpcProvider } from '@ethersproject/providers'
import {
  ADDRESSES,
  IPosition,
  IStrategy,
  OPERATION_NAMES,
  Position,
  strategies,
} from '@oasisdex/oasis-actions'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { loadFixture } from 'ethereum-waffle'
import { Contract, Signer } from 'ethers'

import AAVEDataProviderABI from '../../abi/aaveDataProvider.json'
import AAVELendigPoolABI from '../../abi/aaveLendingPool.json'
import { executeThroughProxy } from '../../helpers/deploy'
import { resetNodeToLatestBlock } from '../../helpers/init'
import { restoreSnapshot } from '../../helpers/restoreSnapshot'
import { swapOneInchTokens } from '../../helpers/swap/1inch'
import { RuntimeConfig } from '../../helpers/types/common'
import { amountToWei, balanceOf } from '../../helpers/utils'
import { testBlockNumber } from '../config'
import { DeployedSystemInfo, deploySystem } from '../deploySystem'
import { initialiseConfig } from '../fixtures/setup'
import { expectToBe, expectToBeEqual } from '../utils'

const oneInchCallMock =
  (marketPrice: BigNumber) =>
  async (from: string, to: string, amount: BigNumber, slippage: BigNumber) => {
    return {
      fromTokenAddress: from,
      toTokenAddress: to,
      fromTokenAmount: amount,
      toTokenAmount: amount.div(marketPrice),
      minToTokenAmount: amount
        .div(marketPrice)
        .times(new BigNumber(1).minus(slippage))
        .integerValue(BigNumber.ROUND_DOWN), // TODO: figure out slippage
      exchangeCalldata: 0,
    }
  }

const getOneInchRealCall =
  (swapAddress: string) =>
  async (from: string, to: string, amount: BigNumber, slippage: BigNumber) => {
    const response = await swapOneInchTokens(
      from,
      to,
      amount.toString(),
      swapAddress,
      slippage.toString(),
    )

    console.log('1inch Response:')
    console.log(response.fromTokenAmount.toString())
    console.log(response.toTokenAmount.toString())
    console.log(new BigNumber(0))

    return {
      toTokenAddress: to,
      fromTokenAddress: from,
      minToTokenAmount: new BigNumber(0),
      toTokenAmount: new BigNumber(response.toTokenAmount),
      fromTokenAmount: new BigNumber(response.fromTokenAmount),
      exchangeCalldata: response.tx.data,
    }
  }

interface AAVEReserveData {
  currentATokenBalance: BigNumber
  currentStableDebt: BigNumber
  currentVariableDebt: BigNumber
  principalStableDebt: BigNumber
  scaledVariableDebt: BigNumber
  stableBorrowRate: BigNumber
  liquidityRate: BigNumber
}

interface AAVEAccountData {
  totalCollateralETH: BigNumber
  totalDebtETH: BigNumber
  availableBorrowsETH: BigNumber
  currentLiquidationThreshold: BigNumber
  ltv: BigNumber
  healthFactor: BigNumber
}

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
    const depositAmount = amountToWei(new BigNumber(60 / 1e15))
    const multiple = new BigNumber(2)
    const slippage = new BigNumber(0.1)
    const aaveStEthPriceInEth = new BigNumber(0.98066643)

    let system: DeployedSystemInfo

    let strategy: IStrategy
    let txStatus: boolean

    let userAccountData: AAVEAccountData
    let userStEthReserveData: AAVEReserveData
    let actualPosition: IPosition

    let feeRecipientWethBalanceBefore: BigNumber

    before(async () => {
      const snapshot = await restoreSnapshot(config, provider, testBlockNumber)
      system = snapshot.deployed.system

      const addresses = {
        ...mainnetAddresses,
        operationExecutor: system.common.operationExecutor.address,
      }

      strategy = await strategies.aave.openStEth(
        {
          depositAmount,
          slippage,
          multiple,
        },
        {
          addresses,
          provider,
          getSwapData: oneInchCallMock(new BigNumber(0.9759)),
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
            strategy.calls,
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
        { amount: new BigNumber(userAccountData.totalDebtETH.toString()) },
        { amount: new BigNumber(userStEthReserveData.currentATokenBalance.toString()) },
        aaveStEthPriceInEth,
        strategy.simulation.position.category,
      )
    })

    it('Tx should pass', () => {
      expect(txStatus).to.be.true
    })

    it('Should draw debt according to multiple', () => {
      expectToBeEqual(
        strategy.simulation.position.debt.amount.toFixed(0),
        new BigNumber(userAccountData.totalDebtETH.toString()),
      )
    })

    it('Should deposit all stEth tokens to aave', () => {
      expectToBe(
        strategy.simulation.swap.minToTokenAmount,
        'lte',
        new BigNumber(userStEthReserveData.currentATokenBalance.toString()),
      )
    })

    it('Should achieve target multiple', () => {
      expectToBe(
        strategy.simulation.position.riskRatio.multiple,
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
        new BigNumber(strategy.simulation.swap.sourceTokenFee),
        feeRecipientWethBalanceAfter.minus(feeRecipientWethBalanceBefore),
      )
    })
  })

  describe('On latest block using one inch exchange and api', () => {
    const depositAmount = amountToWei(new BigNumber(60 / 1e15))
    const multiple = new BigNumber(2)
    const slippage = new BigNumber(0.1)

    let system: DeployedSystemInfo

    let strategy: IStrategy
    let txStatus: boolean

    let userAccountData: AAVEAccountData
    let userStEthReserveData: AAVEReserveData

    let feeRecipientWethBalanceBefore: BigNumber

    before(async () => {
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

      console.log('feeRecipientWethBalanceBefore:', feeRecipientWethBalanceBefore.toString())

      strategy = await strategies.aave.openStEth(
        {
          depositAmount,
          slippage,
          multiple,
        },
        {
          addresses,
          provider,
          getSwapData: getOneInchRealCall(system.common.swap.address),
          dsProxy: system.common.dsProxy.address,
        },
      )

      const [_txStatus, _tx] = await executeThroughProxy(
        system.common.dsProxy.address,
        {
          address: system.common.operationExecutor.address,
          calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
            strategy.calls,
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
    })

    it('Tx should pass', () => {
      expect(txStatus).to.be.true
    })

    it('Should draw debt according to multiple', () => {
      expectToBeEqual(
        strategy.simulation.position.debt.amount.toFixed(0),
        new BigNumber(userAccountData.totalDebtETH.toString()),
      )
    })

    it('Should deposit all stEth tokens to aave', () => {
      expectToBe(
        strategy.simulation.swap.minToTokenAmount,
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
        new BigNumber(strategy.simulation.swap.sourceTokenFee),
        feeRecipientWethBalanceAfter.minus(feeRecipientWethBalanceBefore),
      )
    })
  })
})
