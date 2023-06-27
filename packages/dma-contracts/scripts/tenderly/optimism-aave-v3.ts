import { optimismConfig } from '@deploy-configurations/configs'
import { getOneInchCall, optimismLiquidityProviders } from '@dma-common/test-utils'
import { AaveGetCurrentPositionDependencies } from '@dma-library/strategies/aave/get-current-position'
import { RiskRatio } from '@domain'
import {
  AaveAdjustArgs,
  AaveCloseArgs,
  AaveCloseDependencies,
  AaveGetCurrentPositionArgs,
  AaveOpenArgs,
  AaveOpenSharedDependencies,
  AaveVersion,
  strategies,
  WithV3Addresses,
} from '@oasisdex/dma-library'
import BigNumber from 'bignumber.js'
import { ethers } from 'hardhat'

async function runTransaction(
  transaction: () => Promise<ethers.ContractTransaction>,
  name: string,
): Promise<ethers.ContractReceipt> {
  console.log(`Running ${name} transaction`)

  try {
    const result = await transaction()
    console.log(`${name} transaction hash: ${result.hash}`)
    return await result.wait()
  } catch (e) {
    console.error(`Error code: ${e.reason}`)
    console.error(`Error action: ${e.action}`)
    console.error(`Error nested message: ${e.error?.message}`)
    throw new Error(`Error while running ${name} transaction.`, {
      reason: e.reason,
      action: e.action,
      nestedMessage: e.error?.message,
    })
  }
}

async function main() {
  const signer = await ethers.provider.getSigner()

  const accountFactory = await ethers.getContractAt(
    'AccountFactory',
    optimismConfig.mpa.core.AccountFactory.address,
    signer,
  )

  const response = await accountFactory['createAccount()']()
  const accountResult = await response.wait()
  const event = accountResult.events?.find(e => e.event === 'AccountCreated')
  if (!event) {
    throw new Error('No AccountCreated event found in receipt')
  }
  const proxyAddress = event.args?.proxy as string
  if (!proxyAddress) {
    throw new Error('No proxy address found in AccountCreated event')
  }

  console.log(`DPM ACCOUNT: Proxy address: ${proxyAddress}, vault ID: ${event.args?.vaultId}`)

  const amountToDeposit = new BigNumber(10).pow(18)
  const balanceBefore = await signer.getBalance().then(b => {
    return new BigNumber(b.toString())
  })

  console.log(`Depositing: ${amountToDeposit.toString()} ETH`)

  const args: AaveOpenArgs = {
    debtToken: {
      symbol: 'USDC',
      precision: 6,
    },
    collateralToken: {
      symbol: 'ETH',
      precision: 18,
    },
    slippage: new BigNumber(0.3),
    multiple: new RiskRatio(new BigNumber(1.4), 'MULITPLE' as any),
    positionType: 'Multiply',
    depositedByUser: {
      collateralToken: {
        amountInBaseUnit: amountToDeposit,
      },
    },
  }

  const dependencies: AaveOpenSharedDependencies & WithV3Addresses = {
    network: 'optimism' as any,
    addresses: {
      DAI: optimismConfig.common.DAI.address,
      ETH: optimismConfig.common.ETH.address,
      WETH: optimismConfig.common.WETH.address,
      USDC: optimismConfig.common.USDC.address,
      WBTC: optimismConfig.common.WBTC.address,
      WSTETH: optimismConfig.common.WSTETH.address,
      CBETH: optimismConfig.common.CBETH.address,
      RETH: optimismConfig.common.RETH.address,
      pool: optimismConfig.aave.v3.Pool.address,
      aaveOracle: optimismConfig.aave.v3.AaveOracle.address,
      operationExecutor: optimismConfig.mpa.core.OperationExecutor.address,
      chainlinkEthUsdPriceFeed: optimismConfig.common.ChainlinkPriceOracle_ETHUSD.address,
      poolDataProvider: optimismConfig.aave.v3.AavePoolDataProvider.address,
    },
    provider: ethers.provider,
    user: await signer.getAddress(),
    proxy: proxyAddress,
    isDPMProxy: true,
    getSwapData: getOneInchCall(
      optimismConfig.mpa.core.Swap.address,
      optimismLiquidityProviders.filter(l => l !== 'OPTIMISM_BALANCER_V2'),
      10,
      'v5.0',
    ),
  }

  const transition = await strategies.aave.v3.open(args, dependencies)
  const operationExecutor = await ethers.getContractAt(
    'OperationExecutor',
    optimismConfig.mpa.core.OperationExecutor.address,
    signer,
  )

  const encodedCallData = operationExecutor.interface.encodeFunctionData('executeOp', [
    transition.transaction.calls,
    transition.transaction.operationName,
  ])

  const accountImplementation = await ethers.getContractAt('AccountImplementation', proxyAddress)

  await runTransaction(
    () =>
      accountImplementation.execute(operationExecutor.address, encodedCallData, {
        value: ethers.utils.parseEther('10').toHexString(),
        gasLimit: ethers.BigNumber.from(10000000),
      }),
    'open position',
  )

  const balanceaAfterOpen = await signer.getBalance().then(b => {
    return new BigNumber(b.toString())
  })

  const getPositionArgs: AaveGetCurrentPositionArgs = {
    collateralToken: {
      symbol: 'ETH',
      precision: 18,
    },
    debtToken: {
      symbol: 'USDC',
      precision: 6,
    },
    proxy: proxyAddress,
  }

  const getPositionDeps: AaveGetCurrentPositionDependencies = {
    addresses: dependencies.addresses,
    provider: dependencies.provider,
    protocolVersion: AaveVersion.v3,
  }

  const getter = () => strategies.aave.v3.view(getPositionArgs, getPositionDeps)
  let currentPosition = await getter()

  console.log(`Position was opened successfully`)

  console.log(`Current Position Collateral: ${currentPosition.collateral.amount.toString()}`)
  console.log(`Current Position Debt: ${currentPosition.debt.amount.toString()}`)

  console.log(`Trying to increase risk`)
  const increaseRiskArgs: AaveAdjustArgs = {
    debtToken: args.debtToken,
    collateralToken: args.collateralToken,
    slippage: args.slippage,
    positionType: args.positionType,
    multiple: new RiskRatio(new BigNumber(1.8), 'MULITPLE' as any),
  }

  const increaseRiskDeps: Omit<AaveV3AdjustDependencies, 'protocol'> = {
    ...dependencies,
    currentPosition: currentPosition,
  }

  const adjustTransition = await strategies.aave.v3.adjust(increaseRiskArgs, increaseRiskDeps)

  const adjustEncodedData = operationExecutor.interface.encodeFunctionData('executeOp', [
    adjustTransition.transaction.calls,
    adjustTransition.transaction.operationName,
  ])

  await runTransaction(
    () =>
      accountImplementation.execute(operationExecutor.address, adjustEncodedData, {
        gasLimit: 100_000_000,
      }),
    'increase risk',
  )

  console.log(`Adjustment was successful`)

  console.log(
    `Current Position Collateral and Debt: ${currentPosition.collateral.amount.toString()} ${currentPosition.debt.amount.toString()}}`,
  )
  currentPosition = await getter()

  console.log(
    `Current Position Collateral and Debt: ${currentPosition.collateral.amount.toString()} ${currentPosition.debt.amount.toString()}}`,
  )

  console.log(`Trying to decrease risk`)
  const decreaseRiskArgs: AaveAdjustArgs = {
    ...increaseRiskArgs,
    multiple: new RiskRatio(new BigNumber(1.4), 'MULITPLE' as any),
  }
  const decreaseRiskDeps: Omit<AaveV3AdjustDependencies, 'protocol'> = {
    ...increaseRiskDeps,
    currentPosition: currentPosition,
  }

  const decreaseRiskTransition = await strategies.aave.v3.adjust(decreaseRiskArgs, decreaseRiskDeps)

  const decreaseRiskEncodedData = operationExecutor.interface.encodeFunctionData('executeOp', [
    decreaseRiskTransition.transaction.calls,
    decreaseRiskTransition.transaction.operationName,
  ])

  await runTransaction(
    () =>
      accountImplementation.execute(operationExecutor.address, decreaseRiskEncodedData, {
        gasLimit: 100_000_000,
      }),
    'decrease risk',
  )

  console.log(`Adjustment was successful`)

  console.log(
    `Current Position Collateral and Debt: ${currentPosition.collateral.amount.toString()} ${currentPosition.debt.amount.toString()}}`,
  )
  currentPosition = await getter()

  console.log(
    `Current Position Collateral and Debt: ${currentPosition.collateral.amount.toString()} ${currentPosition.debt.amount.toString()}}`,
  )

  console.log(`Trying to close to ETH`)

  const closingArgs: AaveCloseArgs = {
    debtToken: {
      symbol: 'USDC',
      precision: 6,
    },
    collateralToken: {
      symbol: 'ETH',
      precision: 18,
    },
    slippage: new BigNumber(0.3),
    positionType: 'Multiply',
    shouldCloseToCollateral: false,
  }

  const closingDeps: AaveCloseDependencies = {
    currentPosition: currentPosition,
    network: 'optimism' as any,
    addresses: dependencies.addresses,
    provider: dependencies.provider,
    user: await signer.getAddress(),
    proxy: proxyAddress,
    isDPMProxy: true,
    getSwapData: dependencies.getSwapData,
  }

  const closeTransition = await strategies.aave.v3.close(closingArgs, closingDeps)

  const encodedCloseCallData = operationExecutor.interface.encodeFunctionData('executeOp', [
    closeTransition.transaction.calls,
    closeTransition.transaction.operationName,
  ])

  await runTransaction(
    () =>
      accountImplementation.execute(operationExecutor.address, encodedCloseCallData, {
        gasLimit: ethers.BigNumber.from(10000000),
      }),
    'Closing position',
  )

  console.log(`Position was closed successfully`)

  const balanceAfterClose = await signer.getBalance().then(b => {
    return new BigNumber(b.toString())
  })

  console.log(`ETH Balance Before Transactions: ${balanceBefore.toString()}`)
  console.log(`ETH Balance After Open: ${balanceaAfterOpen.toString()}`)
  console.log(`ETH Balance After Close: ${balanceAfterClose.toString()}`)
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
