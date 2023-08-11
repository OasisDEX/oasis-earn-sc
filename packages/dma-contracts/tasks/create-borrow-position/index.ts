import { ADDRESSES } from '@deploy-configurations/addresses'
import { loadContractNames } from '@deploy-configurations/constants'
import { Network } from '@deploy-configurations/types/network'
import { createDPMAccount, getOneInchCall } from '@dma-common/test-utils'
import { amountToWei } from '@dma-common/utils/common'
import { executeThroughDPMProxy } from '@dma-common/utils/execute'
import init from '@dma-common/utils/init'
import { getAccountFactory } from '@dma-common/utils/proxy'
import { approve } from '@dma-common/utils/tx'
import { AAVETokensToGet, buildGetTokenFunction } from '@dma-contracts/test/utils/aave'
import { AAVETokens, AaveVersion, protocols, strategies } from '@dma-library'
import { AaveV3OpenDepositBorrowDependencies } from '@dma-library/strategies/aave/open-deposit-borrow'
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
  CBETH: 18,
  DAI: 18,
  RETH: 18,
}

const SERVICE_REGISTRY_NAMES = loadContractNames(Network.MAINNET)

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
      WSTETH: ADDRESSES[Network.MAINNET].common.WSTETH,
      CBETH: ADDRESSES[Network.MAINNET].common.CBETH,
      RETH: ADDRESSES[Network.MAINNET].common.RETH,
      aaveOracle: ADDRESSES[Network.MAINNET].aave.v3.AaveOracle,
      pool: ADDRESSES[Network.MAINNET].aave.v3.Pool,
      poolDataProvider: ADDRESSES[Network.MAINNET].aave.v3.AavePoolDataProvider,
      chainlinkEthUsdPriceFeed: ADDRESSES[Network.MAINNET].common.ChainlinkPriceOracle_ETHUSD,
      operationExecutor: operationExecutorAddress,
      accountFactory: accountFactory,
    }

    const swapData = getOneInchCall(swapAddress)

    const [proxy1, vaultId1] = await createDPMAccount(
      await getAccountFactory(config.signer, mainnetAddresses.accountFactory),
    )

    if (proxy1 === undefined) {
      throw new Error(`Can't create DPM accounts`)
    }

    console.log(`DPM Created: ${proxy1}. VaultId: ${vaultId1}`)

    const collateralToken = {
      symbol: collateral,
      precision: precisionMap[collateral],
    }
    const debtToken = {
      symbol: debt,
      precision: precisionMap[debt],
    }
    const currentPosition = await strategies.aave.v3.view(
      {
        collateralToken,
        debtToken,
        proxy: proxy1,
      },
      { addresses: mainnetAddresses, provider: config.provider },
    )
    const dependencies: AaveV3OpenDepositBorrowDependencies = {
      addresses: mainnetAddresses,
      provider: config.provider,
      getSwapData: swapData,
      user: config.address,
      protocol: {
        version: AaveVersion.v3,
        getCurrentPosition: strategies.aave.v3.view,
        getProtocolData: protocols.aave.getAaveProtocolData,
      },
      positionType: 'Borrow',
      proxy: proxy1,
      network: Network.MAINNET,
      currentPosition,
    }

    if (collateral === 'WSTETH' || debt === 'WSTETH') throw new Error('WSTETH is not supported yet')
    const collateralAddress = mainnetAddresses[collateral]

    if (collateral !== 'ETH') {
      await getToken(collateral, new BigNumber(deposit))
      await approve(collateralAddress, proxy1, new BigNumber(deposit), config, false)
    }

    const simulation = await strategies.aave.v3.openDepositBorrow(
      {
        slippage: new BigNumber(0.1),
        debtToken: { symbol: debt, precision: precisionMap[debt] },
        collateralToken: { symbol: collateral, precision: precisionMap[collateral] },
        amountCollateralToDepositInBaseUnit: new BigNumber(deposit),
        amountDebtToBorrowInBaseUnit: new BigNumber(borrow),
        entryToken: { symbol: 'ETH', precision: 18 },
        positionType: 'Borrow',
      },
      dependencies,
    )

    const transactionValue = collateral === 'ETH' ? deposit : '0'

    const [status, receipt] = await executeThroughDPMProxy(
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

    const positionCreatedEventSignature = 'CreatePosition(address,string,string,address,address)'
    const signatureBytes = hre.ethers.utils.toUtf8Bytes(positionCreatedEventSignature)
    const signature = hre.ethers.utils.keccak256(signatureBytes)
    console.log('signature', signature)
    console.log('logs', receipt.logs)
    console.log(
      'positionCreatedEvent',
      receipt.logs.filter(log => log.topics[0] === signature),
    )
    console.log(`Transaction status: ${status}`)

    console.log(
      `Borrow position created. Collateral ${collateral}, Debt: ${debt} with proxy: ${proxy1}`,
    )
  })
