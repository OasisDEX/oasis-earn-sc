import { mainnetAddresses } from '@dma-contracts/test/addresses'
import { AaveAccountData, AaveReserveData } from '@dma-contracts/test/utils/aave'
import DSProxyABI from '@oasisdex/abis/external/libs/DS/ds-proxy.json'
import AAVELendigPoolABI from '@oasisdex/abis/external/protocols/aave/v2/lendingPool.json'
import AAVEDataProviderABI from '@oasisdex/abis/external/protocols/aave/v2/protocolDataProvider.json'
import { ADDRESSES } from '@oasisdex/addresses'
import { ONE, ZERO } from '@oasisdex/dma-common/constants'
import { balanceOf } from '@oasisdex/dma-common/utils/common'
import { executeThroughProxy } from '@oasisdex/dma-common/utils/execute'
import init from '@oasisdex/dma-common/utils/init'
import { getDsProxyRegistry } from '@oasisdex/dma-common/utils/proxy'
import { getOrCreateProxy } from '@oasisdex/dma-common/utils/proxy/proxy'
import { oneInchCallMock } from '@oasisdex/dma-common/utils/swap'
import { getOneInchCall } from '@oasisdex/dma-common/utils/swap/one-inch-call'
import { CONTRACT_NAMES } from '@oasisdex/dma-deployments/constants/contract-names'
import { strategies } from '@oasisdex/dma-library'
import { Position } from '@oasisdex/domain/src'
import BigNumber from 'bignumber.js'
import { task } from 'hardhat/config'

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
      ADDRESSES[Network.MAINNET].aave.v2.LendingPool,
      AAVELendigPoolABI,
      config.provider,
    )
    const aaveDataProvider = new hre.ethers.Contract(
      ADDRESSES[Network.MAINNET].aave.v2.ProtocolDataProvider,
      AAVEDataProviderABI,
      config.provider,
    )

    const proxy = await getOrCreateProxy(
      await getDsProxyRegistry(config.signer, ADDRESSES[Network.MAINNET].proxyRegistry, hre),
      config.signer,
    )

    const dsProxy = new hre.ethers.Contract(proxy.address, DSProxyABI, config.provider).connect(
      config.signer,
    )

    let userStEthReserveData: AaveReserveData = await aaveDataProvider.getUserReserveData(
      ADDRESSES[Network.MAINNET].STETH,
      dsProxy.address,
    )

    const address = await config.signer.getAddress()
    let balanceEth = await balanceOf(
      ADDRESSES[Network.MAINNET].ETH,
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

    console.log(`Proxy Address for account: ${proxy.address}`)

    const swapData = taskArgs.usefallbackswap ? oneInchCallMock() : getOneInchCall(swapAddress)

    const beforeCloseUserAccountData: AaveAccountData = await aaveLendingPool.getUserAccountData(
      dsProxy.address,
    )

    const beforeCloseUserStEthReserveData: AaveReserveData =
      await aaveDataProvider.getUserReserveData(ADDRESSES[Network.MAINNET].STETH, dsProxy.address)

    const positionAfterOpen = new Position(
      {
        amount: new BigNumber(beforeCloseUserAccountData.totalDebtETH.toString()),
        symbol: 'ETH',
      },
      {
        amount: new BigNumber(beforeCloseUserStEthReserveData.currentATokenBalance.toString()),
        symbol: 'STETH',
      },
      ONE,
      {
        dustLimit: new BigNumber(0),
        maxLoanToValue: new BigNumber(beforeCloseUserAccountData.ltv.toString()).plus(ONE),
        liquidationThreshold: ZERO,
      },
    )

    const positionMutation = await strategies.aave.v2.close(
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
      ADDRESSES[Network.MAINNET].STETH,
      dsProxy.address,
    )

    balanceEth = await balanceOf(
      ADDRESSES[Network.MAINNET].ETH,
      address,
      { config, isFormatted: true },
      hre,
    )

    console.log('Current stETH Balance: ', userStEthReserveData.currentATokenBalance.toString())
    console.log('Current ETH Balance: ', balanceEth.toString())
  })
