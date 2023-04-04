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

    const positionDetails1 = await createEthUsdcMultiplyAAVEPosition({
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

    const positionDetails2 = await createWstEthEthEarnAAVEPosition({
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
