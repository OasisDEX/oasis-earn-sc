import index from '@dma-common/utils/init'
import { StrategiesDependencies } from '@dma-contracts/test/fixtures'
import {
  ethUsdcMultiplyAavePosition,
  stethUsdcMultiplyAavePosition,
  wbtcUsdcMultiplyAavePosition,
} from '@dma-contracts/test/fixtures/factories'
import { buildGetTokenFunction } from '@dma-contracts/test/utils/aave'
import { ADDRESSES } from '@oasisdex/addresses'
import { CONTRACT_NAMES } from '@oasisdex/dma-common/constants'
import { createDPMAccount } from '@oasisdex/dma-common/test-utils'
import { getAccountFactory } from '@oasisdex/dma-common/utils/proxy'
import { getOneInchCall, oneInchCallMock } from '@oasisdex/dma-common/utils/swap'
import { Network } from '@oasisdex/dma-deployments/types/network'
import { AaveVersion, protocols, strategies } from '@oasisdex/dma-library'
import BigNumber from 'bignumber.js'
import { task } from 'hardhat/config'

task('createMultiplyPosition', 'Create stETH position on AAVE')
  .addOptionalParam<string>('serviceRegistry', 'Service Registry address')
  .addFlag('usefallbackswap', 'Use fallback swap')
  .setAction(async (taskArgs, hre) => {
    const config = await index(hre)

    const getTokens = buildGetTokenFunction(config, hre)

    const serviceRegistryAddress = taskArgs.serviceRegistry || process.env.SERVICE_REGISTRY_ADDRESS

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

    const swapAddress = await serviceRegistry.getRegisteredService(CONTRACT_NAMES.common.SWAP)

    const mainnetAddresses = {
      DAI: ADDRESSES[Network.MAINNET].common.DAI,
      ETH: ADDRESSES[Network.MAINNET].common.ETH,
      WETH: ADDRESSES[Network.MAINNET].common.WETH,
      STETH: ADDRESSES[Network.MAINNET].common.STETH,
      WBTC: ADDRESSES[Network.MAINNET].common.WBTC,
      USDC: ADDRESSES[Network.MAINNET].common.USDC,
      chainlinkEthUsdPriceFeed: ADDRESSES[Network.MAINNET].common.ChainlinkEthUsdPriceFeed,
      priceOracle: ADDRESSES[Network.MAINNET].aave.v2.PriceOracle,
      lendingPool: ADDRESSES[Network.MAINNET].aave.v2.LendingPool,
      operationExecutor: operationExecutorAddress,
      protocolDataProvider: ADDRESSES[Network.MAINNET].aave.v2.ProtocolDataProvider,
      accountFactory: '0xF7B75183A2829843dB06266c114297dfbFaeE2b6',
    }

    const swapData = taskArgs.usefallbackswap
      ? (marketPrice: BigNumber, precision: { from: number; to: number }) =>
          oneInchCallMock(marketPrice, precision)
      : () => getOneInchCall(swapAddress)

    const [proxy1, vaultId1] = await createDPMAccount(
      await getAccountFactory(config.signer, mainnetAddresses.accountFactory),
    )
    const [proxy2, vaultId2] = await createDPMAccount(
      await getAccountFactory(config.signer, mainnetAddresses.accountFactory),
    )
    const [proxy3, vaultId3] = await createDPMAccount(
      await getAccountFactory(config.signer, mainnetAddresses.accountFactory),
    )

    if (proxy1 === undefined || proxy2 === undefined || proxy3 === undefined) {
      throw new Error(`Can't create DPM accounts`)
    }

    console.log(`DPM Created: ${proxy1}. VaultId: ${vaultId1}`)
    console.log(`DPM Created: ${proxy2}. VaultId: ${vaultId2}`)
    console.log(`DPM Created: ${proxy3}. VaultId: ${vaultId3}`)

    const dependencies: StrategiesDependencies = {
      addresses: mainnetAddresses,
      provider: config.provider,
      protocol: {
        version: AaveVersion.v2,
        getCurrentPosition: strategies.aave.v2.view,
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

    const positionDetails1 = await ethUsdcMultiplyAavePosition({
      proxy: proxy1,
      isDPM: true,
      use1inch: false,
      dependencies,
      config,
      feeRecipient: ADDRESSES[Network.MAINNET].common.FeeRecipient,
    })

    console.log(
      `Position created: ${positionDetails1.strategy} with proxy: ${positionDetails1.proxy}`,
    )

    const positionDetails2 = await stethUsdcMultiplyAavePosition({
      proxy: proxy2,
      isDPM: true,
      use1inch: false,
      dependencies,
      config,
      getTokens,
    })

    console.log(
      `Position created: ${positionDetails2.strategy} with proxy: ${positionDetails2.proxy}`,
    )

    const positionDetails3 = await wbtcUsdcMultiplyAavePosition({
      proxy: proxy3,
      isDPM: true,
      use1inch: false,
      dependencies,
      config,
      getTokens,
    })

    if (!positionDetails3) throw new Error('WBTC USDC Multiply Position details are undefined')

    console.log(
      `Position created: ${positionDetails3.strategy} with proxy: ${positionDetails3.proxy}`,
    )
  })
