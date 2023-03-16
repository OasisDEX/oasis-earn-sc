import { ADDRESSES, CONTRACT_NAMES, Position, strategies } from '@oasisdex/dupa-library/src'
import BigNumber from 'bignumber.js'
import { task } from 'hardhat/config'

import { AAVEAccountData, AAVEReserveData } from '../../../dupa-common/utils/aave'
import { executeThroughProxy } from '../../../dupa-common/utils/deploy'
import init from '../../../dupa-common/utils/init'
import { getOrCreateProxy } from '../../../dupa-common/utils/proxy'
import { getOneInchCall } from '../../../dupa-common/utils/swap/OneInchCall'
import { oneInchCallMock } from '../../../dupa-common/utils/swap/OneInchCallMock'
import { balanceOf } from '../../../dupa-common/utils/utils'
import { mainnetAddresses } from '../../../dupa-library/test/addresses'
import DSProxyABI from '../../abi/ds-proxy.json'
import AAVELendigPoolABI from '../../abi/external/aave/v2/lendingPool.json'
import AAVEDataProviderABI from '../../abi/external/aave/v2/protocolDataProvider.json'
import { one, zero } from '../../scripts/common'

export function amountFromWei(amount: BigNumber.Value, precision = 18) {
  return new BigNumber(amount || 0).div(new BigNumber(10).pow(precision))
}

task('closePosition', 'Close stETH position on AAVE')
  .addOptionalParam<string>('serviceRegistry', 'Service Registry address')
  .addFlag('usefallbackswap', 'Use fallback swap')
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

    console.log('Operation executor address', operationExecutorAddress)

    const addresses = {
      ...mainnetAddresses,
      operationExecutor: operationExecutorAddress,
      priceOracle: mainnetAddresses.aave.v2.priceOracle,
      lendingPool: mainnetAddresses.aave.v2.lendingPool,
      protocolDataProvider: mainnetAddresses.aave.v2.protocolDataProvider,
    }
    const aaveLendingPool = new hre.ethers.Contract(
      ADDRESSES.main.aave.v2.LendingPool,
      AAVELendigPoolABI,
      config.provider,
    )
    const aaveDataProvider = new hre.ethers.Contract(
      ADDRESSES.main.aave.v2.ProtocolDataProvider,
      AAVEDataProviderABI,
      config.provider,
    )

    const proxyAddress = await getOrCreateProxy(config.signer)

    const dsProxy = new hre.ethers.Contract(proxyAddress, DSProxyABI, config.provider).connect(
      config.signer,
    )

    let userStEthReserveData: AAVEReserveData = await aaveDataProvider.getUserReserveData(
      ADDRESSES.main.STETH,
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

    const swapData = taskArgs.usefallbackswap ? oneInchCallMock() : getOneInchCall(swapAddress)

    const beforeCloseUserAccountData: AAVEAccountData = await aaveLendingPool.getUserAccountData(
      dsProxy.address,
    )

    const beforeCloseUserStEthReserveData: AAVEReserveData =
      await aaveDataProvider.getUserReserveData(ADDRESSES.main.STETH, dsProxy.address)

    const positionAfterOpen = new Position(
      {
        amount: new BigNumber(beforeCloseUserAccountData.totalDebtETH.toString()),
        symbol: 'ETH',
      },
      {
        amount: new BigNumber(beforeCloseUserStEthReserveData.currentATokenBalance.toString()),
        symbol: 'STETH',
      },
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
        addresses: addresses,
        currentPosition: positionAfterOpen,
        provider: config.provider,
        getSwapData: swapData,
        proxy: dsProxy.address,
        user: config.address,
        isDPMProxy: false,
        shouldCloseToCollateral: false,
      },
    )

    const operationExecutor = await hre.ethers.getContractAt(
      CONTRACT_NAMES.common.OPERATION_EXECUTOR,
      addresses.operationExecutor,
      config.signer,
    )

    const [txStatus, tx] = await executeThroughProxy(
      dsProxy.address,
      {
        address: addresses.operationExecutor,
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
      ADDRESSES.main.STETH,
      dsProxy.address,
    )

    balanceEth = await balanceOf(ADDRESSES.main.ETH, address, { config, isFormatted: true }, hre)

    console.log('Current stETH Balance: ', userStEthReserveData.currentATokenBalance.toString())
    console.log('Current ETH Balance: ', balanceEth.toString())
  })
