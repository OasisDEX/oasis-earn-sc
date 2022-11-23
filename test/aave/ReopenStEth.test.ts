import { JsonRpcProvider } from '@ethersproject/providers'
import { ADDRESSES, OPERATION_NAMES, strategies } from '@oasisdex/oasis-actions'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { loadFixture } from 'ethereum-waffle'
import { Signer } from 'ethers'

import { executeThroughProxy } from '../../helpers/deploy'
import { resetNodeToLatestBlock } from '../../helpers/init'
import { restoreSnapshot } from '../../helpers/restoreSnapshot'
import { getOneInchCall } from '../../helpers/swap/OneIchCall'
import { oneInchCallMock } from '../../helpers/swap/OneInchCallMock'
import { RuntimeConfig } from '../../helpers/types/common'
import { amountToWei } from '../../helpers/utils'
import { deploySystem } from '../deploySystem'
import { initialiseConfig } from '../fixtures/setup'

describe(`Strategy | AAVE | Reopen Position`, async () => {
  const depositAmount = amountToWei(new BigNumber(10))
  const multiple = new BigNumber(2)
  const slippage = new BigNumber(0.5)

  let provider: JsonRpcProvider
  let config: RuntimeConfig
  let signer: Signer

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
    ;({ config, provider, signer } = await loadFixture(initialiseConfig))
  })

  describe('On forked chain', () => {
    const testBlockWithSufficientLiquidityInUswapPool = 15690000

    let openTxStatus: boolean
    let closeTxStatus: boolean
    let reopenTxStatus: boolean

    before(async () => {
      const snapshot = await restoreSnapshot(
        config,
        provider,
        testBlockWithSufficientLiquidityInUswapPool,
        true,
        false,
      )

      const system = snapshot.deployed.system

      const addresses = {
        ...mainnetAddresses,
        operationExecutor: system.common.operationExecutor.address,
      }

      const dependencies = {
        addresses,
        provider,
        getSwapData: oneInchCallMock(new BigNumber(0.9759)),
        dsProxy: system.common.dsProxy.address,
      }

      const beforeOpenPosition = await strategies.aave.getCurrentStEthEthPosition(
        { proxyAddress: system.common.dsProxy.address },
        { ...dependencies },
      )

      console.log(`--- Opening Position ---`)
      console.log(`Before: ${beforeOpenPosition.collateral.amount.toString()}`)

      const openStrategy = await strategies.aave.openStEth(
        {
          depositAmount,
          slippage,
          multiple,
        },
        {
          ...dependencies,
          currentPosition: beforeOpenPosition,
        },
      )

      const [_openTxStatus, d] = await executeThroughProxy(
        system.common.dsProxy.address,
        {
          address: system.common.operationExecutor.address,
          calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
            openStrategy.calls,
            OPERATION_NAMES.aave.OPEN_POSITION,
          ]),
        },
        signer,
        depositAmount.toString(),
      )
      openTxStatus = _openTxStatus

      console.log(`Transaction: ${d.status}`)

      const positionAfterOpen = await strategies.aave.getCurrentStEthEthPosition(
        { proxyAddress: system.common.dsProxy.address },
        { ...dependencies },
      )

      console.log(`After: ${positionAfterOpen.collateral.amount.toString()}`)

      const closeStrategy = await strategies.aave.closeStEth(
        {
          stEthAmountLockedInAave: amountToWei(positionAfterOpen.collateral.amount),
          slippage,
        },
        {
          ...dependencies,
          position: positionAfterOpen,
        },
      )

      const [_closeTxStatus] = await executeThroughProxy(
        system.common.dsProxy.address,
        {
          address: system.common.operationExecutor.address,
          calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
            closeStrategy.calls,
            OPERATION_NAMES.aave.CLOSE_POSITION,
          ]),
        },
        signer,
        '0',
      )

      closeTxStatus = _closeTxStatus

      const currentPosition = await strategies.aave.getCurrentStEthEthPosition(
        { proxyAddress: system.common.dsProxy.address },
        { ...dependencies },
      )

      const reopenStrategy = await strategies.aave.openStEth(
        {
          depositAmount,
          slippage,
          multiple,
        },
        {
          ...dependencies,
          currentPosition: currentPosition,
        },
      )

      const [_reopenTxStatus] = await executeThroughProxy(
        system.common.dsProxy.address,
        {
          address: system.common.operationExecutor.address,
          calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
            reopenStrategy.calls,
            OPERATION_NAMES.aave.OPEN_POSITION,
          ]),
        },
        signer,
        depositAmount.toFixed(0),
      )
      reopenTxStatus = _reopenTxStatus
    })

    it('Open Tx should pass', () => {
      expect(openTxStatus).to.be.true
    })
    it('Close Tx should pass', () => {
      expect(closeTxStatus).to.be.true
    })
    it('Reopen Tx should pass', () => {
      expect(reopenTxStatus).to.be.true
    })
  })

  describe('Should close position with real oneInch', () => {
    const slippage = new BigNumber(0.1)

    let openTxStatus: boolean
    let closeTxStatus: boolean
    let reopenTxStatus: boolean

    before(async function () {
      const shouldRun1InchTests = process.env.RUN_1INCH_TESTS === '1'
      if (shouldRun1InchTests) {
        await resetNodeToLatestBlock(provider)
        const { system } = await deploySystem(config, false, false)

        const addresses = {
          ...mainnetAddresses,
          operationExecutor: system.common.operationExecutor.address,
        }

        const dependencies = {
          addresses,
          provider,
          getSwapData: getOneInchCall(system.common.swap.address),
          dsProxy: system.common.dsProxy.address,
        }

        const beforeOpenPosition = await strategies.aave.getCurrentStEthEthPosition(
          { proxyAddress: system.common.dsProxy.address },
          { ...dependencies },
        )

        const openStrategy = await strategies.aave.openStEth(
          {
            depositAmount,
            slippage,
            multiple,
          },
          {
            ...dependencies,
            currentPosition: beforeOpenPosition,
          },
        )

        const [_openTxStatus] = await executeThroughProxy(
          system.common.dsProxy.address,
          {
            address: system.common.operationExecutor.address,
            calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
              openStrategy.calls,
              OPERATION_NAMES.aave.OPEN_POSITION,
            ]),
          },
          signer,
          depositAmount.toFixed(0),
        )
        openTxStatus = _openTxStatus

        const positionAfterOpen = await strategies.aave.getCurrentStEthEthPosition(
          { proxyAddress: system.common.dsProxy.address },
          { ...dependencies },
        )

        const closeStrategy = await strategies.aave.closeStEth(
          {
            stEthAmountLockedInAave: positionAfterOpen.collateral.amount,
            slippage,
          },
          {
            ...dependencies,
            position: positionAfterOpen,
          },
        )

        const [_closeTxStatus] = await executeThroughProxy(
          system.common.dsProxy.address,
          {
            address: system.common.operationExecutor.address,
            calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
              closeStrategy.calls,
              OPERATION_NAMES.common.CUSTOM_OPERATION,
            ]),
          },
          signer,
          '0',
        )

        closeTxStatus = _closeTxStatus

        const currentPosition = await strategies.aave.getCurrentStEthEthPosition(
          { proxyAddress: system.common.dsProxy.address },
          { ...dependencies },
        )

        const reopenStrategy = await strategies.aave.openStEth(
          {
            depositAmount,
            slippage,
            multiple,
          },
          {
            ...dependencies,
            currentPosition: currentPosition,
          },
        )

        const [_reopenTxStatus] = await executeThroughProxy(
          system.common.dsProxy.address,
          {
            address: system.common.operationExecutor.address,
            calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
              reopenStrategy.calls,
              OPERATION_NAMES.aave.OPEN_POSITION,
            ]),
          },
          signer,
          depositAmount.toFixed(0),
        )
        reopenTxStatus = _reopenTxStatus
      } else {
        this.skip()
      }
    })

    it('Open Tx should pass', () => {
      expect(openTxStatus).to.be.true
    })

    it('Close Tx should pass', () => {
      expect(closeTxStatus).to.be.true
    })

    it('Reopen Tx should pass', () => {
      expect(reopenTxStatus).to.be.true
    })
  })
})
