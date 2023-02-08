import { amountToWei } from '@helpers/utils'
import { AaveVersion, ADDRESSES, CONTRACT_NAMES, protocols } from '@oasisdex/oasis-actions/src'
import BigNumber from 'bignumber.js'
import { task } from 'hardhat/config'

import init from '../../helpers/init'
import { getOneInchCall } from '../../helpers/swap/OneInchCall'
import { oneInchCallMock } from '../../helpers/swap/OneInchCallMock'
import { createDPMAccount } from '../../test/fixtures/factories'
import { ETH } from '../../test/fixtures/factories/common'
import { createWstEthEthEarnAAVEPosition } from '../../test/fixtures/factories/createWstEthEthEarnAAVEPosition'
import { StrategyDependenciesAaveV3 } from '../../test/fixtures/types/strategiesDependencies'

const transactionAmount = amountToWei(new BigNumber(2), ETH.precision)

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
      DAI: ADDRESSES.main.DAI,
      ETH: ADDRESSES.main.ETH,
      WETH: ADDRESSES.main.WETH,
      STETH: ADDRESSES.main.STETH,
      WSTETH: ADDRESSES.main.WSTETH,
      WBTC: ADDRESSES.main.WBTC,
      USDC: ADDRESSES.main.USDC,
      chainlinkEthUsdPriceFeed: ADDRESSES.main.chainlinkEthUsdPriceFeed,
      aaveOracle: ADDRESSES.main.aave.v3.AaveOracle,
      pool: ADDRESSES.main.aave.v3.Pool,
      operationExecutor: operationExecutorAddress,
      aaveProtocolDataProvider: ADDRESSES.main.aave.v3.AaveProtocolDataProvider,
      accountFactory: accountFactoryAddress,
    }

    const swapData = taskArgs.usefallbackswap
      ? (marketPrice: BigNumber, precision: { from: number; to: number }) =>
          oneInchCallMock(marketPrice, precision)
      : () => getOneInchCall(swapAddress)

    const [proxy1, vaultId1] = await createDPMAccount(mainnetAddresses.accountFactory, config)

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

    const positionDetails1 = await createWstEthEthEarnAAVEPosition({
      proxy: proxy1,
      isDPM: true,
      use1inch: !taskArgs.usefallbackswap,
      dependencies,
      config,
      swapAddress,
    })

    console.log(
      `Position created: ${positionDetails1.strategy} with proxy: ${positionDetails1.proxy}`,
    )
  })
