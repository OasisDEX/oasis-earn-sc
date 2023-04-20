import { AAVETokensToGet, buildGetTokenFunction } from '@dma-contracts/test/utils/aave'
import { ADDRESSES } from '@oasisdex/addresses'
import { CONTRACT_NAMES } from '@oasisdex/dma-common/constants'
import { createDPMAccount } from '@oasisdex/dma-common/test-utils'
import { amountToWei, approve } from '@oasisdex/dma-common/utils/common'
import { executeThroughDPMProxy } from '@oasisdex/dma-common/utils/execute'
import init from '@oasisdex/dma-common/utils/init'
import { getAccountFactory } from '@oasisdex/dma-common/utils/proxy'
import { getOneInchCall, oneInchCallMock } from '@oasisdex/dma-common/utils/swap'
import { Network } from '@oasisdex/dma-deployments/types/network'
import { AAVETokens, AaveVersion, strategies } from '@oasisdex/dma-library'
import { getAaveProtocolData } from '@oasisdex/dma-library/protocols/aave/get-aave-protocol-data'
import BigNumber from 'bignumber.js'
import { task } from 'hardhat/config'

import { StrategyDependenciesAaveV2 } from '../../test/fixtures/types/strategies-dependencies'

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
      DAI: ADDRESSES[Network.MAINNET].common.DAI,
      ETH: ADDRESSES[Network.MAINNET].common.ETH,
      WETH: ADDRESSES[Network.MAINNET].common.WETH,
      STETH: ADDRESSES[Network.MAINNET].common.STETH,
      WBTC: ADDRESSES[Network.MAINNET].common.WBTC,
      USDC: ADDRESSES[Network.MAINNET].common.USDC,
      chainlinkEthUsdPriceFeed: ADDRESSES[Network.MAINNET].common.ChainlinkEthUsdPriceFeed,
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
        getProtocolData: getAaveProtocolData,
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
