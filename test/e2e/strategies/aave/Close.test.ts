import AAVELendingPoolABI from '@abi/external/aave/v2/lendingPool.json'
import aavePriceOracleABI from '@abi/external/aave/v2/priceOracle.json'
import AAVEDataProviderABI from '@abi/external/aave/v2/protocolDataProvider.json'
import aaveOracleABI from '@abi/external/aave/v3/aaveOracle.json'
import AAVEProtocolDataProviderABI from '@abi/external/aave/v3/aaveProtocolDataProvider.json'
import AAVEPoolABI from '@abi/external/aave/v3/pool.json'
import { executeThroughProxy } from '@helpers/deploy'
import { Network } from '@helpers/network'
import { oneInchCallMock } from '@helpers/swap/OneInchCallMock'
import { RuntimeConfig, Unbox } from '@helpers/types/common'
import { balanceOf } from '@helpers/utils'
import {
  AAVETokens,
  AAVEV3StrategyAddresses,
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

import { DeployedSystem20, DeployedSystem20Return } from '../../../../scripts/common/deploy-system'
import { EMPTY_ADDRESS } from '../../../constants'
import {
  getSupportedStrategies,
  getSystemWithAavePositions,
  SystemWithAAVEPositions,
} from '../../../fixtures'
import { UNISWAP_TEST_SLIPPAGE } from '../../../fixtures/factories/common'
import {
  getSupportedAaveV3Strategies,
  getSystemWithAaveV3Positions,
} from '../../../fixtures/system/getSystemWithAaveV3Positions'
import { TokenDetails } from '../../../fixtures/types/positionDetails'
import { SystemWithAAVEV3Positions } from '../../../fixtures/types/systemWithAAVEPositions'
import {
  addressesByNetwork,
  isMainnetByNetwork,
  isOptimismByNetwork,
} from '../../../test-utils/addresses'
import { expectToBe, expectToBeEqual } from '../../../utils'

const networkFork = process.env.NETWORK_FORK as Network
const EXPECT_LARGER_SIMULATED_FEE = 'Expect simulated fee to be more than the user actual pays'

describe(`Strategy | AAVE | Close Position`, async () => {
  describe('Using AAVE V2', async function () {
    let fixture: SystemWithAAVEPositions

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
      system: DeployedSystem20Return
    }) {
      const addresses = {
        ...addressesByNetwork(Network.MAINNET),
        operationExecutor: system.OperationExecutor.contract.address,
      }

      const tokenAddresses: Record<AAVETokens, string> = {
        WETH: addresses.WETH,
        ETH: addresses.WETH,
        STETH: addresses.STETH,
        WSTETH: addresses.WSTETH,
        USDC: addresses.USDC,
        WBTC: addresses.WBTC,
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

    describe('Close position: With Uniswap', () => {
      before(async function () {
        if (isOptimismByNetwork(networkFork)) {
          this.skip()
        }
        fixture = await loadFixture(getSystemWithAavePositions({ use1inch: false }))
      })

      describe('Using DSProxy', () => {
        let position: IPosition
        let proxy: string
        let system: DeployedSystem20Return
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
            let system: DeployedSystem20Return
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

    const supportedStrategies = getSupportedAaveV3Strategies()

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
      dsSystem: DeployedSystem20
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
      args: ClosePositionV3Args & { network: Network.OPT_MAINNET },
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

    describe('Close position: With Uniswap', () => {
      before(async function () {
        if (isOptimismByNetwork(networkFork)) this.skip()
        fixture = await loadFixture(
          getSystemWithAaveV3Positions({
            use1inch: false,
            network: networkFork,
            systemConfigPath: `./test-configs/${networkFork}.conf.ts`,
            configExtentionPaths: [`./test-configs/uSwap.conf.ts`],
          }),
        )
      })

      describe('Using DSProxy', () => {
        let position: IPosition
        let proxy: string
        let dsSystem: DeployedSystem20
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
            let dsSystem: DeployedSystem20
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
    describe('Close position: With 1inch', () => {
      before(async () => {
        fixture = await loadFixture(
          getSystemWithAaveV3Positions({
            use1inch: true,
            network: networkFork,
            systemConfigPath: `./test-configs/${networkFork}.conf.ts`,
            configExtentionPaths: [`./test-configs/swap.conf.ts`],
          }),
        )
      })

      describe('Using DSProxy', () => {
        let position: IPosition
        let proxy: string
        let dsSystem: DeployedSystem20
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
              network: Network.OPT_MAINNET,
            })
          }

          if (!isMainnet && !isOptimism) throw new Error('Unsupported network')
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
          // .filter(s => s.name !== 'WSTETH/ETH Earn')
          .forEach(({ name: strategy }) => {
            let position: IPosition
            let dsSystem: DeployedSystem20
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
              console.log('POSITION BEFORE CLOSE')
              console.log('DEBT:', position.debt.toString())
              console.log('COLL:', position.collateral.toString())

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
                  network: Network.OPT_MAINNET,
                })
              }

              if (!isMainnet && !isOptimism) throw new Error('Unsupported network')
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
