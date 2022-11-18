import { ADDRESSES, CONTRACT_NAMES, OPERATION_NAMES, strategies } from '@oasisdex/oasis-actions'
import aavePriceOracleABI from '@oasisdex/oasis-actions/lib/src/abi/aavePriceOracle.json'
import BigNumber from 'bignumber.js'
import { task, types } from 'hardhat/config'

import AAVEDataProviderABI from '../../abi/aaveDataProvider.json'
import AAVELendigPoolABI from '../../abi/aaveLendingPool.json'
import DSProxyABI from '../../abi/ds-proxy.json'
import { AAVEAccountData, AAVEReserveData } from '../../helpers/aave'
import { executeThroughProxy } from '../../helpers/deploy'
import init from '../../helpers/init'
import { getOrCreateProxy } from '../../helpers/proxy'
import { getOneInchCall } from '../../helpers/swap/OneInchCall'
import { oneInchCallMock } from '../../helpers/swap/OneInchCallMock'
import { balanceOf } from '../../helpers/utils'

function amountToWei(amount: BigNumber.Value, precision = 18) {
  BigNumber.config({ EXPONENTIAL_AT: 30 })
  return new BigNumber(amount || 0).times(new BigNumber(10).pow(precision))
}

task('createPosition', 'Create stETH position on AAVE')
  .addOptionalParam<string>('serviceRegistry', 'Service Registry address')
  .addOptionalParam('deposit', 'ETH deposit', 8, types.float)
  .addOptionalParam('multiply', 'Required multiply', 2, types.float)
  .addFlag('dummyswap', 'Use dummy swap')
  .setAction(async (taskArgs, hre) => {
    if (!process.env.SERVICE_REGISTRY_ADDRESS) {
      throw new Error('SERVICE_REGISTRY_ADDRESS env variable is not set')
    }

    const config = await init(hre)

    const serviceRegistryAddress = taskArgs.serviceRegistry || process.env.SERVICE_REGISTRY_ADDRESS

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
      stETH: ADDRESSES.main.stETH,
      wBTC: ADDRESSES.main.WBTC,
      USDC: ADDRESSES.main.USDC,
      chainlinkEthUsdPriceFeed: ADDRESSES.main.chainlinkEthUsdPriceFeed,
      aavePriceOracle: ADDRESSES.main.aavePriceOracle,
      aaveLendingPool: ADDRESSES.main.aave.MainnetLendingPool,
      operationExecutor: operationExecutorAddress,
      aaveProtocolDataProvider: ADDRESSES.main.aave.DataProvider,
    }
    const aaveLendingPool = new hre.ethers.Contract(
      ADDRESSES.main.aave.MainnetLendingPool,
      AAVELendigPoolABI,
      config.provider,
    )
    const aaveDataProvider = new hre.ethers.Contract(
      ADDRESSES.main.aave.DataProvider,
      AAVEDataProviderABI,
      config.provider,
    )

    const aavePriceOracle = new hre.ethers.Contract(
      ADDRESSES.main.aavePriceOracle,
      aavePriceOracleABI,
      config.provider,
    )

    const proxyAddress = await getOrCreateProxy(config.signer)

    const dsProxy = new hre.ethers.Contract(proxyAddress, DSProxyABI, config.provider).connect(
      config.signer,
    )

    console.log(`Proxy Address for account: ${proxyAddress}`)

    const swapData = taskArgs.dummyswap ? oneInchCallMock() : getOneInchCall(swapAddress)
    const depositAmount = amountToWei(new BigNumber(taskArgs.deposit))
    const multiply = new BigNumber(taskArgs.multiply)
    const slippage = new BigNumber(0.1)

    
    const currentPosition = await strategies.aave.getCurrentStEthEthPosition(
      { proxyAddress: dsProxy.address },
      {
        addresses: {
          stETH: ADDRESSES.main.stETH,
          aavePriceOracle: aavePriceOracle.address,
          aaveLendingPool: aaveLendingPool.address,
          aaveDataProvider: aaveDataProvider.address,
        },
        provider: config.provider,
      },
    )

    const positionTransition = await strategies.aave.open(
      {
        depositedByUser: { debtInWei: depositAmount },
        slippage,
        multiple: multiply,
        debtToken: { symbol: 'ETH' },
        collateralToken: { symbol: 'STETH' },
      },
      {
        addresses: mainnetAddresses,
        provider: config.provider,
        getSwapData: swapData,
        proxy: dsProxy.address,
        user: config.address,
        currentPosition: currentPosition,
      },
    )

    const operationExecutor = await hre.ethers.getContractAt(
      CONTRACT_NAMES.common.OPERATION_EXECUTOR,
      mainnetAddresses.operationExecutor,
      config.signer,
    )

    const [txStatus, tx] = await executeThroughProxy(
      dsProxy.address,
      {
        address: mainnetAddresses.operationExecutor,
        calldata: operationExecutor.interface.encodeFunctionData('executeOp', [
          positionTransition.transaction.calls,
          positionTransition.transaction.operationName,
        ]),
      },
      config.signer,
      depositAmount.toFixed(0),
      hre,
    )

    const userAccountData: AAVEAccountData = await aaveLendingPool.getUserAccountData(
      dsProxy.address,
    )
    const userStEthReserveData: AAVEReserveData = await aaveDataProvider.getUserReserveData(
      ADDRESSES.main.stETH,
      dsProxy.address,
    )

    const proxyStEthBalance = await balanceOf(
      ADDRESSES.main.stETH,
      dsProxy.address,
      {
        config,
        isFormatted: true,
      },
      hre,
    )

    const proxyEthBalance = await balanceOf(
      ADDRESSES.main.ETH,
      dsProxy.address,
      { config, isFormatted: true },
      hre,
    )

    console.log('userAccountData', userAccountData.totalDebtETH.toString())
    console.log('userStEthReserveData', userStEthReserveData.currentATokenBalance.toString())
    console.log('txStatus', txStatus)
    console.log('txHash', tx.transactionHash)
    console.log('proxyStEthBalance', proxyStEthBalance.toString())
    console.log('proxyEthBalance', proxyEthBalance.toString())

    return [txStatus, tx]
  })
