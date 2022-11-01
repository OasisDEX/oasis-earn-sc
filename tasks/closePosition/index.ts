import {
  ADDRESSES,
  CONTRACT_NAMES,
  OPERATION_NAMES,
  Position,
  strategies,
} from '@oasisdex/oasis-actions'
import { PositionBalance } from '@oasisdex/oasis-actions/src/helpers/calculations/Position'
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
import { one, zero } from '../../scripts/common'

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

    const serviceRegistryAddress = taskArgs.serviceRegistry || process.env.SERVICE_REGISTRY_ADDRESS!

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

    const stEthAmountLockedInAave = new BigNumber(
      userStEthReserveData.currentATokenBalance.toString(),
    )
    const slippage = new BigNumber(0.1)

    console.log(`Proxy Address for account: ${proxyAddress}`)

    const swapData = taskArgs.dummyswap ? oneInchCallMock() : getOneInchCall(swapAddress)

    const beforeCloseUserAccountData: AAVEAccountData = await aaveLendingPool.getUserAccountData(
      dsProxy.address,
    )

    const beforeCloseUserStEthReserveData: AAVEReserveData =
      await aaveDataProvider.getUserReserveData(ADDRESSES.main.stETH, dsProxy.address)

    const positionAfterOpen = new Position(
      new PositionBalance({
        amount: new BigNumber(beforeCloseUserAccountData.totalDebtETH.toString()),
        symbol: 'ETH',
      }),
      new PositionBalance({
        amount: new BigNumber(beforeCloseUserStEthReserveData.currentATokenBalance.toString()),
        symbol: 'STETH',
      }),
      one,
      {
        dustLimit: new BigNumber(0),
        maxLoanToValue: new BigNumber(beforeCloseUserAccountData.ltv.toString()).plus(one),
        liquidationThreshold: zero,
      },
    )

    const positionMutation = await strategies.aave.close(
      {
        collateralAmountLockedInProtocolInWei: stEthAmountLockedInAave,
        slippage,
        debtToken: { symbol: 'ETH' },
        collateralToken: { symbol: 'STETH' },
      },
      {
        addresses: mainnetAddresses,
        position: positionAfterOpen,
        provider: config.provider,
        getSwapData: swapData,
        proxy: dsProxy.address,
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
          positionMutation.transaction.calls,
          positionMutation.transaction.operationName,
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
