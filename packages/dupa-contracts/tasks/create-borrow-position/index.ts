import { AAVETokens, ADDRESSES, CONTRACT_NAMES, strategies } from '@oasisdex/dupa-library'
import BigNumber from 'bignumber.js'
import { task } from 'hardhat/config'

import { AAVETokensToGet, buildGetTokenFunction } from '../../../dupa-common/utils/aave'
import { executeThroughDPMProxy } from '../../../dupa-common/utils/deploy'
import init from '../../../dupa-common/utils/init'
import { getOneInchCall } from '../../../dupa-common/utils/swap/OneInchCall'
import { oneInchCallMock } from '../../../dupa-common/utils/swap/OneInchCallMock'
import { amountToWei, approve } from '../../../dupa-common/utils/common'
import { createDPMAccount } from '../../../dupa-library/test/fixtures/factories'
import { StrategiesDependencies } from '../../../dupa-library/test/fixtures/types'

type CreateBorrowPositionArgs = {
  serviceRegistry: string
  accountFactory: string
  collateral: AAVETokensToGet | 'ETH'
  debt: AAVETokens
  deposit: string
  borrow: string
  usefallbackswap: boolean
}

const precisionMap: Record<AAVETokens, number> = {
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

    const getToken = buildGetTokenFunction(config, hre)

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
      CONTRACT_NAMES.common.OPERATION_EXECUTOR,
    )

    const operationExecutorContract = await hre.ethers.getContractAt(
      'OperationExecutor',
      operationExecutorAddress,
      config.signer,
    )

    const swapAddress = await serviceRegistryContract.getRegisteredService(
      CONTRACT_NAMES.common.SWAP,
    )

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
      accountFactory: accountFactory,
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

    const dependencies: StrategiesDependencies = {
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
    }

    const collateralAddress = mainnetAddresses[collateral]

    if (collateral !== 'ETH') {
      await getToken(collateral, deposit.toString())
      await approve(collateralAddress, proxy1, new BigNumber(deposit), config, false)
    }

    const simulation = await strategies.aave.openDepositAndBorrowDebt(
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
