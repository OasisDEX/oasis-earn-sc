import { CONTRACT_NAMES } from '@dma-common/constants'
import {
  addressesByNetwork,
  createDPMAccount,
  isMainnetByNetwork,
  isOptimismByNetwork,
  NetworkAddressesForTests,
} from '@dma-common/test-utils'
import init from '@dma-common/utils/init'
import {
  getOneInchCall,
  optimismLiquidityProviders,
  resolveOneInchVersion,
} from '@dma-common/utils/swap'
import {
  ethUsdcMultiplyAavePosition,
  wstethEthEarnAavePosition,
} from '@dma-contracts/test/fixtures/factories'
import { StrategyDependenciesAaveV3 } from '@dma-contracts/test/fixtures/types/strategies-dependencies'
import { Network } from '@dma-deployments/types/network'
import { ChainIdByNetwork } from '@dma-deployments/utils/network'
import { AaveVersion, protocols, strategies } from '@dma-library'
import { task } from 'hardhat/config'

const networkFork = process.env.NETWORK_FORK as Network
task('createMultiplyPositions', 'Create main token pair multiply positions (AAVE only for now)')
  .addOptionalParam<string>('serviceregistry', 'Service Registry address')
  .addOptionalParam<string>('accountfactory', 'Account Factory address')
  .setAction(async (taskArgs: { serviceregistry: string; accountfactory: string }, hre) => {
    const config = await init(hre)

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

    const addresses = addressesByNetwork(networkFork)
    if (!addresses) throw new Error(`Can't find addresses for network ${networkFork}`)
    const addressesWithExecutor: NetworkAddressesForTests & { operationExecutor: string } = {
      ...addresses,
      operationExecutor: operationExecutorAddress,
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

    const [proxy1, vaultId1] = await createDPMAccount(accountFactoryContract)
    const [proxy2, vaultId2] = await createDPMAccount(accountFactoryContract)

    if (proxy1 === undefined || proxy2 === undefined) {
      throw new Error(`Can't create DPM accounts`)
    }

    console.log(`DPM Created: ${proxy1}. VaultId: ${vaultId1}`)
    console.log(`DPM Created: ${proxy2}. VaultId: ${vaultId2}`)

    const dependencies: StrategyDependenciesAaveV3 = {
      addresses: addressesWithExecutor,
      provider: config.provider,
      protocol: {
        version: AaveVersion.v3,
        getCurrentPosition: strategies.aave.v3.view,
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
      feeRecipient: addressesWithExecutor.feeRecipient,
    })

    console.log(
      `Position created: ${positionDetails1.strategy} with proxy: ${positionDetails1.proxy}`,
    )

    // TODO: Skipped for now because supply cap is in place on optimism
    if (isOptimismByNetwork(networkFork)) return

    const positionDetails2 = await wstethEthEarnAavePosition({
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
  })
