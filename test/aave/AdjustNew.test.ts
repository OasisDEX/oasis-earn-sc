import AAVELendingPoolABI from '@abi/external/aave/v2/lendingPool.json'
import aavePriceOracleABI from '@abi/external/aave/v2/priceOracle.json'
import AAVEDataProviderABI from '@abi/external/aave/v2/protocolDataProvider.json'
import { executeThroughProxy } from '@helpers/deploy'
import { oneInchCallMock } from '@helpers/swap/OneInchCallMock'
import { RuntimeConfig, Unbox } from '@helpers/types/common'
import { balanceOf } from '@helpers/utils'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { loadFixture } from 'ethereum-waffle'
import { Contract, ethers } from 'ethers'

import {
  AAVETokens,
  ADDRESSES,
  IPosition,
  IRiskRatio,
  ONE,
  RiskRatio,
  strategies,
} from '../../packages/oasis-actions/src'
import { amountFromWei } from '../../packages/oasis-actions/src/helpers'
import { acceptedFeeToken } from '../../packages/oasis-actions/src/helpers/swap/acceptedFeeToken'
import { PositionType } from '../../packages/oasis-actions/src/types'
import { mainnetAddresses } from '../addresses'
import { DeployedSystemInfo } from '../deploySystem'
import {
  getSupportedStrategies,
  getSystemWithAavePositions,
  SystemWithAAVEPositions,
} from '../fixtures'
import { SLIPPAGE, UNISWAP_TEST_SLIPPAGE } from '../fixtures/factories/common'
import { TokenDetails } from '../fixtures/types/positionDetails'
import { expectToBe } from '../utils'

const ciOnlyTests = process.env.RUN_ONLY_CI_TESTS === '1'
describe('Strategy | AAVE | Adjust Position', async function () {
  describe('Using AAVE V2', async function () {
    let fixture: SystemWithAAVEPositions

    const supportedStrategies = getSupportedStrategies(ciOnlyTests)

    async function adjustPositionV2({
      isDPMProxy,
      targetMultiple,
      position,
      collateralToken,
      debtToken,
      proxy,
      userAddress,
      getSwapData,
      slippage,
      positionType,
      config,
      system,
    }: {
      isDPMProxy: boolean
      targetMultiple: IRiskRatio
      position: IPosition
      collateralToken: TokenDetails
      debtToken: TokenDetails
      proxy: string
      userAddress: string
      getSwapData: any
      slippage: BigNumber
      positionType: PositionType
      config: RuntimeConfig
      system: DeployedSystemInfo
    }) {
      const addresses = {
        ...mainnetAddresses,
        priceOracle: mainnetAddresses.aave.v2.priceOracle,
        lendingPool: mainnetAddresses.aave.v2.lendingPool,
        protocolDataProvider: mainnetAddresses.aave.v2.protocolDataProvider,
        operationExecutor: system.common.operationExecutor.address,
      }
      const tokenAddresses: Record<AAVETokens, string> = {
        WETH: mainnetAddresses.WETH,
        ETH: mainnetAddresses.WETH,
        STETH: mainnetAddresses.STETH,
        WSTETH: mainnetAddresses.WSTETH,
        USDC: mainnetAddresses.USDC,
        WBTC: mainnetAddresses.WBTC,
      }

      const collateralTokenAddress = tokenAddresses[collateralToken.symbol]
      const debtTokenAddress = tokenAddresses[debtToken.symbol]

      const isFeeFromDebtToken =
        acceptedFeeToken({
          fromToken: collateralToken.symbol,
          toToken: debtToken.symbol,
        }) === 'targetToken'

      console.log('isFeeFromDebtToken', isFeeFromDebtToken)
      const feeWalletBalanceBeforeAdjust = await balanceOf(
        isFeeFromDebtToken ? debtToken.address : collateralToken.address,
        ADDRESSES.main.feeRecipient,
        { config },
      )

      const provider = config.provider
      const signer = config.signer

      const lendingPool = new Contract(
        ADDRESSES.main.aave.v2.LendingPool,
        AAVELendingPoolABI,
        provider,
      )

      const protocolDataProvider = new Contract(
        ADDRESSES.main.aave.v2.ProtocolDataProvider,
        AAVEDataProviderABI,
        provider,
      )

      const priceOracle = new ethers.Contract(
        ADDRESSES.main.aave.v2.PriceOracle,
        aavePriceOracleABI,
        provider,
      )

      const strategy = await strategies.aave.v2.adjust(
        {
          slippage,
          multiple: targetMultiple,
          positionType,
          debtToken: { symbol: debtToken.symbol, precision: debtToken.precision },
          collateralToken: {
            symbol: collateralToken.symbol,
            precision: collateralToken.precision,
          },
        },
        {
          isDPMProxy,
          addresses,
          provider,
          currentPosition: position,
          getSwapData,
          proxy,
          user: userAddress,
        },
      )

      const [txStatus, tx] = await executeThroughProxy(
        proxy,
        {
          address: system.common.operationExecutor.address,
          calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
            strategy.transaction.calls,
            strategy.transaction.operationName,
          ]),
        },
        signer,
        '0',
      )

      // Get data from AAVE
      const protocolDataPromises = [
        protocolDataProvider.getUserReserveData(collateralTokenAddress, proxy),
        protocolDataProvider.getUserReserveData(debtTokenAddress, proxy),
        priceOracle
          .getAssetPrice(collateralTokenAddress)
          .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString()))),
        priceOracle
          .getAssetPrice(debtTokenAddress)
          .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString()))),
        lendingPool.getUserAccountData(proxy),
      ]
      const protocolData = await Promise.all(protocolDataPromises)

      const feeWalletBalanceAfterAdjust = await balanceOf(
        isFeeFromDebtToken ? debtToken.address : collateralToken.address,
        ADDRESSES.main.feeRecipient,
        { config },
      )

      const adjustedPosition = await strategies.aave.v2.view(
        {
          proxy,
          collateralToken,
          debtToken,
        },
        {
          addresses,
          provider,
        },
      )

      return {
        adjustedPosition,
        simulation: strategy.simulation,
        txStatus,
        tx,
        protocolData: {
          collateral: protocolData[0],
          debt: protocolData[1],
          collateralPrice: protocolData[2],
          debtPrice: protocolData[3],
          userAccountData: protocolData[4],
        },
        debtTokenAddress,
        collateralTokenAddress,
        feeWalletBalanceBeforeAdjust,
        feeWalletBalanceAfterAdjust,
      }
    }

    describe('Adjust Risk Up', async function () {
      before(async () => {
        fixture = await loadFixture(getSystemWithAavePositions({ use1inch: false }))
      })
      describe('Using DSProxy', () => {
        let act: Unbox<ReturnType<typeof adjustPositionV2>>

        before(async () => {
          const { config, system, dsProxyPosition: dsProxyStEthEthEarnPositionDetails } = fixture
          const { debtToken, collateralToken, proxy } = dsProxyStEthEthEarnPositionDetails

          const position = await dsProxyStEthEthEarnPositionDetails.getPosition()
          act = await adjustPositionV2({
            isDPMProxy: false,
            targetMultiple: new RiskRatio(new BigNumber(3.5), RiskRatio.TYPE.MULITPLE),
            positionType: 'Earn',
            position,
            collateralToken,
            debtToken,
            proxy,
            slippage: UNISWAP_TEST_SLIPPAGE,
            getSwapData: oneInchCallMock(dsProxyStEthEthEarnPositionDetails.__mockPrice, {
              from: debtToken.precision,
              to: collateralToken.precision,
            }),
            userAddress: config.address,
            config,
            system,
          })
        })
        it('Adjust TX should pass', () => {
          expect(act.txStatus).to.be.true
        })
        it('should draw debt according to multiple', async () => {
          expectToBe(
            act.adjustedPosition.debt.amount.toString(),
            'gte',
            act.simulation.position.debt.amount.toString(),
          )
        })
        it('should collect fee', async () => {
          const actualFeesDelta = act.feeWalletBalanceAfterAdjust.minus(
            act.feeWalletBalanceBeforeAdjust,
          )

          expectToBe(act.simulation.swap.tokenFee, 'lte', actualFeesDelta)
        })
      })
      describe('Using DPM Proxy', () => {
        supportedStrategies.forEach(({ name: strategy }) => {
          let act: Unbox<ReturnType<typeof adjustPositionV2>>

          before(async function () {
            const { system, config, dpmPositions } = fixture

            const positionDetails = dpmPositions[strategy]
            if (!positionDetails) {
              this.skip()
            }

            const { debtToken, collateralToken, proxy } = positionDetails

            const position = await positionDetails.getPosition()
            const slippage =
              positionDetails?.strategy === 'STETH/USDC Multiply' ? UNISWAP_TEST_SLIPPAGE : SLIPPAGE
            act = await adjustPositionV2({
              isDPMProxy: true,
              targetMultiple: new RiskRatio(new BigNumber(3.5), RiskRatio.TYPE.MULITPLE),
              positionType: positionDetails?.__positionType,
              position,
              collateralToken,
              debtToken,
              proxy,
              slippage,
              getSwapData: oneInchCallMock(positionDetails.__mockPrice, {
                from: debtToken.precision,
                to: collateralToken.precision,
              }),
              userAddress: config.address,
              config,
              system,
            })
          })
          it('Adjust TX should pass', () => {
            expect(act.txStatus).to.be.true
          })
          it('should draw debt according to multiple', async () => {
            expectToBe(
              act.adjustedPosition.debt.amount.toString(),
              'gte',
              act.simulation.position.debt.amount.toString(),
            )
          })
          it('should collect fee', async () => {
            const actualFeesDelta = act.feeWalletBalanceAfterAdjust.minus(
              act.feeWalletBalanceBeforeAdjust,
            )

            expectToBe(act.simulation.swap.tokenFee, 'lte', actualFeesDelta)
          })
        })
      })
    })
    describe('Adjust Risk Down', async function () {
      before(async () => {
        fixture = await loadFixture(getSystemWithAavePositions({ use1inch: false }))
      })
      describe.only('Using DSProxy', () => {
        let act: Unbox<ReturnType<typeof adjustPositionV2>>

        before(async () => {
          const { config, system, dsProxyPosition: dsProxyStEthEthEarnPositionDetails } = fixture
          const { debtToken, collateralToken, proxy } = dsProxyStEthEthEarnPositionDetails

          const position = await dsProxyStEthEthEarnPositionDetails.getPosition()
          act = await adjustPositionV2({
            isDPMProxy: false,
            targetMultiple: new RiskRatio(new BigNumber(1.5), RiskRatio.TYPE.MULITPLE),
            positionType: 'Earn',
            position,
            collateralToken,
            debtToken,
            proxy,
            slippage: UNISWAP_TEST_SLIPPAGE,
            getSwapData: oneInchCallMock(ONE.div(dsProxyStEthEthEarnPositionDetails.__mockPrice), {
              from: collateralToken.precision,
              to: debtToken.precision,
            }),
            userAddress: config.address,
            config,
            system,
          })
        })
        it('Adjust TX should pass', () => {
          expect(act.txStatus).to.be.true
        })
        it('should draw debt according to multiple', async () => {
          expectToBe(
            act.adjustedPosition.debt.amount.toString(),
            'gte',
            act.simulation.position.debt.amount.toString(),
          )
        })
        it('should collect fee', async () => {
          const actualFeesDelta = act.feeWalletBalanceAfterAdjust.minus(
            act.feeWalletBalanceBeforeAdjust,
          )

          expectToBe(act.simulation.swap.tokenFee, 'lte', actualFeesDelta)
        })
      })
      describe('Using DPM Proxy', () => {
        supportedStrategies.forEach(({ name: strategy }) => {
          let act: Unbox<ReturnType<typeof adjustPositionV2>>

          before(async function () {
            const { system, config, dpmPositions } = fixture

            const positionDetails = dpmPositions[strategy]
            if (!positionDetails) {
              this.skip()
            }

            const { debtToken, collateralToken, proxy } = positionDetails

            const position = await positionDetails.getPosition()
            const slippage =
              positionDetails?.strategy === 'STETH/USDC Multiply' ? UNISWAP_TEST_SLIPPAGE : SLIPPAGE
            act = await adjustPositionV2({
              isDPMProxy: true,
              targetMultiple: new RiskRatio(new BigNumber(3.5), RiskRatio.TYPE.MULITPLE),
              positionType: positionDetails?.__positionType,
              position,
              collateralToken,
              debtToken,
              proxy,
              slippage,
              getSwapData: oneInchCallMock(positionDetails.__mockPrice, {
                from: debtToken.precision,
                to: collateralToken.precision,
              }),
              userAddress: config.address,
              config,
              system,
            })
          })
          it('Adjust TX should pass', () => {
            expect(act.txStatus).to.be.true
          })
          it('should draw debt according to multiple', async () => {
            expectToBe(
              act.adjustedPosition.debt.amount.toString(),
              'gte',
              act.simulation.position.debt.amount.toString(),
            )
          })
          it('should collect fee', async () => {
            const actualFeesDelta = act.feeWalletBalanceAfterAdjust.minus(
              act.feeWalletBalanceBeforeAdjust,
            )

            expectToBe(act.simulation.swap.tokenFee, 'lte', actualFeesDelta)
          })
        })
      })
    })
  })
  describe('Using AAVE V3', async function () {})
})
