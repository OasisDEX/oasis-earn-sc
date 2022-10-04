import { ADDRESSES, CONTRACT_NAMES, OPERATION_NAMES, strategy } from '@oasisdex/oasis-actions'
import BigNumber from 'bignumber.js'
import { task } from 'hardhat/config'

import AAVEDataProviderABI from '../../abi/aaveDataProvider.json'
import AAVELendigPoolABI from '../../abi/aaveLendingPool.json'
import DSProxyABI from '../../abi/ds-proxy.json'
import { AAVEAccountData, AAVEReserveData } from '../../helpers/aave'
import { executeThroughProxy } from '../../helpers/deploy'
import init from '../../helpers/init'
import { getOrCreateProxy } from '../../helpers/proxy'
import { getOneInchCall } from '../../helpers/swap/OneIchCall'
import { oneInchCallMock } from '../../helpers/swap/OneInchCallMock'
import { balanceOf } from '../../helpers/utils'
import { zero } from '../../scripts/common'

function amountToWei(amount: BigNumber.Value, precision = 18) {
  BigNumber.config({ EXPONENTIAL_AT: 30 })
  return new BigNumber(amount || 0).times(new BigNumber(10).pow(precision))
}

export function amountFromWei(amount: BigNumber.Value, precision = 18) {
  return new BigNumber(amount || 0).div(new BigNumber(10).pow(precision))
}

task('closePosition', 'Close stETH position on AAVE')
  .addOptionalParam<string>('serviceRegistry', 'Service Registry address')
  .addFlag('dummyswap', 'Use dummy swap')
  .setAction(async (taskArgs, hre) => {
    const config = await init(hre)

    const serviceRegistryAddress =
      taskArgs.serviceRegistry ||
      process.env.SERVICE_REGISTRY_ADDRESS ||
      '0x9Fcca440F19c62CDF7f973eB6DDF218B15d4C71D'

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

    console.log('Operation executor address', operationExecutorAddress)

    const mainnetAddresses = {
      DAI: ADDRESSES.main.DAI,
      ETH: ADDRESSES.main.ETH,
      WETH: ADDRESSES.main.WETH,
      stETH: ADDRESSES.main.stETH,
      chainlinkEthUsdPriceFeed: ADDRESSES.main.chainlinkEthUsdPriceFeed,
      aavePriceOracle: ADDRESSES.main.aavePriceOracle,
      aaveLendingPool: ADDRESSES.main.aave.MainnetLendingPool,
      operationExecutor: operationExecutorAddress,
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

    const proxyAddress = await getOrCreateProxy(config.signer)

    const dsProxy = new hre.ethers.Contract(proxyAddress, DSProxyABI, config.provider).connect(
      config.signer,
    )

    let userStEthReserveData: AAVEReserveData = await aaveDataProvider.getUserReserveData(
      ADDRESSES.main.stETH,
      dsProxy.address,
    )

    const address = await config.signer.getAddress()
    let balanceEth = await balanceOf(
      ADDRESSES.main.ETH,
      address,
      { config, isFormatted: true },
      hre,
    )

    console.log('Current stETH Balance: ', userStEthReserveData.currentATokenBalance.toString())
    console.log('Current ETH Balance: ', balanceEth.toString())

    const stEthAmountLockedInAave = new BigNumber(userStEthReserveData.currentATokenBalance)
    const slippage = new BigNumber(0.1)

    console.log(`Proxy Address for account: ${proxyAddress}`)

    const swapData = taskArgs.dummyswap ? oneInchCallMock : getOneInchCall(swapAddress)

    const strategyReturn = await strategy.aave.closeStEth(
      {
        stEthAmountLockedInAave,
        slippage,
      },
      {
        addresses: mainnetAddresses,
        provider: config.provider,
        getSwapData: swapData,
        dsProxy: dsProxy.address,
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
          strategyReturn.calls,
          OPERATION_NAMES.common.CUSTOM_OPERATION,
        ]),
      },
      config.signer,
      '0',
      hre,
    )

    console.log('txStatus', txStatus)
    console.log('txHash', tx.transactionHash)

    userStEthReserveData = await aaveDataProvider.getUserReserveData(
      ADDRESSES.main.stETH,
      dsProxy.address,
    )

    balanceEth = await balanceOf(ADDRESSES.main.ETH, address, { config, isFormatted: true }, hre)

    console.log('Current stETH Balance: ', userStEthReserveData.currentATokenBalance.toString())
    console.log('Current ETH Balance: ', balanceEth.toString())
  })
