import { JsonRpcProvider } from '@ethersproject/providers'
import { ADDRESSES, OPERATION_NAMES, strategies } from '@oasisdex/oasis-actions'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { Contract, ContractReceipt, Signer } from 'ethers'

import AAVEDataProviderABI from '../../abi/aaveDataProvider.json'
import AAVELendigPoolABI from '../../abi/aaveLendingPool.json'
import { executeThroughProxy } from '../../helpers/deploy'
import init, { resetNode, resetNodeToLatestBlock } from '../../helpers/init'
import { RuntimeConfig } from '../../helpers/types/common'
import { amountToWei, balanceOf } from '../../helpers/utils'
import { testBlockNumber } from '../config'
import { DeployedSystemInfo, deploySystem } from '../deploySystem'
import { getOneInchRealCall, makeOneInchCallMock } from '../helpers/oneInchCalls'
import { expectToBe, expectToBeEqual } from '../utils'

export const oneInchCallMock = makeOneInchCallMock(new BigNumber(0.979))

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
    chainlinkEthUsdPriceFeed: ADDRESSES.main.chainlinkEthUsdPriceFeed,
    aavePriceOracle: ADDRESSES.main.aavePriceOracle,
    aaveLendingPool: ADDRESSES.main.aave.MainnetLendingPool,
  }

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
    // Apparently there is not enough liquidity (at tested block) to deposit > 100ETH`
    const depositAmount = amountToWei(new BigNumber(60))
    const multiple = new BigNumber(2)
    const slippage = new BigNumber(0.1)

    let system: DeployedSystemInfo

    let strategy: strategies.aave.IStrategy
    let txStatus: boolean
    let tx: ContractReceipt

    let userAccountData: AAVEAccountData
    let userStEthReserveData: AAVEReserveData

    let feeRecipientWethBalanceBefore: BigNumber

    before(async () => {
      await resetNode(provider, testBlockNumber)

      const { system: _system } = await deploySystem(config)
      system = _system

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
          getSwapData: oneInchCallMock,
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
    })

    it('Tx should pass', () => {
      expect(txStatus).to.be.true
    })

    it('Should draw debt according to multiply', () => {
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
        new BigNumber(strategy.simulation.swap.fee.toFixed(6)),
        feeRecipientWethBalanceAfter.minus(feeRecipientWethBalanceBefore).toFixed(6),
      )
    })
  })

  describe.skip('On latest block using one inch exchange and api', () => {
    const depositAmount = amountToWei(new BigNumber(60))
    const multiple = new BigNumber(2)
    const slippage = new BigNumber(0.1)

    let system: DeployedSystemInfo

    let strategy: strategies.aave.IStrategy
    let txStatus: boolean
    let tx: ContractReceipt

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

    it('Should draw debt according to multiply', () => {
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
        new BigNumber(strategy.simulation.swap.fee.toFixed(6)),
        feeRecipientWethBalanceAfter.minus(feeRecipientWethBalanceBefore).toFixed(6),
      )
    })
  })
})
