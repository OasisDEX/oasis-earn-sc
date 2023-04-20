import { task, types } from 'hardhat/config'

task('createPosition', 'Create stETH position on AAVE')
  .addOptionalParam<string>('serviceRegistry', 'Service Registry address')
  .addOptionalParam('deposit', 'ETH deposit', 8, types.float)
  .addOptionalParam('multiply', 'Required multiply', 2, types.float)
  .addFlag('usefallbackswap', 'Use fallback swap')
  .setAction(async () => {
    // .setAction(async (taskArgs, hre) => {
    // TODO: Wait for L2 merge
    // const config = await init(hre)
    //
    // const serviceRegistryAddress = taskArgs.serviceRegistry || process.env.SERVICE_REGISTRY_ADDRESS
    //
    // if (!serviceRegistryAddress) {
    //   throw new Error('ServiceRegistry params or SERVICE_REGISTRY_ADDRESS env variable is not set')
    // }
    //
    // const serviceRegistryAbi = [
    //   {
    //     inputs: [
    //       {
    //         internalType: 'string',
    //         name: 'serviceName',
    //         type: 'string',
    //       },
    //     ],
    //     name: 'getRegisteredService',
    //     outputs: [
    //       {
    //         internalType: 'address',
    //         name: '',
    //         type: 'address',
    //       },
    //     ],
    //     stateMutability: 'view',
    //     type: 'function',
    //   },
    // ]
    //
    // const serviceRegistry = await hre.ethers.getContractAt(
    //   serviceRegistryAbi,
    //   serviceRegistryAddress,
    //   config.signer,
    // )
    //
    // const operationExecutorAddress = await serviceRegistry.getRegisteredService(
    //   CONTRACT_NAMES.common.OPERATION_EXECUTOR,
    // )
    //
    // const swapAddress = await serviceRegistry.getRegisteredService(CONTRACT_NAMES.common.SWAP)
    //
    // const aaveLendingPool = new hre.ethers.Contract(
    //   ADDRESSES[Network.MAINNET].aave.v2.LendingPool,
    //   AAVELendingPoolABI,
    //   config.provider,
    // )
    //
    // const aaveDataProvider = new hre.ethers.Contract(
    //   ADDRESSES[Network.MAINNET].aave.v2.ProtocolDataProvider,
    //   AAVEDataProviderABI,
    //   config.provider,
    // )
    //
    // const proxyAddress = await getOrCreateProxy(config.signer)
    //
    // const dsProxy = new hre.ethers.Contract(
    //   proxyAddress.address,
    //   DSProxyABI,
    //   config.provider,
    // ).connect(config.signer)
    //
    // const userDaiReserveData: AAVEReserveData = await aaveDataProvider.getUserReserveData(
    //   ADDRESSES[Network.MAINNET].DAI,
    //   dsProxy.address,
    // )
    //
    // console.log('Current DAI reserve data', userDaiReserveData.currentATokenBalance.toString())
    //
    // console.log(`Proxy Address for account: ${proxyAddress}`)
    //
    // const swapData = taskArgs.usefallbackswap ? oneInchCallMock() : getOneInchCall(swapAddress)
    // const depositAmount = amountToWei(new BigNumber(taskArgs.deposit))
    // const multiply = new BigNumber(taskArgs.multiply)
    // const slippage = new BigNumber(0.1)
    //
    // const debtToken = { symbol: 'ETH' as const }
    // const collateralToken = { symbol: 'STETH' as const }
    // const proxy = dsProxy.address
    //
    // const addresses = {
    //   ...mainnetAddresses,
    //   operationExecutor: operationExecutorAddress,
    //   priceOracle: mainnetAddresses.aave.v2.priceOracle,
    //   lendingPool: mainnetAddresses.aave.v2.lendingPool,
    //   protocolDataProvider: mainnetAddresses.aave.v2.protocolDataProvider,
    // }
    //
    // const positionTransition = await strategies.aave.open(
    //   {
    //     depositedByUser: { debtToken: { amountInBaseUnit: depositAmount } },
    //     slippage,
    //     multiple: multiply,
    //     debtToken,
    //     collateralToken,
    //     positionType: 'Earn',
    //   },
    //   {
    //     addresses: {
    //       ...addresses,
    //     },
    //     provider: config.provider,
    //     getSwapData: swapData,
    //     proxy,
    //     user: config.address,
    //     isDPMProxy: false,
    //     protocol: {
    //       getCurrentPosition: strategies.aave.view,
    //       getProtocolData: protocols.aave.getAaveProtocolData,
    //       version: 2,
    //     },
    //   },
    // )
    //
    // const operationExecutor = await hre.ethers.getContractAt(
    //   CONTRACT_NAMES.common.OPERATION_EXECUTOR,
    //   addresses.operationExecutor,
    //   config.signer,
    // )
    //
    // const [txStatus, tx] = await executeThroughProxy(
    //   dsProxy.address,
    //   {
    //     address: addresses.operationExecutor,
    //     calldata: operationExecutor.interface.encodeFunctionData('executeOp', [
    //       positionTransition.transaction.calls,
    //       positionTransition.transaction.operationName,
    //     ]),
    //   },
    //   config.signer,
    //   depositAmount.toFixed(0),
    //   hre,
    // )
    //
    // const userAccountData: AAVEAccountData = await aaveLendingPool.getUserAccountData(
    //   dsProxy.address,
    // )
    // const userStEthReserveData: AAVEReserveData = await aaveDataProvider.getUserReserveData(
    //   ADDRESSES[Network.MAINNET].STETH,
    //   dsProxy.address,
    // )
    //
    // const proxyStEthBalance = await balanceOf(
    //   ADDRESSES[Network.MAINNET].STETH,
    //   dsProxy.address,
    //   {
    //     config,
    //     isFormatted: true,
    //   },
    //   hre,
    // )
    //
    // const proxyEthBalance = await balanceOf(
    //   ADDRESSES[Network.MAINNET].ETH,
    //   dsProxy.address,
    //   { config, isFormatted: true },
    //   hre,
    // )
    //
    // console.log('userAccountData', userAccountData.totalDebtETH.toString())
    // console.log('userStEthReserveData', userStEthReserveData.currentATokenBalance.toString())
    // console.log('txStatus', txStatus)
    // console.log('txHash', tx.transactionHash)
    // console.log('proxyStEthBalance', proxyStEthBalance.toString())
    // console.log('proxyEthBalance', proxyEthBalance.toString())
    //
    // return [txStatus, tx]
  })
