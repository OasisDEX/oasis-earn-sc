import AAVELendingPoolABI from '@abis/external/protocols/aave/v2/lendingPool.json'
import aavePriceOracleABI from '@abis/external/protocols/aave/v2/priceOracle.json'
import AAVEDataProviderABI from '@abis/external/protocols/aave/v2/protocolDataProvider.json'
import { ADDRESSES } from '@deploy-configurations/addresses'
import { ADDRESS_ZERO } from '@deploy-configurations/constants'
import { DeployedSystem, System } from '@deploy-configurations/types/deployed-system'
import { Network } from '@deploy-configurations/types/network'
import { EMPTY_ADDRESS } from '@dma-common/constants'
import {
  addressesByNetwork,
  advanceBlocks,
  advanceTime,
  expect,
  oneInchCallMock,
} from '@dma-common/test-utils'
import { RuntimeConfig, Unbox } from '@dma-common/types/common'
import { balanceOf } from '@dma-common/utils/balances'
import { amountFromWei, isMainnetByNetwork, isOptimismByNetwork } from '@dma-common/utils/common'
import { executeThroughProxy } from '@dma-common/utils/execute'
import { BLOCKS_TO_ADVANCE, TIME_TO_ADVANCE } from '@dma-contracts/test/config'
import {
  getSupportedStrategies,
  SystemWithAavePositions,
  systemWithAavePositions,
} from '@dma-contracts/test/fixtures'
import { SLIPPAGE, UNISWAP_TEST_SLIPPAGE } from '@dma-contracts/test/fixtures/factories/common'
import {
  getSupportedAaveV3Strategies,
  systemWithAaveV3Positions,
} from '@dma-contracts/test/fixtures/system/system-with-aave-v3-positions'
import { SystemWithAAVEV3Positions } from '@dma-contracts/test/fixtures/types/env'
import { TokenDetails } from '@dma-contracts/test/fixtures/types/position-details'
import { AAVETokens, AAVEV3StrategyAddresses, strategies } from '@dma-library'
import { PositionType } from '@dma-library/types'
import { acceptedFeeToken } from '@dma-library/utils/swap'
import { IPosition, IRiskRatio, RiskRatio } from '@domain'
import BigNumber from 'bignumber.js'
import { loadFixture } from 'ethereum-waffle'
import { Contract, ethers } from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const networkFork = process.env.NETWORK_FORK as Network
const EXPECT_LARGER_SIMULATED_FEE = 'Expect simulated fee to be more than the user actual pays'

describe.skip('Strategy | AAVE | Adjust Position | E2E', async function () {
  describe.skip('Using AAVE V2', async function () {
    let fixture: SystemWithAavePositions

    const networkAddresses = addressesByNetwork(networkFork)

    const supportedStrategies = getSupportedStrategies()

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
      hre,
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
      system: DeployedSystem
      hre: HardhatRuntimeEnvironment
    }) {
      // Advance blocks and time before retrying
      await advanceBlocks(hre.ethers, BLOCKS_TO_ADVANCE)
      await advanceTime(hre.ethers, TIME_TO_ADVANCE)

      const addresses = {
        ...networkAddresses,
        operationExecutor: system.OperationExecutor.contract.address,
      }
      const tokenAddresses: Record<AAVETokens, string> = {
        WETH: networkAddresses.WETH,
        ETH: networkAddresses.WETH,
        STETH: networkAddresses.STETH,
        WSTETH: networkAddresses.WSTETH,
        USDC: networkAddresses.USDC,
        WBTC: networkAddresses.WBTC,
        DAI: networkAddresses.DAI,
        CBETH: networkAddresses.CBETH,
        RETH: networkAddresses.RETH,
      }

      const collateralTokenAddress = tokenAddresses[collateralToken.symbol as AAVETokens]
      const debtTokenAddress = tokenAddresses[debtToken.symbol as AAVETokens]
      const isIncreasingRisk = isRiskIncreasing(position.riskRatio, targetMultiple)
      const fromToken = isIncreasingRisk ? debtToken : collateralToken
      const toToken = isIncreasingRisk ? collateralToken : debtToken

      const isFeeFromSourceToken =
        acceptedFeeToken({
          fromToken: fromToken.symbol,
          toToken: toToken.symbol,
        }) === 'sourceToken'
      const isFeeFromDebtToken = isIncreasingRisk ? isFeeFromSourceToken : !isFeeFromSourceToken

      const feeWalletBalanceBeforeAdjust = await balanceOf(
        isFeeFromDebtToken ? debtToken.address : collateralToken.address,
        ADDRESSES[Network.MAINNET].common.FeeRecipient,
        { config },
      )

      const provider = config.provider
      const signer = config.signer

      const lendingPool = new Contract(
        ADDRESSES[Network.MAINNET].aave.v2.LendingPool,
        AAVELendingPoolABI,
        provider,
      )

      const protocolDataProvider = new Contract(
        ADDRESSES[Network.MAINNET].aave.v2.ProtocolDataProvider,
        AAVEDataProviderABI,
        provider,
      )

      const priceOracle = new ethers.Contract(
        ADDRESSES[Network.MAINNET].aave.v2.PriceOracle,
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
          network: networkFork,
        },
      )

      const [txStatus, tx] = await executeThroughProxy(
        proxy,
        {
          address: system.OperationExecutor.contract.address,
          calldata: system.OperationExecutor.contract.interface.encodeFunctionData('executeOp', [
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
        ADDRESSES[Network.MAINNET].common.FeeRecipient,
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

    describe.skip('Adjust Risk Up: using Uniswap', async function () {
      before(async function () {
        if (isOptimismByNetwork(networkFork)) {
          this.skip()
        }
        const _fixture = await loadFixture(
          systemWithAavePositions({
            use1inch: false,
            configExtensionPaths: [`test/uSwap.conf.ts`],
            network: networkFork,
          }),
        )
        if (!_fixture) throw new Error('Failed to load fixture')
        fixture = _fixture
      })
      describe.skip('Using DSProxy', () => {
        let act: Unbox<ReturnType<typeof adjustPositionV2>>

        before(async () => {
          const {
            hre,
            config,
            system,
            dsProxyPosition: dsProxyStEthEthEarnPositionDetails,
          } = fixture
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
            hre,
          })
        })
        it('Adjust TX should pass', () => {
          expect(act.txStatus).to.be.true
        })
        it('should draw debt according to multiple', async () => {
          expect.toBe(
            act.adjustedPosition.debt.amount.toString(),
            'gte',
            act.simulation.position.debt.amount.toString(),
          )
        })
        it('should collect fee', async () => {
          const actualFeesDelta = act.feeWalletBalanceAfterAdjust.minus(
            act.feeWalletBalanceBeforeAdjust,
          )

          expect.toBe(
            act.simulation.swap.tokenFee,
            'gte',
            actualFeesDelta,
            EXPECT_LARGER_SIMULATED_FEE,
          )
        })
      })
      describe.skip('Using DPM Proxy', () => {
        supportedStrategies.forEach(({ name: strategy }) => {
          let act: Unbox<ReturnType<typeof adjustPositionV2>>

          before(async function () {
            const { hre, system, config, dpmPositions } = fixture

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
              hre,
            })
          })
          it('Adjust TX should pass', () => {
            expect(act.txStatus).to.be.true
          })
          it('should draw debt according to multiple', async () => {
            expect.toBe(
              act.adjustedPosition.debt.amount.toString(),
              'gte',
              act.simulation.position.debt.amount.toString(),
            )
          })
          it('should collect fee', async () => {
            const actualFeesDelta = act.feeWalletBalanceAfterAdjust.minus(
              act.feeWalletBalanceBeforeAdjust,
            )

            expect.toBe(
              act.simulation.swap.tokenFee,
              'gte',
              actualFeesDelta,
              EXPECT_LARGER_SIMULATED_FEE,
            )
          })
        })
      })
    })
    // No available liquidity on uniswap for some pairs when reducing risk so using 1inch
    describe.skip('Adjust Risk Down: using 1inch', async function () {
      before(async function () {
        if (isOptimismByNetwork(networkFork)) {
          this.skip()
        }
        const _fixture = await loadFixture(
          systemWithAavePositions({
            use1inch: true,
            configExtensionPaths: [`test/swap.conf.ts`],
            network: networkFork,
          }),
        )
        if (!_fixture) throw new Error('Failed to load fixture')
        fixture = _fixture
      })
      describe.skip('Using DSProxy', () => {
        let act: Unbox<ReturnType<typeof adjustPositionV2>>

        before(async () => {
          const {
            hre,
            config,
            system,
            dsProxyPosition: dsProxyStEthEthEarnPositionDetails,
          } = fixture
          const { debtToken, collateralToken, proxy } = dsProxyStEthEthEarnPositionDetails

          const position = await dsProxyStEthEthEarnPositionDetails.getPosition()
          act = await adjustPositionV2({
            isDPMProxy: false,
            targetMultiple: new RiskRatio(new BigNumber(1.3), RiskRatio.TYPE.MULITPLE),
            positionType: 'Earn',
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
            system,
            hre,
          })
        })
        it('Adjust TX should pass', () => {
          expect(act.txStatus).to.be.true
        })
        it('should payback debt according to multiple', async () => {
          // The simulation will include a higher debt figure than actual because the resulting swapped debt
          // Should be lower due to the conservative application of slippage
          expect.toBe(
            act.simulation.position.debt.amount.toString(),
            'gte',
            act.adjustedPosition.debt.amount.toString(),
          )
        })
        it('should collect fee', async () => {
          const actualFeesDelta = act.feeWalletBalanceAfterAdjust.minus(
            act.feeWalletBalanceBeforeAdjust,
          )

          expect.toBe(act.simulation.swap.tokenFee, 'gte', actualFeesDelta)
        })
      })
      describe.skip('Using DPM Proxy', () => {
        supportedStrategies
          .filter(s => s.name !== 'STETH/USDC Multiply')
          .forEach(({ name: strategy }) => {
            let act: Unbox<ReturnType<typeof adjustPositionV2>>

            before(async function () {
              const { hre, system, config, dpmPositions } = fixture

              const positionDetails = dpmPositions[strategy]
              if (!positionDetails) {
                this.skip()
              }

              const { debtToken, collateralToken, proxy } = positionDetails

              const position = await positionDetails.getPosition()
              const slippage = UNISWAP_TEST_SLIPPAGE

              act = await adjustPositionV2({
                isDPMProxy: true,
                targetMultiple: new RiskRatio(new BigNumber(1.3), RiskRatio.TYPE.MULITPLE),
                positionType: positionDetails?.__positionType,
                position,
                collateralToken,
                debtToken,
                proxy,
                slippage,
                getSwapData: fixture.strategiesDependencies.getSwapData(
                  fixture.system.Swap.contract.address,
                ),
                userAddress: config.address,
                config,
                system,
                hre,
              })
            })
            it('Adjust TX should pass', () => {
              expect(act.txStatus).to.be.true
            })
            it('should payback debt according to multiple', async () => {
              // The simulation will include a higher debt figure than actual because the resulting swapped debt
              // Should be lower due to the conservative application of slippage
              expect.toBe(
                act.simulation.position.debt.amount.toString(),
                'gte',
                act.adjustedPosition.debt.amount.toString(),
              )
            })
            it('should collect fee', async () => {
              const actualFeesDelta = act.feeWalletBalanceAfterAdjust.minus(
                act.feeWalletBalanceBeforeAdjust,
              )

              expect.toBe(
                act.simulation.swap.tokenFee,
                'gte',
                actualFeesDelta,
                EXPECT_LARGER_SIMULATED_FEE,
              )
            })
          })
      })
    })
  })
  describe.skip('Using AAVE V3', async function () {
    const supportedStrategies = getSupportedAaveV3Strategies(networkFork)

    type AdjustPositionV3Args = {
      isDPMProxy: boolean
      targetMultiple: IRiskRatio
      position: IPosition
      collateralToken: TokenDetails
      debtToken: TokenDetails
      proxy: string
      userAddress: string
      getSwapData: any
      slippage: BigNumber
      config: RuntimeConfig
      positionType: PositionType
      dsSystem: System
      hre: HardhatRuntimeEnvironment
    }

    async function adjustPositionV3OnMainnet(
      args: AdjustPositionV3Args & { network: Network.MAINNET },
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
        DAI: addresses.DAI,
        CBETH: addresses.CBETH,
        RETH: addresses.RETH,
      }
      const collateralTokenAddress = tokenAddresses[args.collateralToken.symbol]
      const debtTokenAddress = tokenAddresses[args.debtToken.symbol]
      return adjustPositionV3({
        ...args,
        addresses,
        collateralTokenAddress,
        debtTokenAddress,
      })
    }

    async function adjustPositionV3OnOptimism(
      args: AdjustPositionV3Args & { network: Network.OPTIMISM },
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
        CBETH: addresses.CBETH,
        RETH: addresses.RETH,
      }
      const collateralTokenAddress = tokenAddresses[args.collateralToken.symbol]
      const debtTokenAddress = tokenAddresses[args.debtToken.symbol]

      return adjustPositionV3({
        ...args,
        addresses,
        collateralTokenAddress,
        debtTokenAddress,
      })
    }

    async function adjustPositionV3({
      isDPMProxy,
      targetMultiple,
      position,
      collateralToken,
      debtToken,
      proxy,
      userAddress,
      getSwapData,
      addresses: addressesByNetwork,
      slippage,
      positionType,
      config,
      dsSystem,
      hre,
    }: AdjustPositionV3Args & {
      addresses: AAVEV3StrategyAddresses
      collateralTokenAddress: string
      debtTokenAddress: string
    }) {
      const addresses = {
        ...addressesByNetwork,
        operationExecutor: dsSystem.system.OperationExecutor.contract.address,
      }
      const tokenAddresses: Record<AAVETokens, string> = {
        WETH: addresses.WETH,
        ETH: addresses.WETH,
        STETH: ADDRESS_ZERO,
        WSTETH: addresses.WSTETH,
        USDC: addresses.USDC,
        WBTC: addresses.WBTC,
        DAI: addresses.DAI,
        CBETH: addresses.CBETH,
        RETH: addresses.RETH,
      }

      const collateralTokenAddress = tokenAddresses[collateralToken.symbol as AAVETokens]
      const debtTokenAddress = tokenAddresses[debtToken.symbol as AAVETokens]
      const isIncreasingRisk = isRiskIncreasing(position.riskRatio, targetMultiple)
      const fromToken = isIncreasingRisk ? debtToken : collateralToken
      const toToken = isIncreasingRisk ? collateralToken : debtToken
      const isFeeFromSourceToken =
        acceptedFeeToken({
          fromToken: fromToken.symbol,
          toToken: toToken.symbol,
        }) === 'sourceToken'
      const isFeeFromDebtToken = isIncreasingRisk ? isFeeFromSourceToken : !isFeeFromSourceToken

      const feeRecipient = dsSystem.config.common.FeeRecipient.address
      if (!feeRecipient) throw new Error('Fee recipient is not set')
      const feeWalletBalanceBeforeAdjust = await balanceOf(
        isFeeFromDebtToken ? debtToken.address : collateralToken.address,
        feeRecipient,
        { config },
      )

      const provider = config.provider
      const signer = config.signer

      const pool = new Contract(addresses.pool, AAVELendingPoolABI, provider)

      const aaveProtocolDataProvider = new Contract(
        addresses.poolDataProvider,
        AAVEDataProviderABI,
        provider,
      )

      const aaveOracle = new ethers.Contract(addresses.aaveOracle, aavePriceOracleABI, provider)

      const strategy = await strategies.aave.v3.adjust(
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
          network: networkFork,
        },
      )

      const [txStatus, tx] = await executeThroughProxy(
        proxy,
        {
          address: dsSystem.system.OperationExecutor.contract.address,
          calldata: dsSystem.system.OperationExecutor.contract.interface.encodeFunctionData(
            'executeOp',
            [strategy.transaction.calls, strategy.transaction.operationName],
          ),
        },
        signer,
        '0',
        hre,
      )

      if (!txStatus) throw new Error('Transaction failed')

      // Get data from AAVE
      const protocolDataPromises = [
        aaveProtocolDataProvider.getUserReserveData(collateralTokenAddress, proxy),
        aaveProtocolDataProvider.getUserReserveData(debtTokenAddress, proxy),
        aaveOracle
          .getAssetPrice(collateralTokenAddress)
          .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString()))),
        aaveOracle
          .getAssetPrice(debtTokenAddress)
          .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString()))),
        pool.getUserAccountData(proxy),
      ]
      const protocolData = await Promise.all(protocolDataPromises)

      const feeWalletBalanceAfterAdjust = await balanceOf(
        isFeeFromDebtToken ? debtToken.address : collateralToken.address,
        feeRecipient,
        { config },
      )

      const adjustedPosition = await strategies.aave.v3.view(
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

    // No available liquidity on uniswap for some pairs on optimism
    describe.skip('Adjust Risk Up: using 1inch', async function () {
      let env: SystemWithAAVEV3Positions
      const fixture = systemWithAaveV3Positions({
        use1inch: true,
        network: networkFork,
        systemConfigPath: `test/${networkFork}.conf.ts`,
        configExtensionPaths: [`test/swap.conf.ts`],
      })
      before(async function () {
        const _env = await loadFixture(fixture)
        if (!_env) throw new Error('Failed to set up system')
        env = _env
      })

      describe.skip('Using DSProxy', () => {
        let act: Unbox<ReturnType<typeof adjustPositionV3>>
        before(async () => {
          const { hre, config, dsSystem, dsProxyPosition: dsProxyStEthEthEarnPositionDetails } = env
          const { debtToken, collateralToken, proxy } = dsProxyStEthEthEarnPositionDetails

          const position = await dsProxyStEthEthEarnPositionDetails.getPosition()
          const isMainnet = isMainnetByNetwork(networkFork)
          const isOptimism = isOptimismByNetwork(networkFork)
          const sharedArgs = {
            isDPMProxy: false,
            targetMultiple: new RiskRatio(new BigNumber(3.5), RiskRatio.TYPE.MULITPLE),
            positionType: dsProxyStEthEthEarnPositionDetails.__positionType,
            position,
            collateralToken,
            debtToken,
            proxy,
            slippage: UNISWAP_TEST_SLIPPAGE,
            getSwapData: env.strategiesDependencies.getSwapData(env.system.Swap.contract.address),
            userAddress: config.address,
            config,
            dsSystem,
            hre,
          }
          if (isMainnet) {
            act = await adjustPositionV3OnMainnet({
              ...sharedArgs,
              network: Network.MAINNET,
            })
          }
          if (isOptimism) {
            act = await adjustPositionV3OnOptimism({
              ...sharedArgs,
              network: Network.OPTIMISM,
            })
          }

          if (!isMainnet && !isOptimism) throw new Error('Unsupported network')
        })
        it('Adjust TX should pass', () => {
          expect(act.txStatus).to.be.true
        })
        it('should draw debt according to multiple', async () => {
          expect.toBe(
            act.adjustedPosition.debt.amount.toString(),
            'gte',
            act.simulation.position.debt.amount.toString(),
          )
        })
        it('should collect fee', async () => {
          const actualFeesDelta = act.feeWalletBalanceAfterAdjust.minus(
            act.feeWalletBalanceBeforeAdjust,
          )

          expect.toBe(
            act.simulation.swap.tokenFee,
            'gte',
            actualFeesDelta,
            EXPECT_LARGER_SIMULATED_FEE,
          )
        })
      })
      describe.skip('Using DPM Proxy', () => {
        supportedStrategies
          .filter(s => s.name !== 'WSTETH/ETH Earn')
          .forEach(({ name: strategy }) => {
            let act: Unbox<ReturnType<typeof adjustPositionV3>>

            before(async function () {
              const { hre, dsSystem, config, dpmPositions } = env

              const positionDetails = dpmPositions[strategy]
              if (!positionDetails) {
                this.skip()
              }

              const { debtToken, collateralToken, proxy } = positionDetails

              const position = await positionDetails.getPosition()
              const isMainnet = isMainnetByNetwork(networkFork)
              const isOptimism = isOptimismByNetwork(networkFork)
              const sharedArgs = {
                isDPMProxy: true,
                targetMultiple: new RiskRatio(new BigNumber(3.5), RiskRatio.TYPE.MULITPLE),
                positionType: positionDetails?.__positionType,
                position,
                collateralToken,
                debtToken,
                proxy,
                slippage: UNISWAP_TEST_SLIPPAGE,
                getSwapData: env.strategiesDependencies.getSwapData(
                  env.system.Swap.contract.address,
                ),
                userAddress: config.address,
                config,
                dsSystem,
                hre,
              }
              if (isMainnet) {
                act = await adjustPositionV3OnMainnet({
                  ...sharedArgs,
                  network: Network.MAINNET,
                })
              }
              if (isOptimism) {
                act = await adjustPositionV3OnOptimism({
                  ...sharedArgs,
                  network: Network.OPTIMISM,
                })
              }

              if (!isMainnet && !isOptimism) throw new Error('Unsupported network')
            })
            it('Adjust TX should pass', () => {
              expect(act.txStatus).to.be.true
            })
            it('should draw debt according to multiple', async () => {
              expect.toBe(
                act.adjustedPosition.debt.amount.toString(),
                'gte',
                act.simulation.position.debt.amount.toString(),
              )
            })
            it('should collect fee', async () => {
              const actualFeesDelta = act.feeWalletBalanceAfterAdjust.minus(
                act.feeWalletBalanceBeforeAdjust,
              )

              expect.toBe(
                act.simulation.swap.tokenFee,
                'gte',
                actualFeesDelta,
                EXPECT_LARGER_SIMULATED_FEE,
              )
            })
          })
      })
    })
    describe.skip('Adjust Risk Down: using 1inch', async function () {
      let env: SystemWithAAVEV3Positions
      const fixture = systemWithAaveV3Positions({
        use1inch: true,
        network: networkFork,
        systemConfigPath: `test/${networkFork}.conf.ts`,
        configExtensionPaths: [`test/swap.conf.ts`],
      })
      before(async function () {
        const _env = await loadFixture(fixture)
        if (!_env) throw new Error('Failed to set up system')
        env = _env
      })
      describe.skip('Using DSProxy', () => {
        let act: Unbox<ReturnType<typeof adjustPositionV3>>

        before(async () => {
          const { hre, config, dsSystem, dsProxyPosition: dsProxyStEthEthEarnPositionDetails } = env
          const { debtToken, collateralToken, proxy } = dsProxyStEthEthEarnPositionDetails

          const position = await dsProxyStEthEthEarnPositionDetails.getPosition()

          const isMainnet = isMainnetByNetwork(networkFork)
          const isOptimism = isOptimismByNetwork(networkFork)
          const sharedArgs = {
            isDPMProxy: false,
            targetMultiple: new RiskRatio(new BigNumber(1.3), RiskRatio.TYPE.MULITPLE),
            positionType: dsProxyStEthEthEarnPositionDetails.__positionType,
            position,
            collateralToken,
            debtToken,
            proxy,
            slippage: UNISWAP_TEST_SLIPPAGE,
            getSwapData: env.strategiesDependencies.getSwapData(env.system.Swap.contract.address),
            userAddress: config.address,
            config,
            dsSystem,
            hre,
          }
          if (isMainnet) {
            act = await adjustPositionV3OnMainnet({
              ...sharedArgs,
              network: Network.MAINNET,
            })
          }
          if (isOptimism) {
            act = await adjustPositionV3OnOptimism({
              ...sharedArgs,
              network: Network.OPTIMISM,
            })
          }

          if (!isMainnet && !isOptimism) throw new Error('Unsupported network')
        })

        it('Adjust TX should pass', () => {
          expect(act.txStatus).to.be.true
        })
        it('should payback debt according to multiple', async () => {
          expect.toBe(
            act.simulation.position.debt.amount.toString(),
            'gte',
            act.adjustedPosition.debt.amount.toString(),
          )
        })
        it('should collect fee', async () => {
          const actualFeesDelta = act.feeWalletBalanceAfterAdjust.minus(
            act.feeWalletBalanceBeforeAdjust,
          )

          expect.toBe(
            act.simulation.swap.tokenFee,
            'gte',
            actualFeesDelta,
            EXPECT_LARGER_SIMULATED_FEE,
          )
        })
      })
      describe.skip('Using DPM Proxy', () => {
        supportedStrategies
          .filter(s => s.name !== 'WSTETH/ETH Earn')
          .forEach(({ name: strategy }) => {
            let act: Unbox<ReturnType<typeof adjustPositionV3>>

            before(async function () {
              const { hre, dsSystem, config, dpmPositions } = env

              const positionDetails = dpmPositions[strategy]
              if (!positionDetails) {
                this.skip()
              }

              const { debtToken, collateralToken, proxy } = positionDetails

              const position = await positionDetails.getPosition()
              const slippage = SLIPPAGE

              const isMainnet = isMainnetByNetwork(networkFork)
              const isOptimism = isOptimismByNetwork(networkFork)
              const sharedArgs = {
                isDPMProxy: true,
                targetMultiple: new RiskRatio(new BigNumber(1.3), RiskRatio.TYPE.MULITPLE),
                positionType: positionDetails?.__positionType,
                position,
                collateralToken,
                debtToken,
                proxy,
                slippage,
                getSwapData: env.strategiesDependencies.getSwapData(
                  env.system.Swap.contract.address,
                ),
                userAddress: config.address,
                config,
                dsSystem,
                hre,
              }
              if (isMainnet) {
                act = await adjustPositionV3OnMainnet({
                  ...sharedArgs,
                  network: Network.MAINNET,
                })
              }
              if (isOptimism) {
                act = await adjustPositionV3OnOptimism({
                  ...sharedArgs,
                  network: Network.OPTIMISM,
                })
              }

              if (!isMainnet && !isOptimism) throw new Error('Unsupported network')
            })
            it('Adjust TX should pass', () => {
              expect(act.txStatus).to.be.true
            })
            it('should payback debt according to multiple', async () => {
              expect.toBe(
                act.simulation.position.debt.amount.toString(),
                'gte',
                act.adjustedPosition.debt.amount.toString(),
              )
            })
            it('should collect fee', async () => {
              const actualFeesDelta = act.feeWalletBalanceAfterAdjust.minus(
                act.feeWalletBalanceBeforeAdjust,
              )

              expect.toBe(
                act.simulation.swap.tokenFee,
                'gte',
                actualFeesDelta,
                EXPECT_LARGER_SIMULATED_FEE,
              )
            })
          })
      })
    })
  })
})

function isRiskIncreasing(currentMultiple: IRiskRatio, newMultiple: IRiskRatio): boolean {
  return newMultiple.multiple.gte(currentMultiple.multiple)
}
