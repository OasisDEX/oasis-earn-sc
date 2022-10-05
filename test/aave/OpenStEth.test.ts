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
import { Contract, ContractReceipt, Signer } from 'ethers'

import AAVEDataProviderABI from '../../abi/aaveDataProvider.json'
import AAVELendigPoolABI from '../../abi/aaveLendingPool.json'
import ERC20ABI from '../../abi/IERC20.json'
import { AAVEAccountData, AAVEReserveData } from '../../helpers/aave'
import { executeThroughProxy } from '../../helpers/deploy'
import { resetNodeToLatestBlock } from '../../helpers/init'
import { restoreSnapshot } from '../../helpers/restoreSnapshot'
import { getOneInchCall } from '../../helpers/swap/OneIchCall'
import { oneInchCallMock } from '../../helpers/swap/OneInchCallMock'
import { RuntimeConfig } from '../../helpers/types/common'
import { amountToWei, balanceOf } from '../../helpers/utils'
import { DeployedSystemInfo, deploySystem } from '../deploySystem'
import { initialiseConfig } from '../fixtures/setup'
import { expectToBe, expectToBeEqual } from '../utils'

describe(`Operations | AAVE | ${OPERATION_NAMES.aave.OPEN_POSITION}`, async () => {
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
    WETH = new Contract(ADDRESSES.main.WETH, ERC20ABI, provider)
    stETH = new Contract(ADDRESSES.main.stETH, ERC20ABI, provider)
  })

  describe('On forked chain', () => {
    // Apparently there is not enough liquidity (at tested block) to deposit > 100ETH`
    const depositAmount = amountToWei(new BigNumber(60))
    const multiple = new BigNumber(2)
    const slippage = new BigNumber(0.1)
    const aaveStEthPriceInEth = new BigNumber(0.98066643)

    let system: DeployedSystemInfo

    let strategy: IStrategy
    let txStatus: boolean
    let tx: ContractReceipt

    let userAccountData: AAVEAccountData
    let userStEthReserveData: AAVEReserveData
    let actualPosition: IPosition

    let feeRecipientWethBalanceBefore: BigNumber

    before(async () => {
      const testSpecificBlock = 15200000 // Must be this block to match oracle price above (used when constructing actualPosition below)
      const snapshot = await restoreSnapshot(config, provider, testSpecificBlock)
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
          getSwapData: oneInchCallMock(),
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

      // Precision of 13. That's the best precision that could be achieved given data imported from Google Spreadsheets
      expectToBeEqual(
        new BigNumber(strategy.simulation.swap.fee.toFixed(13)),
        feeRecipientWethBalanceAfter.minus(feeRecipientWethBalanceBefore).toFixed(13),
      )
    })
  })

  describe('On latest block using one inch exchange and api', () => {
    const depositAmount = amountToWei(new BigNumber(60))
    const multiple = new BigNumber(2)
    const slippage = new BigNumber(0.1)

    let system: DeployedSystemInfo

    let strategy: IStrategy
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
          getSwapData: getOneInchCall(system.common.swap.address),
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
      tx = _tx

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

      // Precision of 13. That's the best precision that could be achieved given data imported from Google Spreadsheets
      expectToBeEqual(
        new BigNumber(strategy.simulation.swap.fee.toString(13)),
        feeRecipientWethBalanceAfter.minus(feeRecipientWethBalanceBefore).toFixed(13),
      )
    })
  })
})
