import {
  ADDRESSES,
  CONTRACT_NAMES,
  OPERATION_NAMES,
  Position,
  strategies,
} from '@oasisdex/oasis-actions'
import BigNumber from 'bignumber.js'
import { task } from 'hardhat/config'

import AAVEDataProviderABI from '../../abi/aaveDataProvider.json'
import AAVELendigPoolABI from '../../abi/aaveLendingPool.json'
import { AAVEAccountData, AAVEReserveData } from '../../helpers/aave'
import { executeThroughProxy } from '../../helpers/deploy'
import init from '../../helpers/init'
import { getOrCreateProxy } from '../../helpers/proxy'
import { getOneInchCall } from '../../helpers/swap/OneIchCall'
import { oneInchCallMock } from '../../helpers/swap/OneInchCallMock'
import { balanceOf } from '../../helpers/utils'
import { one, zero } from '../../scripts/common'

export function amountFromWei(amount: BigNumber.Value, precision = 18) {
  return new BigNumber(amount || 0).div(new BigNumber(10).pow(precision))
}

task('closePosition', 'Close stETH position on AAVE')
  .addOptionalParam<string>('serviceRegistry', 'Service Registry address')
  .addFlag('dummyswap', 'Use dummy swap')
  .setAction(async (taskArgs, hre) => {
    const config = await init(hre)

    const serviceRegistryAddress =
      taskArgs.serviceRegistry || '0x9b4Ae7b164d195df9C4Da5d08Be88b2848b2EaDA'

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

    const proxyAddress = await getOrCreateProxy(config.signer)

    let userStEthReserveData: AAVEReserveData = await aaveDataProvider.getUserReserveData(
      ADDRESSES.main.stETH,
      proxyAddress,
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

    const stEthAmountLockedInAave = new BigNumber(
      userStEthReserveData.currentATokenBalance.toString(),
    )
    const slippage = new BigNumber(0.1)

    console.log(`Proxy Address for account: ${proxyAddress}`)

    const swapData = taskArgs.dummyswap ? oneInchCallMock() : getOneInchCall(swapAddress)

    const beforeCloseUserAccountData: AAVEAccountData = await aaveLendingPool.getUserAccountData(
      proxyAddress,
    )

    const beforeCloseUserStEthReserveData: AAVEReserveData = await aaveDataProvider.getUserReserveData(
      ADDRESSES.main.stETH,
      proxyAddress,
    )

    const positionAfterOpen = new Position(
      { amount: new BigNumber(beforeCloseUserAccountData.totalDebtETH.toString()) },
      { amount: new BigNumber(beforeCloseUserStEthReserveData.currentATokenBalance.toString()) },
      one,
      {
        dustLimit: new BigNumber(0),
        maxLoanToValue: new BigNumber(beforeCloseUserAccountData.ltv.toString()).plus(one),
        liquidationThreshold: zero,
      },
    )

    const strategyReturn = await strategies.aave.closeStEth(
      {
        stEthAmountLockedInAave,
        slippage,
      },
      {
        addresses: mainnetAddresses,
        position: positionAfterOpen,
        provider: config.provider,
        getSwapData: swapData,
        dsProxy: proxyAddress,
      },
    )

    const operationExecutor = await hre.ethers.getContractAt(
      CONTRACT_NAMES.common.OPERATION_EXECUTOR,
      mainnetAddresses.operationExecutor,
      config.signer,
    )

    const [txStatus, tx] = await executeThroughProxy(
      proxyAddress,
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
      proxyAddress,
    )

    balanceEth = await balanceOf(ADDRESSES.main.ETH, address, { config, isFormatted: true }, hre)

    console.log('Current stETH Balance: ', userStEthReserveData.currentATokenBalance.toString())
    console.log('Current ETH Balance: ', balanceEth.toString())
  })
