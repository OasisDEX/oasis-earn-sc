import { ADDRESSES } from '@deploy-configurations/addresses'
import { Network } from '@deploy-configurations/types/network'
import { SERVICE_REGISTRY_NAMES } from '@dma-common/constants'
import { createDPMAccount, getOneInchCall, oneInchCallMock } from '@dma-common/test-utils'
import { amountToWei } from '@dma-common/utils/common'
import { executeThroughDPMProxy } from '@dma-common/utils/execute'
import init from '@dma-common/utils/init'
import { getAccountFactory } from '@dma-common/utils/proxy'
import { approve } from '@dma-common/utils/tx'
import { StrategyDependenciesAaveV2 } from '@dma-contracts/test/fixtures/types/strategies-dependencies'
import { AAVETokensToGet, buildGetTokenFunction } from '@dma-contracts/test/utils/aave'
import { AAVETokens, AaveVersion, protocols, strategies } from '@dma-library'
import BigNumber from 'bignumber.js'
import { task } from 'hardhat/config'

type CreateBorrowPositionArgs = {
  serviceRegistry: string
  accountFactory: string
  collateral: AAVETokensToGet | 'ETH'
  debt: AAVETokens
  deposit: string
  borrow: string
  usefallbackswap: boolean
}

type OmitAAVETokens<T extends AAVETokens, K extends keyof any> = T extends K ? never : T

type AAVETokensWithoutWSTETH = OmitAAVETokens<AAVETokens, 'WSTETH'>

const precisionMap: Record<AAVETokensWithoutWSTETH, number> = {
  STETH: 18,
  WBTC: 8,
  USDC: 6,
  ETH: 18,
  WETH: 18,
}

task('createBorrowPosition', 'Create borrow position')
  .addOptionalParam<string>('serviceRegistry', 'Service Registry address')
  .addOptionalParam<string>('accountFactory', 'Account Factory address')
  .addOptionalParam<string>('collateral', 'Collateral token', 'ETH')
  .addOptionalParam<string>('debt', 'Debt token', 'USDC')
  .addOptionalParam<string>(
    'deposit',
    'Amount of collateral to deposit in base unit',
    amountToWei(1).toString(),
  )
  .addOptionalParam<string>('borrow', 'Amount of debt to borrow in base unit', '0')
  .setAction(async (taskArgs: CreateBorrowPositionArgs, hre) => {
    const config = await init(hre)

    const getToken = buildGetTokenFunction(
      config,
      hre,
      Network.MAINNET,
      ADDRESSES[Network.MAINNET].common.WETH,
    )

    let { serviceRegistry, accountFactory } = taskArgs
    const { debt, collateral, deposit, borrow } = taskArgs

    serviceRegistry = serviceRegistry || process.env.SERVICE_REGISTRY_ADDRESS || ''
    accountFactory = accountFactory || process.env.ACCOUNT_FACTORY_ADDRESS || ''

    if (!serviceRegistry) {
      throw new Error('ServiceRegistry params or SERVICE_REGISTRY_ADDRESS env variable is not set')
    }

    const serviceRegistryContract = await hre.ethers.getContractAt(
      'ServiceRegistry',
      serviceRegistry,
      config.signer,
    )

    const operationExecutorAddress = await serviceRegistryContract.getRegisteredService(
      SERVICE_REGISTRY_NAMES.common.OPERATION_EXECUTOR,
    )

    const operationExecutorContract = await hre.ethers.getContractAt(
      'OperationExecutor',
      operationExecutorAddress,
      config.signer,
    )

    const swapAddress = await serviceRegistryContract.getRegisteredService(
      SERVICE_REGISTRY_NAMES.common.SWAP,
    )

    const mainnetAddresses = {
      DAI: ADDRESSES[Network.MAINNET].common.DAI,
      ETH: ADDRESSES[Network.MAINNET].common.ETH,
      WETH: ADDRESSES[Network.MAINNET].common.WETH,
      STETH: ADDRESSES[Network.MAINNET].common.STETH,
      WBTC: ADDRESSES[Network.MAINNET].common.WBTC,
      USDC: ADDRESSES[Network.MAINNET].common.USDC,
      chainlinkEthUsdPriceFeed: ADDRESSES[Network.MAINNET].common.ChainlinkPriceOracle_ETHUSD,
      priceOracle: ADDRESSES[Network.MAINNET].aave.v2.PriceOracle,
      lendingPool: ADDRESSES[Network.MAINNET].aave.v2.LendingPool,
      operationExecutor: operationExecutorAddress,
      protocolDataProvider: ADDRESSES[Network.MAINNET].aave.v2.ProtocolDataProvider,
      accountFactory: accountFactory,
    }

    const swapData = taskArgs.usefallbackswap
      ? (marketPrice: BigNumber, precision: { from: number; to: number }) =>
          oneInchCallMock(marketPrice, precision)
      : () => getOneInchCall(swapAddress)

    const [proxy1, vaultId1] = await createDPMAccount(
      await getAccountFactory(config.signer, mainnetAddresses.accountFactory),
    )

    if (proxy1 === undefined) {
      throw new Error(`Can't create DPM accounts`)
    }

    console.log(`DPM Created: ${proxy1}. VaultId: ${vaultId1}`)

    const dependencies: StrategyDependenciesAaveV2 = {
      addresses: mainnetAddresses,
      provider: config.provider,
      getSwapData: swapData,
      user: config.address,
      contracts: {
        operationExecutor: await hre.ethers.getContractAt(
          'OperationExecutor',
          operationExecutorAddress,
          config.signer,
        ),
      },
      protocol: {
        version: AaveVersion.v2,
        getCurrentPosition: strategies.aave.v2.view,
        getProtocolData: protocols.aave.getAaveProtocolData,
      },
    }

    if (collateral === 'WSTETH' || debt === 'WSTETH') throw new Error('WSTETH is not supported yet')
    const collateralAddress = mainnetAddresses[collateral]

    if (collateral !== 'ETH') {
      await getToken(collateral, new BigNumber(deposit))
      await approve(collateralAddress, proxy1, new BigNumber(deposit), config, false)
    }

    const simulation = await strategies.aave.v2.openDepositAndBorrowDebt(
      {
        positionType: 'Borrow',
        slippage: new BigNumber(0.1),
        debtToken: { symbol: debt, precision: precisionMap[debt] },
        collateralToken: { symbol: collateral, precision: precisionMap[collateral] },
        amountCollateralToDepositInBaseUnit: new BigNumber(deposit),
        amountDebtToBorrowInBaseUnit: new BigNumber(borrow),
      },
      {
        ...dependencies,
        proxy: proxy1,
        isDPMProxy: true,
        user: config.address,
      },
    )

    const transactionValue = collateral === 'ETH' ? deposit : '0'

    const [status] = await executeThroughDPMProxy(
      proxy1,
      {
        address: operationExecutorAddress,
        calldata: operationExecutorContract.interface.encodeFunctionData('executeOp', [
          simulation.transaction.calls,
          simulation.transaction.operationName,
        ]),
      },
      config.signer,
      transactionValue,
    )

    console.log(`Transaction status: ${status}`)

    console.log(
      `Borrow position created. Collateral ${collateral}, Debt: ${debt} with proxy: ${proxy1}`,
    )
  })
