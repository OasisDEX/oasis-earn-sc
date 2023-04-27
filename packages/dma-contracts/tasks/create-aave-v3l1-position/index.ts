import { CONTRACT_NAMES } from '@dma-common/constants'
import { createDPMAccount } from '@dma-common/test-utils'
import init from '@dma-common/utils/init'
import { getAccountFactory } from '@dma-common/utils/proxy'
import { getOneInchCall, oneInchCallMock } from '@dma-common/utils/swap'
import { wstethEthEarnAavePosition } from '@dma-contracts/test/fixtures/factories/wsteth-eth-earn-aave-position'
import { StrategyDependenciesAaveV3 } from '@dma-contracts/test/fixtures/types/strategies-dependencies'
import { ADDRESSES } from '@dma-deployments/addresses'
import { Network } from '@dma-deployments/types/network'
import { AaveVersion, protocols } from '@dma-library'
import BigNumber from 'bignumber.js'
import { task } from 'hardhat/config'

task('createAaveV3L1Position', 'Create wsteth/eth position on AAVE V3 L1')
  .addOptionalParam<string>('serviceregistry', 'Service Registry address')
  .addFlag('usefallbackswap', 'Use fallback swap')
  .setAction(async (taskArgs, hre) => {
    const config = await init(hre)

    const serviceRegistryAddress = taskArgs.serviceregistry || process.env.SERVICE_REGISTRY_ADDRESS

    console.log('Using service registry: ', serviceRegistryAddress)

    if (!serviceRegistryAddress) {
      throw new Error('ServiceRegistry params or SERVICE_REGISTRY_ADDRESS env variable is not set')
    }

    const serviceRegistryAbi = [
      {
        inputs: [
          {
            internalType: 'string',
            name: 'serviceName',
            type: 'string',
          },
        ],
        name: 'getRegisteredService',
        outputs: [
          {
            internalType: 'address',
            name: '',
            type: 'address',
          },
        ],
        stateMutability: 'view',
        type: 'function',
      },
    ]

    const serviceRegistry = await hre.ethers.getContractAt(
      serviceRegistryAbi,
      serviceRegistryAddress,
      config.signer,
    )

    const operationExecutorAddress = await serviceRegistry.getRegisteredService(
      CONTRACT_NAMES.common.OPERATION_EXECUTOR,
    )

    console.log('operationExecutorAddress', operationExecutorAddress)

    const accountFactoryAddress = await serviceRegistry.getRegisteredService('AccountFactory')
    console.log('account factory address', accountFactoryAddress)
    const swapAddress = await serviceRegistry.getRegisteredService(CONTRACT_NAMES.common.SWAP)

    const mainnetAddresses = {
      DAI: ADDRESSES[Network.MAINNET].common.DAI,
      ETH: ADDRESSES[Network.MAINNET].common.ETH,
      WETH: ADDRESSES[Network.MAINNET].common.WETH,
      STETH: ADDRESSES[Network.MAINNET].common.STETH,
      WSTETH: ADDRESSES[Network.MAINNET].common.WSTETH,
      WBTC: ADDRESSES[Network.MAINNET].common.WBTC,
      USDC: ADDRESSES[Network.MAINNET].common.USDC,
      chainlinkEthUsdPriceFeed: ADDRESSES[Network.MAINNET].common.ChainlinkEthUsdPriceFeed,
      aaveOracle: ADDRESSES[Network.MAINNET].aave.v3.AaveOracle,
      pool: ADDRESSES[Network.MAINNET].aave.v3.Pool,
      operationExecutor: operationExecutorAddress,
      poolDataProvider: ADDRESSES[Network.MAINNET].aave.v3.AaveProtocolDataProvider,
      accountFactory: accountFactoryAddress,
    }

    const swapData = taskArgs.usefallbackswap
      ? (marketPrice: BigNumber, precision: { from: number; to: number }) =>
          oneInchCallMock(marketPrice, precision)
      : () => getOneInchCall(swapAddress)

    const [proxy1, vaultId1] = await createDPMAccount(
      await getAccountFactory(config.signer, mainnetAddresses.accountFactory, hre),
    )

    if (proxy1 === undefined) {
      throw new Error(`Can't create DPM accounts`)
    }

    console.log(`DPM Created: ${proxy1}. VaultId: ${vaultId1}`)

    const dependencies: StrategyDependenciesAaveV3 = {
      addresses: mainnetAddresses,
      provider: config.provider,
      protocol: {
        version: AaveVersion.v3,
        getCurrentPosition: () => {
          throw new Error('not needed')
        },
        getProtocolData: protocols.aave.getAaveProtocolData,
      },
      getSwapData: swapData,
      user: config.address,
      contracts: {
        operationExecutor: new hre.ethers.Contract(
          operationExecutorAddress,
          [
            {
              inputs: [
                {
                  components: [
                    {
                      internalType: 'bytes32',
                      name: 'targetHash',
                      type: 'bytes32',
                    },
                    {
                      internalType: 'bytes',
                      name: 'callData',
                      type: 'bytes',
                    },
                    {
                      internalType: 'bool',
                      name: 'skipped',
                      type: 'bool',
                    },
                  ],
                  internalType: 'struct Call[]',
                  name: 'calls',
                  type: 'tuple[]',
                },
                {
                  internalType: 'string',
                  name: 'operationName',
                  type: 'string',
                },
              ],
              name: 'executeOp',
              outputs: [],
              stateMutability: 'payable',
              type: 'function',
            },
          ],
          config.provider,
        ),
      },
    }

    const positionDetails1 = await wstethEthEarnAavePosition({
      proxy: proxy1,
      isDPM: true,
      use1inch: !taskArgs.usefallbackswap,
      dependencies,
      config,
      feeRecipient: ADDRESSES[Network.MAINNET].common.FeeRecipient,
      swapAddress,
    })

    console.log(
      `Position created: ${positionDetails1.strategy} with proxy: ${positionDetails1.proxy}`,
    )
  })
