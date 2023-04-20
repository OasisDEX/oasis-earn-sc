<<<<<<<< HEAD:tasks/createMultiplyPositions/index.ts
import { ChainIdByNetwork, Network } from '@helpers/network'
import { AaveVersion, CONTRACT_NAMES, protocols, strategies } from '@oasisdex/oasis-actions/src'
import { task } from 'hardhat/config'

import init from '../../helpers/init'
import {
  getOneInchCall,
  optimismLiquidityProviders,
  resolveOneInchVersion,
} from '../../helpers/swap/OneInchCall'
import { createDPMAccount, createEthUsdcMultiplyAAVEPosition } from '../../test/fixtures/factories'
import { createWstEthEthEarnAAVEPosition } from '../../test/fixtures/factories/createWstEthEthEarnAAVEPosition'
import { StrategyDependenciesAaveV3 } from '../../test/fixtures/types/strategiesDependencies'
import {
  addressesByNetwork,
  isMainnetByNetwork,
  isOptimismByNetwork,
  NetworkAddressesForTests,
} from '../../test/test-utils/addresses'

const networkFork = process.env.NETWORK_FORK as Network
task('createMultiplyPositions', 'Create main token pair multiply positions (AAVE only for now)')
  .addOptionalParam<string>('serviceregistry', 'Service Registry address')
  .addOptionalParam<string>('accountfactory', 'Account Factory address')
  .setAction(async (taskArgs: { serviceregistry: string; accountfactory: string }, hre) => {
    const config = await init(hre)
========
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
>>>>>>>> dev:packages/dma-contracts/tasks/create-multiply-position/index.ts

    if (!(isMainnetByNetwork(networkFork) || isOptimismByNetwork(networkFork)))
      throw new Error('Unsupported network fork')

    const serviceRegistryAddress = taskArgs.serviceregistry || process.env.SERVICE_REGISTRY_ADDRESS
    const accountFactoryAddress = taskArgs.accountfactory || process.env.ACCOUNT_FACTORY_ADDRESS

    if (!serviceRegistryAddress)
      throw new Error('ServiceRegistry params or SERVICE_REGISTRY_ADDRESS env variable is not set')
    if (!accountFactoryAddress)
      throw new Error('AccountFactory params or ACCOUNT_FACTORY_ADDRESS env variable is not set')

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

<<<<<<<< HEAD:tasks/createMultiplyPositions/index.ts
    const addresses = addressesByNetwork(networkFork)
    if (!addresses) throw new Error(`Can't find addresses for network ${networkFork}`)
    const addressesWithExecutor: NetworkAddressesForTests & { operationExecutor: string } = {
      ...addresses,
      operationExecutor: operationExecutorAddress,
========
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
>>>>>>>> dev:packages/dma-contracts/tasks/create-multiply-position/index.ts
    }

    const oneInchVersion = resolveOneInchVersion(networkFork)
    const swapData = () =>
      getOneInchCall(
        swapAddress,
        // We remove Balancer to avoid re-entrancy errors when also using Balancer FL
        isOptimismByNetwork(networkFork)
          ? optimismLiquidityProviders.filter(l => l !== 'OPTIMISM_BALANCER_V2')
          : [],
        ChainIdByNetwork[networkFork],
        oneInchVersion,
      )
    const accountFactoryContract = await hre.ethers.getContractAt(
      'AccountFactory',
      accountFactoryAddress,
    )

<<<<<<<< HEAD:tasks/createMultiplyPositions/index.ts
    const [proxy1, vaultId1] = await createDPMAccount(accountFactoryContract)
    const [proxy2, vaultId2] = await createDPMAccount(accountFactoryContract)
========
    const [proxy1, vaultId1] = await createDPMAccount(
      await getAccountFactory(config.signer, mainnetAddresses.accountFactory),
    )
    const [proxy2, vaultId2] = await createDPMAccount(
      await getAccountFactory(config.signer, mainnetAddresses.accountFactory),
    )
    const [proxy3, vaultId3] = await createDPMAccount(
      await getAccountFactory(config.signer, mainnetAddresses.accountFactory),
    )
>>>>>>>> dev:packages/dma-contracts/tasks/create-multiply-position/index.ts

    if (proxy1 === undefined || proxy2 === undefined) {
      throw new Error(`Can't create DPM accounts`)
    }

    console.log(`DPM Created: ${proxy1}. VaultId: ${vaultId1}`)
    console.log(`DPM Created: ${proxy2}. VaultId: ${vaultId2}`)

    const dependencies: StrategyDependenciesAaveV3 = {
      addresses: addressesWithExecutor,
      provider: config.provider,
      protocol: {
<<<<<<<< HEAD:tasks/createMultiplyPositions/index.ts
        version: AaveVersion.v3,
        getCurrentPosition: strategies.aave.v3.view,
========
        version: AaveVersion.v2,
        getCurrentPosition: strategies.aave.v2.view,
>>>>>>>> dev:packages/dma-contracts/tasks/create-multiply-position/index.ts
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
      use1inch: true,
      swapAddress,
      dependencies,
      config,
<<<<<<<< HEAD:tasks/createMultiplyPositions/index.ts
      feeRecipient: addressesWithExecutor.feeRecipient,
========
      feeRecipient: ADDRESSES[Network.MAINNET].common.FeeRecipient,
>>>>>>>> dev:packages/dma-contracts/tasks/create-multiply-position/index.ts
    })

    console.log(
      `Position created: ${positionDetails1.strategy} with proxy: ${positionDetails1.proxy}`,
    )

<<<<<<<< HEAD:tasks/createMultiplyPositions/index.ts
    const positionDetails2 = await createWstEthEthEarnAAVEPosition({
========
    const positionDetails2 = await stethUsdcMultiplyAavePosition({
>>>>>>>> dev:packages/dma-contracts/tasks/create-multiply-position/index.ts
      proxy: proxy2,
      isDPM: true,
      use1inch: true,
      swapAddress,
      dependencies,
      config: { ...config, network: networkFork },
      feeRecipient: addressesWithExecutor.feeRecipient,
    })

    console.log(
      `Position created: ${positionDetails2.strategy} with proxy: ${positionDetails2.proxy}`,
    )
<<<<<<<< HEAD:tasks/createMultiplyPositions/index.ts
========

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
>>>>>>>> dev:packages/dma-contracts/tasks/create-multiply-position/index.ts
  })
