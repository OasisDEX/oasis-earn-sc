import AAVELendingPoolABI from '@abis/external/protocols/aave/v2/lendingPool.json'
import aavePriceOracleABI from '@abis/external/protocols/aave/v2/priceOracle.json'
import AAVEDataProviderABI from '@abis/external/protocols/aave/v2/protocolDataProvider.json'
import aaveOracleABI from '@abis/external/protocols/aave/v3/aaveOracle.json'
import AAVEProtocolDataProviderABI from '@abis/external/protocols/aave/v3/aaveProtocolDataProvider.json'
import AAVEPoolABI from '@abis/external/protocols/aave/v3/pool.json'
import { DeployedSystem, System } from '@deploy-configurations/types/deployed-system'
import { Network } from '@deploy-configurations/types/network'
import { EMPTY_ADDRESS, ONE, ZERO } from '@dma-common/constants'
import { addressesByNetwork, expect, oneInchCallMock } from '@dma-common/test-utils'
import { RuntimeConfig, Unbox } from '@dma-common/types/common'
import { balanceOf } from '@dma-common/utils/balances'
import { amountFromWei, isMainnetByNetwork, isOptimismByNetwork } from '@dma-common/utils/common'
import { executeThroughProxy } from '@dma-common/utils/execute'
import {
  getSupportedStrategies,
  SystemWithAavePositions,
  systemWithAavePositions,
} from '@dma-contracts/test/fixtures'
import { UNISWAP_TEST_SLIPPAGE } from '@dma-contracts/test/fixtures/factories/common'
import {
  getSupportedAaveV3Strategies,
  systemWithAaveV3Positions,
} from '@dma-contracts/test/fixtures/system/system-with-aave-v3-positions'
import { SystemWithAAVEV3Positions } from '@dma-contracts/test/fixtures/types/env'
import { TokenDetails } from '@dma-contracts/test/fixtures/types/position-details'
import { AAVETokens, AAVEV3StrategyAddresses, strategies } from '@dma-library'
import { PositionType } from '@dma-library/types'
import { acceptedFeeToken } from '@dma-library/utils/swap'
import { IPosition } from '@domain'
import BigNumber from 'bignumber.js'
import { loadFixture } from 'ethereum-waffle'
import { Contract, ethers } from 'ethers'

const networkFork = process.env.NETWORK_FORK as Network
const EXPECT_LARGER_SIMULATED_FEE = 'Expect simulated fee to be more than the user actual pays'

describe.skip(`Strategy | AAVE | Close Position | E2E`, async () => {
  describe.skip('Using AAVE V2', async function () {
    let fixture: SystemWithAavePositions

    const supportedStrategies = getSupportedStrategies()

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
      positionType,
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
      system: DeployedSystem
      positionType: PositionType
    }) {
      const addresses = {
        ...addressesByNetwork(networkFork),
        operationExecutor: system.OperationExecutor.contract.address,
      }

      const tokenAddresses: Record<AAVETokens, string> = {
        WETH: addresses.WETH,
        ETH: addresses.WETH,
        STETH: addresses.STETH,
        WSTETH: addresses.WSTETH,
        USDC: addresses.USDC,
        WBTC: addresses.WBTC,
        DAI: addresses.DAI,
        CBETH: addresses.CBETH,
        RETH: addresses.RETH,
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
        addresses.feeRecipient,
        { config },
      )

      const provider = config.provider
      const signer = config.signer

      const lendingPool = new Contract(addresses.lendingPool, AAVELendingPoolABI, provider)

      const protocolDataProvider = new Contract(
        addresses.protocolDataProvider,
        AAVEDataProviderABI,
        provider,
      )

      const priceOracle = new ethers.Contract(addresses.priceOracle, aavePriceOracleABI, provider)

      const closePosition = await strategies.aave.v2.close(
        {
          slippage,
          debtToken: { symbol: debtToken.symbol, precision: debtToken.precision },
          collateralToken: {
            symbol: collateralToken.symbol,
            precision: collateralToken.precision,
          },
          positionType,
        },
        {
          isDPMProxy,
          addresses,
          provider,
          currentPosition: position,
          getSwapData,
          proxy,
          user: userAddress,
          network: networkFork,
        },
      )

      const [closeTxStatus, closeTx] = await executeThroughProxy(
        proxy,
        {
          address: system.OperationExecutor.contract.address,
          calldata: system.OperationExecutor.contract.interface.encodeFunctionData('executeOp', [
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
        addresses.feeRecipient,
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

    describe.skip('Close position: With Uniswap', () => {
      before(async function () {
        if (isOptimismByNetwork(networkFork)) {
          this.skip()
        }
        fixture = await loadFixture(
          systemWithAavePositions({
            use1inch: false,
            configExtensionPaths: [`test/uSwap.conf.ts`],
            network: networkFork,
          }),
        )
      })

      describe.skip('Using DSProxy', () => {
        let position: IPosition
        let proxy: string
        let system: DeployedSystem
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
            system: system,
            positionType: dsProxyStEthEthEarnPositionDetails.__positionType,
          })
        })

        it('Should have closed the position', () => {
          expect(act.closeTxStatus).to.be.true
        })

        it('Should payback all debt', () => {
          expect.toBeEqual(
            new BigNumber(act.protocolData.userAccountData.totalDebtETH.toString()),
            ZERO,
          )
        })

        it(`Should withdraw all collateral tokens from aave`, () => {
          //due to quirks of how stEth works there might be 1 wei left in aave
          expect.toBe(
            new BigNumber(act.protocolData.collateral.currentATokenBalance.toString()),
            'lte',
            ONE,
          )
        })

        it('Should collect fee', async () => {
          const actualFeesDelta = act.feeWalletBalanceAfterClosing.minus(
            act.feeWalletBalanceBeforeClosing,
          )

          expect.toBe(
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

          expect.toBeEqual(proxyDebtBalance, ZERO)
          expect.toBeEqual(proxyCollateralBalance, ZERO)
        })
      })
      describe.skip('Using DPM Proxy', async () => {
        supportedStrategies
          .filter(s => s.name !== 'STETH/USDC Multiply')
          .forEach(({ name: strategy }) => {
            let position: IPosition
            let system: DeployedSystem
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
                positionType: positionDetails.__positionType,
              })
            })

            it(`Should have closed the position: ${strategy}`, () => {
              expect(act.closeTxStatus).to.be.true
            })

            it('Should payback all debt', () => {
              expect.toBeEqual(
                new BigNumber(act.protocolData.userAccountData.totalDebtETH.toString()),
                ZERO,
              )
            })

            it(`Should withdraw all collateral tokens from aave`, () => {
              //due to quirks of how stEth works there might be 1 wei left in aave
              expect.toBe(
                new BigNumber(act.protocolData.collateral.currentATokenBalance.toString()),
                'lte',
                ONE,
              )
            })

            it('Should collect fee', async () => {
              const actualFeesDelta = act.feeWalletBalanceAfterClosing.minus(
                act.feeWalletBalanceBeforeClosing,
              )

              expect.toBe(
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

              expect.toBeEqual(proxyDebtBalance, ZERO)
              expect.toBeEqual(proxyCollateralBalance, ZERO)
            })
          })
      })
    })
  })
  describe.skip('Using AAVE V3', async function () {
    let fixture: SystemWithAAVEV3Positions

    const supportedStrategies = getSupportedAaveV3Strategies(networkFork)

    type ClosePositionV3Args = {
      isDPMProxy: boolean
      position: IPosition
      collateralToken: TokenDetails
      debtToken: TokenDetails
      proxy: string
      userAddress: string
      getSwapData: any
      slippage: BigNumber
      config: RuntimeConfig
      dsSystem: System
      positionType: PositionType
      network: Network
    }

    async function closePositionV3OnMainnet(
      args: ClosePositionV3Args & { network: Network.MAINNET },
    ) {
      const addresses = {
        ...addressesByNetwork(args.network),
        operationExecutor: args.dsSystem.system.OperationExecutor.contract.address,
      }

      // So, we need addresses to be narrowed and passed to an inner function that does logic
      const tokenAddresses: Record<AAVETokens, string> = {
        WETH: addresses.WETH,
        ETH: addresses.WETH,
        STETH: addresses.STETH,
        WSTETH: addresses.WSTETH,
        USDC: addresses.USDC,
        WBTC: addresses.WBTC,
        RETH: addresses.RETH,
        CBETH: addresses.CBETH,
        DAI: addresses.DAI,
      }
      const collateralTokenAddress = tokenAddresses[args.collateralToken.symbol]
      const debtTokenAddress = tokenAddresses[args.debtToken.symbol]
      return closePositionV3({
        ...args,
        addresses,
        collateralTokenAddress,
        debtTokenAddress,
      })
    }

    async function closePositionV3OnOptimism(
      args: ClosePositionV3Args & { network: Network.OPTIMISM },
    ) {
      const addresses = {
        ...addressesByNetwork(args.network),
        operationExecutor: args.dsSystem.system.OperationExecutor.contract.address,
      }

      // So, we need addresses to be narrowed and passed to an inner function that does logic
      const tokenAddresses: Record<AAVETokens, string> = {
        WETH: addresses.WETH,
        ETH: addresses.WETH,
        WSTETH: addresses.WSTETH,
        USDC: addresses.USDC,
        WBTC: addresses.WBTC,
        STETH: EMPTY_ADDRESS,
        DAI: addresses.DAI,
        RETH: addresses.RETH,
        CBETH: addresses.CBETH,
      }
      const collateralTokenAddress = tokenAddresses[args.collateralToken.symbol]
      const debtTokenAddress = tokenAddresses[args.debtToken.symbol]

      return closePositionV3({
        ...args,
        addresses,
        collateralTokenAddress,
        debtTokenAddress,
      })
    }

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
      dsSystem,
      addresses,
      collateralTokenAddress,
      debtTokenAddress,
      positionType,
    }: ClosePositionV3Args & {
      addresses: AAVEV3StrategyAddresses
      collateralTokenAddress: string
      debtTokenAddress: string
    }) {
      const isFeeFromDebtToken =
        acceptedFeeToken({
          fromToken: collateralToken.symbol,
          toToken: debtToken.symbol,
        }) === 'targetToken'

      const feeRecipient = dsSystem.config.common.FeeRecipient.address
      if (!feeRecipient) throw new Error('Fee recipient is not set')
      const feeWalletBalanceBeforeClosing = await balanceOf(
        isFeeFromDebtToken ? debtToken.address : collateralToken.address,
        feeRecipient,
        { config },
      )

      const provider = config.provider
      const signer = config.signer

      const pool = new Contract(addresses.pool, AAVEPoolABI, provider)

      const protocolDataProvider = new Contract(
        addresses.poolDataProvider,
        AAVEProtocolDataProviderABI,
        provider,
      )

      const priceOracle = new ethers.Contract(addresses.aaveOracle, aaveOracleABI, provider)

      const closePosition = await strategies.aave.v3.close(
        {
          slippage,
          debtToken: { symbol: debtToken.symbol, precision: debtToken.precision },
          collateralToken: {
            symbol: collateralToken.symbol,
            precision: collateralToken.precision,
          },
          positionType,
        },
        {
          isDPMProxy,
          addresses,
          provider,
          currentPosition: position,
          getSwapData,
          proxy,
          user: userAddress,
          network: networkFork,
        },
      )

      const [closeTxStatus, closeTx] = await executeThroughProxy(
        proxy,
        {
          address: dsSystem.system.OperationExecutor.contract.address,
          calldata: dsSystem.system.OperationExecutor.contract.interface.encodeFunctionData(
            'executeOp',
            [closePosition.transaction.calls, closePosition.transaction.operationName],
          ),
        },
        signer,
        '0',
      )

      if (!closeTxStatus) throw new Error('Close position failed')

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
        feeRecipient,
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

    describe.skip('Close position: With Uniswap', () => {
      before(async function () {
        if (isOptimismByNetwork(networkFork)) this.skip()
        fixture = await loadFixture(
          systemWithAaveV3Positions({
            use1inch: false,
            network: networkFork,
            systemConfigPath: `test/${networkFork}.conf.ts`,
            configExtensionPaths: [`test/uSwap.conf.ts`],
          }),
        )
      })

      describe.skip('Using DSProxy', () => {
        let position: IPosition
        let proxy: string
        let dsSystem: System
        let debtToken: TokenDetails
        let collateralToken: TokenDetails
        let config: RuntimeConfig
        let act: Unbox<ReturnType<typeof closePositionV3>>

        before(async () => {
          const {
            config: _config,
            dsSystem: _dsSystem,
            dsProxyPosition: dsProxyStEthEthEarnPositionDetails,
          } = fixture

          const {
            debtToken: _debtToken,
            collateralToken: _collateralToken,
            proxy: _proxy,
          } = dsProxyStEthEthEarnPositionDetails
          dsSystem = _dsSystem
          config = _config
          proxy = _proxy
          debtToken = _debtToken
          collateralToken = _collateralToken
          position = await dsProxyStEthEthEarnPositionDetails.getPosition()

          // Uniswap V3 Close tests only available on Mainnet for now
          act = await closePositionV3OnMainnet({
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
            dsSystem,
            network: Network.MAINNET,
            positionType: dsProxyStEthEthEarnPositionDetails.__positionType,
          })
        })

        it(`Should have closed the position`, () => {
          expect(act.closeTxStatus).to.be.true
        })

        it('Should payback all debt', () => {
          expect.toBeEqual(
            new BigNumber(act.protocolData.userAccountData.totalDebtBase.toString()),
            ZERO,
          )
        })

        it(`Should withdraw all collateral tokens from aave`, () => {
          //due to quirks of how stEth works there might be 1 wei left in aave
          expect.toBe(
            new BigNumber(act.protocolData.collateral.currentATokenBalance.toString()),
            'lte',
            ONE,
          )
        })

        it('Should collect fee', async () => {
          const actualFeesDelta = act.feeWalletBalanceAfterClosing.minus(
            act.feeWalletBalanceBeforeClosing,
          )

          expect.toBe(
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

          expect.toBeEqual(proxyDebtBalance, ZERO)
          expect.toBeEqual(proxyCollateralBalance, ZERO)
        })
      })
      describe.skip('Using DPM Proxy', async () => {
        supportedStrategies
          .filter(s => s.name !== 'WSTETH/ETH Earn')
          .forEach(({ name: strategy }) => {
            let position: IPosition
            let dsSystem: System
            let proxy: string
            let debtToken: TokenDetails
            let collateralToken: TokenDetails
            let config: RuntimeConfig
            let act: Unbox<ReturnType<typeof closePositionV3>>

            before(async function () {
              const { dpmPositions, config: _config, dsSystem: _dsSystem } = fixture
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
              dsSystem = _dsSystem
              proxy = _proxy
              debtToken = _debtToken
              collateralToken = _collateralToken
              position = await positionDetails.getPosition()
              config = _config

              // Uniswap V3 Close tests only available on Mainnet for now
              act = await closePositionV3OnMainnet({
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
                dsSystem,
                network: Network.MAINNET,
                positionType: positionDetails.__positionType,
              })
            })

            it(`Should have closed the position: ${strategy}`, () => {
              expect(act.closeTxStatus).to.be.true
            })

            it('Should payback all debt', () => {
              expect.toBeEqual(
                new BigNumber(act.protocolData.userAccountData.totalDebtBase.toString()),
                ZERO,
              )
            })

            it(`Should withdraw all collateral tokens from aave`, () => {
              //due to quirks of how stEth works there might be 1 wei left in aave
              expect.toBe(
                new BigNumber(act.protocolData.collateral.currentATokenBalance.toString()),
                'lte',
                ONE,
              )
            })

            it('Should collect fee', async () => {
              const actualFeesDelta = act.feeWalletBalanceAfterClosing.minus(
                act.feeWalletBalanceBeforeClosing,
              )

              expect.toBe(
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

              expect.toBeEqual(proxyDebtBalance, ZERO)
              expect.toBeEqual(proxyCollateralBalance, ZERO)
            })
          })
      })
    })
    describe.skip('Close position: With 1inch', () => {
      before(async () => {
        fixture = await loadFixture(
          systemWithAaveV3Positions({
            use1inch: true,
            network: networkFork,
            systemConfigPath: `test/${networkFork}.conf.ts`,
            configExtensionPaths: [`test/swap.conf.ts`],
          }),
        )
      })

      describe.skip('Using DSProxy', () => {
        let position: IPosition
        let proxy: string
        let dsSystem: System
        let debtToken: TokenDetails
        let collateralToken: TokenDetails
        let config: RuntimeConfig
        let act: Unbox<ReturnType<typeof closePositionV3>>

        before(async () => {
          const {
            config: _config,
            dsSystem: _dsSystem,
            dsProxyPosition: dsProxyStEthEthEarnPositionDetails,
          } = fixture
          const {
            debtToken: _debtToken,
            collateralToken: _collateralToken,
            proxy: _proxy,
          } = dsProxyStEthEthEarnPositionDetails
          dsSystem = _dsSystem
          config = _config
          proxy = _proxy
          debtToken = _debtToken
          collateralToken = _collateralToken
          position = await dsProxyStEthEthEarnPositionDetails.getPosition()

          const isMainnet = isMainnetByNetwork(networkFork)
          const isOptimism = isOptimismByNetwork(networkFork)
          if (isMainnet) {
            act = await closePositionV3OnMainnet({
              isDPMProxy: false,
              position,
              collateralToken,
              debtToken,
              proxy,
              slippage: UNISWAP_TEST_SLIPPAGE,
              getSwapData: fixture.strategiesDependencies.getSwapData(
                fixture.system.Swap.contract.address,
              ),
              userAddress: config.address,
              config,
              dsSystem,
              network: Network.MAINNET,
              positionType: dsProxyStEthEthEarnPositionDetails.__positionType,
            })
          }
          if (isOptimism) {
            act = await closePositionV3OnOptimism({
              isDPMProxy: false,
              position,
              collateralToken,
              debtToken,
              proxy,
              slippage: UNISWAP_TEST_SLIPPAGE,
              getSwapData: fixture.strategiesDependencies.getSwapData(
                fixture.system.Swap.contract.address,
              ),
              userAddress: config.address,
              config,
              dsSystem,
              network: Network.OPTIMISM,
              positionType: dsProxyStEthEthEarnPositionDetails.__positionType,
            })
          }

          if (!isMainnet && !isOptimism) throw new Error('Unsupported network')
        })

        it(`Should have closed the position`, () => {
          expect(act.closeTxStatus).to.be.true
        })

        it('Should payback all debt', () => {
          expect.toBeEqual(
            new BigNumber(act.protocolData.userAccountData.totalDebtBase.toString()),
            ZERO,
          )
        })

        it(`Should withdraw all collateral tokens from aave`, () => {
          //due to quirks of how stEth works there might be 1 wei left in aave
          expect.toBe(
            new BigNumber(act.protocolData.collateral.currentATokenBalance.toString()),
            'lte',
            ONE,
          )
        })

        it('Should collect fee', async () => {
          const actualFeesDelta = act.feeWalletBalanceAfterClosing.minus(
            act.feeWalletBalanceBeforeClosing,
          )

          expect.toBe(
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

          expect.toBeEqual(proxyDebtBalance, ZERO)
          expect.toBeEqual(proxyCollateralBalance, ZERO)
        })
      })
      describe.skip('Using DPM Proxy', async () => {
        supportedStrategies.forEach(({ name: strategy }) => {
          let position: IPosition
          let dsSystem: System
          let proxy: string
          let debtToken: TokenDetails
          let collateralToken: TokenDetails
          let config: RuntimeConfig
          let act: Unbox<ReturnType<typeof closePositionV3>>

          before(async function () {
            const { dpmPositions, config: _config, dsSystem: _dsSystem } = fixture
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
            dsSystem = _dsSystem
            proxy = _proxy
            debtToken = _debtToken
            collateralToken = _collateralToken
            position = await positionDetails.getPosition()
            config = _config

            const isMainnet = isMainnetByNetwork(networkFork)
            const isOptimism = isOptimismByNetwork(networkFork)
            if (isMainnet) {
              act = await closePositionV3OnMainnet({
                isDPMProxy: true,
                position,
                collateralToken,
                debtToken,
                proxy,
                slippage: UNISWAP_TEST_SLIPPAGE,
                getSwapData: fixture.strategiesDependencies.getSwapData(
                  fixture.system.Swap.contract.address,
                ),
                userAddress: config.address,
                config,
                dsSystem,
                network: Network.MAINNET,
                positionType: positionDetails.__positionType,
              })
            }
            if (isOptimism) {
              act = await closePositionV3OnOptimism({
                isDPMProxy: true,
                position,
                collateralToken,
                debtToken,
                proxy,
                slippage: UNISWAP_TEST_SLIPPAGE,
                getSwapData: fixture.strategiesDependencies.getSwapData(
                  fixture.system.Swap.contract.address,
                ),
                userAddress: config.address,
                config,
                dsSystem,
                network: Network.OPTIMISM,
                positionType: positionDetails.__positionType,
              })
            }

            if (!isMainnet && !isOptimism) throw new Error('Unsupported network')
          })

          it(`Should have closed the position: ${strategy}`, () => {
            expect(act.closeTxStatus).to.be.true
          })

          it('Should payback all debt', () => {
            expect.toBeEqual(
              new BigNumber(act.protocolData.userAccountData.totalDebtBase.toString()),
              ZERO,
            )
          })

          it(`Should withdraw all collateral tokens from aave`, () => {
            //due to quirks of how stEth works there might be 1 wei left in aave
            expect.toBe(
              new BigNumber(act.protocolData.collateral.currentATokenBalance.toString()),
              'lte',
              ONE,
            )
          })

          it('Should collect fee', async () => {
            const actualFeesDelta = act.feeWalletBalanceAfterClosing.minus(
              act.feeWalletBalanceBeforeClosing,
            )

            expect.toBe(
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

            expect.toBeEqual(proxyDebtBalance, ZERO)
            expect.toBeEqual(proxyCollateralBalance, ZERO)
          })
        })
      })
    })
  })
})
