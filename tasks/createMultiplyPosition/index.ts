import {
  AaveVersion,
  ADDRESSES,
  CONTRACT_NAMES,
  protocols,
  strategies,
} from '@oasisdex/oasis-actions/src'
import BigNumber from 'bignumber.js'
import { task } from 'hardhat/config'

import { buildGetTokenFunction } from '../../helpers/aave'
import init from '../../helpers/init'
import { getOneInchCall } from '../../helpers/swap/OneInchCall'
import { oneInchCallMock } from '../../helpers/swap/OneInchCallMock'
import {
  createDPMAccount,
  createEthUsdcMultiplyAAVEPosition,
  createStEthUsdcMultiplyAAVEPosition,
  createWbtcUsdcMultiplyAAVEPosition,
} from '../../test/fixtures/factories'
import { StrategiesDependencies } from '../../test/fixtures/types'

task('createMultiplyPosition', 'Create stETH position on AAVE')
  .addOptionalParam<string>('serviceregistry', 'Service Registry address')
  .addFlag('usefallbackswap', 'Use fallback swap')
  .setAction(async (taskArgs, hre) => {
    const config = await init(hre)

    const getTokens = buildGetTokenFunction(config, hre)

    const serviceRegistryAddress = taskArgs.serviceregistry || process.env.SERVICE_REGISTRY_ADDRESS

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

    const accountFactoryAddress = await serviceRegistry.getRegisteredService('AccountFactory')

    const swapAddress = await serviceRegistry.getRegisteredService(CONTRACT_NAMES.common.SWAP)

    const mainnetAddresses = {
      DAI: ADDRESSES.main.DAI,
      ETH: ADDRESSES.main.ETH,
      WETH: ADDRESSES.main.WETH,
      STETH: ADDRESSES.main.STETH,
      WBTC: ADDRESSES.main.WBTC,
      USDC: ADDRESSES.main.USDC,
      chainlinkEthUsdPriceFeed: ADDRESSES.main.chainlinkEthUsdPriceFeed,
      priceOracle: ADDRESSES.main.aave.v2.PriceOracle,
      lendingPool: ADDRESSES.main.aave.v2.LendingPool,
      operationExecutor: operationExecutorAddress,
      protocolDataProvider: ADDRESSES.main.aave.v2.ProtocolDataProvider,
      accountFactory: accountFactoryAddress,
    }

    const swapData = taskArgs.usefallbackswap
      ? (marketPrice: BigNumber, precision: { from: number; to: number }) =>
          oneInchCallMock(marketPrice, precision)
      : () => getOneInchCall(swapAddress)

    const [proxy1, vaultId1] = await createDPMAccount(mainnetAddresses.accountFactory, config)
    const [proxy2, vaultId2] = await createDPMAccount(mainnetAddresses.accountFactory, config)
    const [proxy3, vaultId3] = await createDPMAccount(mainnetAddresses.accountFactory, config)

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
        getCurrentPosition: strategies.aave.view,
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

    const positionDetails1 = await createEthUsdcMultiplyAAVEPosition({
      proxy: proxy1,
      isDPM: true,
      use1inch: false,
      dependencies,
      config,
    })

    console.log(
      `Position created: ${positionDetails1.strategy} with proxy: ${positionDetails1.proxy}`,
    )

    const positionDetails2 = await createStEthUsdcMultiplyAAVEPosition({
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

    const positionDetails3 = await createWbtcUsdcMultiplyAAVEPosition({
      proxy: proxy3,
      isDPM: true,
      use1inch: false,
      dependencies,
      config,
      getTokens,
    })

    console.log(
      `Position created: ${positionDetails3.strategy} with proxy: ${positionDetails3.proxy}`,
    )
  })
