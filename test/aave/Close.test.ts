import AAVELendingPoolABI from '@abi/external/aave/v2/lendingPool.json'
import aavePriceOracleABI from '@abi/external/aave/v2/priceOracle.json'
import AAVEDataProviderABI from '@abi/external/aave/v2/protocolDataProvider.json'
import aaveOracleABI from '@abi/external/aave/v3/aaveOracle.json'
import AAVEProtocolDataProviderABI from '@abi/external/aave/v3/aaveProtocolDataProvider.json'
import AAVEPoolABI from '@abi/external/aave/v3/pool.json'
import { executeThroughProxy } from '@helpers/deploy'
import { oneInchCallMock } from '@helpers/swap/OneInchCallMock'
import { RuntimeConfig, Unbox } from '@helpers/types/common'
import { balanceOf } from '@helpers/utils'
import {
  AAVETokens,
  ADDRESSES,
  IPosition,
  ONE,
  strategies,
  ZERO,
} from '@oasisdex/oasis-actions/src'
import { amountFromWei } from '@oasisdex/oasis-actions/src/helpers'
import { acceptedFeeToken } from '@oasisdex/oasis-actions/src/helpers/swap/acceptedFeeToken'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { loadFixture } from 'ethereum-waffle'
import { Contract, ethers } from 'ethers'

import { mainnetAddresses } from '../addresses'
import { DeployedSystemInfo } from '../deploySystem'
import {
  getSupportedStrategies,
  getSystemWithAavePositions,
  SystemWithAAVEPositions,
} from '../fixtures'
import { UNISWAP_TEST_SLIPPAGE } from '../fixtures/factories/common'
import {
  getSupportedAaveV3Strategies,
  getSystemWithAaveV3Positions,
} from '../fixtures/system/getSystemWithAaveV3Positions'
import { TokenDetails } from '../fixtures/types/positionDetails'
import { SystemWithAAVEV3Positions } from '../fixtures/types/systemWithAAVEPositions'
import { expectToBe, expectToBeEqual } from '../utils'

const ciOnlyTests = process.env.RUN_ONLY_CI_TESTS === '1'
const EXPECT_LARGER_SIMULATED_FEE = 'Expect simulated fee to be more than the user actual pays'

describe(`Strategy | AAVE | Close Position`, async () => {
  describe('Using AAVE V2', async function () {
    let fixture: SystemWithAAVEPositions

    const supportedStrategies = getSupportedStrategies(ciOnlyTests)

    async function closePositionV2({
      isDPMProxy,
      position,
      collateralToken,
      debtToken,
      proxy,
      userAddress,
      getSwapData,
      slippage,
      config,
      system,
    }: {
      isDPMProxy: boolean
      position: IPosition
      collateralToken: TokenDetails
      debtToken: TokenDetails
      proxy: string
      userAddress: string
      getSwapData: any
      slippage: BigNumber
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

      const feeWalletBalanceBeforeClosing = await balanceOf(
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

      const closePosition = await strategies.aave.v2.close(
        {
          slippage,
          collateralAmountLockedInProtocolInWei: position.collateral.amount,
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

      const [closeTxStatus, closeTx] = await executeThroughProxy(
        proxy,
        {
          address: system.common.operationExecutor.address,
          calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
            closePosition.transaction.calls,
            closePosition.transaction.operationName,
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

      const feeWalletBalanceAfterClosing = await balanceOf(
        isFeeFromDebtToken ? debtToken.address : collateralToken.address,
        ADDRESSES.main.feeRecipient,
        { config },
      )

      const closedPosition = strategies.aave.v2.view(
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
        closedPosition,
        simulation: closePosition.simulation,
        closeTxStatus,
        closeTx,
        protocolData: {
          collateral: protocolData[0],
          debt: protocolData[1],
          collateralPrice: protocolData[2],
          debtPrice: protocolData[3],
          userAccountData: protocolData[4],
        },
        debtTokenAddress,
        collateralTokenAddress,
        feeWalletBalanceBeforeClosing,
        feeWalletBalanceAfterClosing,
      }
    }

    describe('Close position: With Uniswap', () => {
      before(async () => {
        fixture = await loadFixture(getSystemWithAavePositions({ use1inch: false }))
      })

      describe('Using DSProxy', () => {
        let position: IPosition
        let proxy: string
        let system: any
        let debtToken: TokenDetails
        let collateralToken: TokenDetails
        let config: RuntimeConfig
        let act: Unbox<ReturnType<typeof closePositionV2>>

        before(async () => {
          const {
            config: _config,
            system: _system,
            dsProxyPosition: dsProxyStEthEthEarnPositionDetails,
          } = fixture
          const {
            debtToken: _debtToken,
            collateralToken: _collateralToken,
            proxy: _proxy,
          } = dsProxyStEthEthEarnPositionDetails
          system = _system
          config = _config
          proxy = _proxy
          debtToken = _debtToken
          collateralToken = _collateralToken
          position = await dsProxyStEthEthEarnPositionDetails.getPosition()

          act = await closePositionV2({
            isDPMProxy: false,
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

        it('Should have closed the position', () => {
          expect(act.closeTxStatus).to.be.true
        })

        it('Should payback all debt', () => {
          expectToBeEqual(
            new BigNumber(act.protocolData.userAccountData.totalDebtETH.toString()),
            ZERO,
          )
        })

        it(`Should withdraw all collateral tokens from aave`, () => {
          //due to quirks of how stEth works there might be 1 wei left in aave
          expectToBe(
            new BigNumber(act.protocolData.collateral.currentATokenBalance.toString()),
            'lte',
            ONE,
          )
        })

        it('Should collect fee', async () => {
          const actualFeesDelta = act.feeWalletBalanceAfterClosing.minus(
            act.feeWalletBalanceBeforeClosing,
          )

          expectToBe(
            act.simulation.swap.tokenFee,
            'gte',
            actualFeesDelta,
            EXPECT_LARGER_SIMULATED_FEE,
          )
        })

        it('should not be any token left on proxy', async () => {
          const proxyDebtBalance = await balanceOf(act.debtTokenAddress, proxy, {
            config,
            isFormatted: true,
          })
          const proxyCollateralBalance = await balanceOf(act.collateralTokenAddress, proxy, {
            config,
            isFormatted: true,
          })

          expectToBeEqual(proxyDebtBalance, ZERO)
          expectToBeEqual(proxyCollateralBalance, ZERO)
        })
      })
      describe('Using DPM Proxy', async () => {
        supportedStrategies
          .filter(s => s.name !== 'STETH/USDC Multiply')
          .forEach(({ name: strategy }) => {
            let position: IPosition
            let system: DeployedSystemInfo
            let proxy: string
            let debtToken: TokenDetails
            let collateralToken: TokenDetails
            let config: RuntimeConfig
            let act: Unbox<ReturnType<typeof closePositionV2>>

            before(async function () {
              const { dpmPositions, config: _config, system: _system } = fixture
              const positionDetails = dpmPositions[strategy]
              if (!positionDetails) {
                console.log(`No position for ${strategy} strategy`)
                this.skip()
              }
              const {
                debtToken: _debtToken,
                collateralToken: _collateralToken,
                proxy: _proxy,
              } = positionDetails
              system = _system
              proxy = _proxy
              debtToken = _debtToken
              collateralToken = _collateralToken
              position = await positionDetails.getPosition()
              config = _config

              act = await closePositionV2({
                position,
                isDPMProxy: true,
                collateralToken,
                debtToken,
                proxy,
                /* Chosen to mirror slippage in fixture */
                slippage: UNISWAP_TEST_SLIPPAGE,
                getSwapData: oneInchCallMock(ONE.div(positionDetails.__mockPrice), {
                  from: collateralToken.precision,
                  to: debtToken.precision,
                }),
                userAddress: config.address,
                config,
                system,
              })
            })

            it(`Should have closed the position: ${strategy}`, () => {
              expect(act.closeTxStatus).to.be.true
            })

            it('Should payback all debt', () => {
              expectToBeEqual(
                new BigNumber(act.protocolData.userAccountData.totalDebtETH.toString()),
                ZERO,
              )
            })

            it(`Should withdraw all collateral tokens from aave`, () => {
              //due to quirks of how stEth works there might be 1 wei left in aave
              expectToBe(
                new BigNumber(act.protocolData.collateral.currentATokenBalance.toString()),
                'lte',
                ONE,
              )
            })

            it('Should collect fee', async () => {
              const actualFeesDelta = act.feeWalletBalanceAfterClosing.minus(
                act.feeWalletBalanceBeforeClosing,
              )

              expectToBe(
                act.simulation.swap.tokenFee,
                'gte',
                actualFeesDelta,
                EXPECT_LARGER_SIMULATED_FEE,
              )
            })

            it('should not be any token left on proxy', async () => {
              const proxyDebtBalance = await balanceOf(act.debtTokenAddress, proxy, {
                config,
                isFormatted: true,
              })
              const proxyCollateralBalance = await balanceOf(act.collateralTokenAddress, proxy, {
                config,
                isFormatted: true,
              })

              expectToBeEqual(proxyDebtBalance, ZERO)
              expectToBeEqual(proxyCollateralBalance, ZERO)
            })
          })
      })
    })
  })
  describe('Using AAVE V3', async function () {
    let fixture: SystemWithAAVEV3Positions

    const supportedStrategies = getSupportedAaveV3Strategies(ciOnlyTests)

    async function closePositionV3({
      isDPMProxy,
      position,
      collateralToken,
      debtToken,
      proxy,
      userAddress,
      getSwapData,
      slippage,
      config,
      system,
    }: {
      isDPMProxy: boolean
      position: IPosition
      collateralToken: TokenDetails
      debtToken: TokenDetails
      proxy: string
      userAddress: string
      getSwapData: any
      slippage: BigNumber
      config: RuntimeConfig
      system: DeployedSystemInfo
    }) {
      const addresses = {
        ...mainnetAddresses,
        aaveOracle: mainnetAddresses.aave.v3.aaveOracle,
        pool: mainnetAddresses.aave.v3.pool,
        aaveProtocolDataProvider: mainnetAddresses.aave.v3.aaveProtocolDataProvider,
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

      const feeWalletBalanceBeforeClosing = await balanceOf(
        isFeeFromDebtToken ? debtToken.address : collateralToken.address,
        ADDRESSES.main.feeRecipient,
        { config },
      )

      const provider = config.provider
      const signer = config.signer

      const pool = new Contract(ADDRESSES.main.aave.v3.Pool, AAVEPoolABI, provider)

      const protocolDataProvider = new Contract(
        ADDRESSES.main.aave.v3.AaveProtocolDataProvider,
        AAVEProtocolDataProviderABI,
        provider,
      )

      const priceOracle = new ethers.Contract(
        ADDRESSES.main.aave.v3.AaveOracle,
        aaveOracleABI,
        provider,
      )

      const closePosition = await strategies.aave.v3.close(
        {
          slippage,
          collateralAmountLockedInProtocolInWei: position.collateral.amount,
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

      const [closeTxStatus, closeTx] = await executeThroughProxy(
        proxy,
        {
          address: system.common.operationExecutor.address,
          calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
            closePosition.transaction.calls,
            closePosition.transaction.operationName,
          ]),
        },
        signer,
        '0',
      )

      // Get data from AAVE V3
      const protocolDataPromises = [
        protocolDataProvider.getUserReserveData(collateralTokenAddress, proxy),
        protocolDataProvider.getUserReserveData(debtTokenAddress, proxy),
        priceOracle
          .getAssetPrice(collateralTokenAddress)
          .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString()))),
        priceOracle
          .getAssetPrice(debtTokenAddress)
          .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString()))),
        pool.getUserAccountData(proxy),
      ]
      const protocolData = await Promise.all(protocolDataPromises)

      const feeWalletBalanceAfterClosing = await balanceOf(
        isFeeFromDebtToken ? debtToken.address : collateralToken.address,
        ADDRESSES.main.feeRecipient,
        { config },
      )

      const closedPosition = strategies.aave.v3.view(
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
        closedPosition,
        simulation: closePosition.simulation,
        closeTxStatus,
        closeTx,
        protocolData: {
          collateral: protocolData[0],
          debt: protocolData[1],
          collateralPrice: protocolData[2],
          debtPrice: protocolData[3],
          userAccountData: protocolData[4],
        },
        debtTokenAddress,
        collateralTokenAddress,
        feeWalletBalanceBeforeClosing,
        feeWalletBalanceAfterClosing,
      }
    }

    describe('Close position: With Uniswap', () => {
      before(async () => {
        fixture = await loadFixture(getSystemWithAaveV3Positions({ use1inch: false }))
      })

      describe('Using DSProxy', () => {
        let position: IPosition
        let proxy: string
        let system: any
        let debtToken: TokenDetails
        let collateralToken: TokenDetails
        let config: RuntimeConfig
        let act: Unbox<ReturnType<typeof closePositionV3>>

        before(async () => {
          const {
            config: _config,
            system: _system,
            dsProxyPosition: dsProxyStEthEthEarnPositionDetails,
          } = fixture
          const {
            debtToken: _debtToken,
            collateralToken: _collateralToken,
            proxy: _proxy,
          } = dsProxyStEthEthEarnPositionDetails
          system = _system
          config = _config
          proxy = _proxy
          debtToken = _debtToken
          collateralToken = _collateralToken
          position = await dsProxyStEthEthEarnPositionDetails.getPosition()

          act = await closePositionV3({
            isDPMProxy: false,
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

        it(`Should have closed the position`, () => {
          expect(act.closeTxStatus).to.be.true
        })

        it('Should payback all debt', () => {
          expectToBeEqual(
            new BigNumber(act.protocolData.userAccountData.totalDebtBase.toString()),
            ZERO,
          )
        })

        it(`Should withdraw all collateral tokens from aave`, () => {
          //due to quirks of how stEth works there might be 1 wei left in aave
          expectToBe(
            new BigNumber(act.protocolData.collateral.currentATokenBalance.toString()),
            'lte',
            ONE,
          )
        })

        it('Should collect fee', async () => {
          const actualFeesDelta = act.feeWalletBalanceAfterClosing.minus(
            act.feeWalletBalanceBeforeClosing,
          )

          expectToBe(
            act.simulation.swap.tokenFee,
            'gte',
            actualFeesDelta,
            EXPECT_LARGER_SIMULATED_FEE,
          )
        })

        it('should not be any token left on proxy', async () => {
          const proxyDebtBalance = await balanceOf(act.debtTokenAddress, proxy, {
            config,
            isFormatted: true,
          })
          const proxyCollateralBalance = await balanceOf(act.collateralTokenAddress, proxy, {
            config,
            isFormatted: true,
          })

          expectToBeEqual(proxyDebtBalance, ZERO)
          expectToBeEqual(proxyCollateralBalance, ZERO)
        })
      })
      describe('Using DPM Proxy', async () => {
        supportedStrategies
          .filter(s => s.name !== 'WSTETH/ETH Earn')
          .forEach(({ name: strategy }) => {
            let position: IPosition
            let system: DeployedSystemInfo
            let proxy: string
            let debtToken: TokenDetails
            let collateralToken: TokenDetails
            let config: RuntimeConfig
            let act: Unbox<ReturnType<typeof closePositionV3>>

            before(async function () {
              const { dpmPositions, config: _config, system: _system } = fixture
              const positionDetails = dpmPositions[strategy]
              if (!positionDetails) {
                console.log(`No position for ${strategy} strategy`)
                this.skip()
              }
              const {
                debtToken: _debtToken,
                collateralToken: _collateralToken,
                proxy: _proxy,
              } = positionDetails
              system = _system
              proxy = _proxy
              debtToken = _debtToken
              collateralToken = _collateralToken
              position = await positionDetails.getPosition()
              config = _config

              act = await closePositionV3({
                position,
                isDPMProxy: true,
                collateralToken,
                debtToken,
                proxy,
                /* Chosen to mirror slippage in fixture */
                slippage: UNISWAP_TEST_SLIPPAGE,
                getSwapData: oneInchCallMock(ONE.div(positionDetails.__mockPrice), {
                  from: collateralToken.precision,
                  to: debtToken.precision,
                }),
                userAddress: config.address,
                config,
                system,
              })
            })

            it(`Should have closed the position: ${strategy}`, () => {
              expect(act.closeTxStatus).to.be.true
            })

            it('Should payback all debt', () => {
              expectToBeEqual(
                new BigNumber(act.protocolData.userAccountData.totalDebtBase.toString()),
                ZERO,
              )
            })

            it(`Should withdraw all collateral tokens from aave`, () => {
              //due to quirks of how stEth works there might be 1 wei left in aave
              expectToBe(
                new BigNumber(act.protocolData.collateral.currentATokenBalance.toString()),
                'lte',
                ONE,
              )
            })

            it('Should collect fee', async () => {
              const actualFeesDelta = act.feeWalletBalanceAfterClosing.minus(
                act.feeWalletBalanceBeforeClosing,
              )

              expectToBe(
                act.simulation.swap.tokenFee,
                'gte',
                actualFeesDelta,
                EXPECT_LARGER_SIMULATED_FEE,
              )
            })

            it('should not be any token left on proxy', async () => {
              const proxyDebtBalance = await balanceOf(act.debtTokenAddress, proxy, {
                config,
                isFormatted: true,
              })
              const proxyCollateralBalance = await balanceOf(act.collateralTokenAddress, proxy, {
                config,
                isFormatted: true,
              })

              expectToBeEqual(proxyDebtBalance, ZERO)
              expectToBeEqual(proxyCollateralBalance, ZERO)
            })
          })
      })
    })
  })
})
