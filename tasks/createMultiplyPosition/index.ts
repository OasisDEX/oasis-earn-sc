import { ADDRESSES, CONTRACT_NAMES } from '@oasisdex/oasis-actions'
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
  .addOptionalParam<string>('serviceRegistry', 'Service Registry address')
  .addFlag('usefallbackswap', 'Use fallback swap')
  .setAction(async (taskArgs, hre) => {
    const config = await init(hre)

    const getToken = buildGetTokenFunction(config, hre)

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
      DAI: ADDRESSES.main.DAI,
      ETH: ADDRESSES.main.ETH,
      WETH: ADDRESSES.main.WETH,
      STETH: ADDRESSES.main.STETH,
      WBTC: ADDRESSES.main.WBTC,
      USDC: ADDRESSES.main.USDC,
      chainlinkEthUsdPriceFeed: ADDRESSES.main.chainlinkEthUsdPriceFeed,
      aavePriceOracle: ADDRESSES.main.aavePriceOracle,
      aaveLendingPool: ADDRESSES.main.aave.MainnetLendingPool,
      operationExecutor: operationExecutorAddress,
      aaveProtocolDataProvider: ADDRESSES.main.aave.DataProvider,
      accountFactory: '0xF7B75183A2829843dB06266c114297dfbFaeE2b6',
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

    const positionDetails1 = await createEthUsdcMultiplyAAVEPosition(
      proxy1,
      true,
      dependencies,
      config,
    )

    console.log(
      `Position created: ${positionDetails1.strategy} with proxy: ${positionDetails1.proxy}`,
    )

    const positionDetails2 = await createStEthUsdcMultiplyAAVEPosition(
      proxy2,
      true,
      dependencies,
      config,
      getToken,
    )

    console.log(
      `Position created: ${positionDetails2.strategy} with proxy: ${positionDetails2.proxy}`,
    )

    const positionDetails3 = await createWbtcUsdcMultiplyAAVEPosition(
      proxy3,
      true,
      dependencies,
      config,
      getToken,
    )

    console.log(
      `Position created: ${positionDetails3.strategy} with proxy: ${positionDetails3.proxy}`,
    )
  })
