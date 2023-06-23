import { optimismConfig } from '@deploy-configurations/configs'
import { getOneInchCall, optimismLiquidityProviders } from '@dma-common/test-utils'
import { AaveVersion, strategies } from '@dma-library'
import { AaveGetCurrentPositionDependencies } from '@dma-library/strategies/aave/get-current-position'
import { RiskRatio } from '@domain'
import {
  AaveCloseArgs,
  AaveCloseDependencies,
  AaveGetCurrentPositionArgs,
  AaveOpenArgs,
  AaveOpenSharedDependencies,
  WithV3Addresses,
} from '@oasisdex/dma-library'
import BigNumber from 'bignumber.js'
import { ethers } from 'hardhat'

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

  const opResult = await accountImplementation.execute(operationExecutor.address, encodedCallData, {
    value: ethers.utils.parseEther('10').toHexString(),
    gasLimit: ethers.BigNumber.from(10000000),
  })

  await opResult.wait()

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
    protocolVersion: AaveVersion.V3,
  }

  const currentPosition = await strategies.aave.v3.view(getPositionArgs, getPositionDeps)

  console.log(`Position was opened successfully`)

  console.log(`Current Position Collateral: ${currentPosition.collateral.amount.toString()}`)
  console.log(`Current Position Debt: ${currentPosition.debt.amount.toString()}`)

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
    collateral: {
      amount: currentPosition.collateral.amount,
    },
    shouldCloseToCollateral: true,
    collateralAmountLockedInProtocolInWei: currentPosition.collateral.amount,
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

  const closeResult = await accountImplementation.execute(
    operationExecutor.address,
    encodedCloseCallData,
    {
      gasLimit: ethers.BigNumber.from(10000000),
    },
  )

  await closeResult.wait()

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
