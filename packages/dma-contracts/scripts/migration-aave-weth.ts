/* eslint-disable */
import {
  AaveProtocolDataProvider__factory,
  AccountImplementation__factory,
  ERC20__factory,
  Pool__factory,
  WETH__factory,
} from '@abis/types/ethers-contracts'
import { addressesByNetwork, createDPMAccount } from '@dma-common/test-utils'
import { executeThroughDPMProxy } from '@dma-common/utils/execute'
import { AaveVersion, Network } from '@dma-library'
import { migrateAave } from '@dma-library/strategies/aave/migrate/migrate-from-eoa'
import { getCurrentPositionAaveV3 } from '@dma-library/views/aave'
import { BigNumber as BN } from 'ethers'
import hre from 'hardhat'

import { DeploymentSystem } from './deployment/deploy'

async function main() {
  const signer = hre.ethers.provider.getSigner(0)
  const network = Network.MAINNET
  const provider = hre.ethers.provider
  const address = await signer.getAddress()
  console.log(`Deployer address: ${address}`)
  console.log(`Network: ${network}`)

  const hideLogging = false

  const ds = new DeploymentSystem(hre)

  await ds.init(hideLogging)

  console.log('Resetting node to latest block')
  await ds.resetNodeToLatestBlock()

  const systemConfigPath = `/test/mainnet.conf.ts`
  console.log('Loading config from', systemConfigPath)
  await ds.loadConfig(systemConfigPath)
  await ds.extendConfig('/test/local-extend.conf.ts')

  await ds.deployAll()
  await ds.addAllEntries()

  const dsSystem = ds.getSystem()
  const { system, config: systemConfig } = dsSystem

  await system.AccountGuard.contract.setWhitelist(system.OperationExecutor.contract.address, true)

  const addresses = addressesByNetwork(network)

  const aaveLikeAddresses = {
    tokens: {
      WETH: addresses.WETH,
      DAI: addresses.DAI,
      USDC: addresses.USDC,
      ETH: addresses.ETH,
    },
    operationExecutor: system.OperationExecutor.contract.address,
    chainlinkEthUsdPriceFeed: addresses.chainlinkEthUsdPriceFeed,
    oracle: addresses.aaveOracle,
    lendingPool: addresses.pool,
    poolDataProvider: addresses.poolDataProvider,
  }

  const USDCaddress = addresses.USDC
  const WETHAddress = addresses.WETH

  const aavePoolDataProvider = addresses.poolDataProvider
  const poolAddress = addresses.pool

  const aaveProtocolDataProviderContract = AaveProtocolDataProvider__factory.connect(
    aavePoolDataProvider,
    signer,
  )

  const wethReserveAaveData = await aaveProtocolDataProviderContract.getReserveTokensAddresses(
    WETHAddress,
  )
  const usdcReserveAaveData = await aaveProtocolDataProviderContract.getReserveTokensAddresses(
    USDCaddress,
  )

  const aWETHaddress = wethReserveAaveData.aTokenAddress
  const vdUsdc = usdcReserveAaveData.variableDebtTokenAddress

  const wethContract = WETH__factory.connect(WETHAddress, signer)
  const aWETHContract = ERC20__factory.connect(aWETHaddress, signer)
  const usdcContract = ERC20__factory.connect(USDCaddress, signer)
  const vdUsdcContract = ERC20__factory.connect(vdUsdc, signer)
  const poolContract = Pool__factory.connect(poolAddress, signer)

  const oneEther = BN.from('1000000000000000000')

  // Deposit 10 ETH to WETH
  await wethContract.deposit({ value: oneEther.mul(10) })

  // Supply 8 WETH to Aave
  await wethContract.approve(poolAddress, oneEther.mul(8))
  await poolContract['supply(address,uint256,address,uint16)'](
    WETHAddress,
    oneEther.mul(8),
    address,
    0,
  )

  // Borrow 1000 USDC
  const oneUSDC = BN.from('1000000')
  await poolContract['borrow(address,uint256,uint256,uint16,address)'](
    USDCaddress,
    oneUSDC.mul(1000),
    2,
    0,
    address,
  )

  // Print current USDC Balance
  const usdcBalance = await usdcContract.balanceOf(address)
  console.log('USDC Balance on Signer after Borrow: ', usdcBalance.toString())

  // Print aWETH Balance
  const aWETHBalance = await aWETHContract.balanceOf(address)
  console.log('aWETH Balance on Signer after Supply: ', aWETHBalance.toString())

  const aaveCollateralOnWalletBeforeTransaction =
    await aaveProtocolDataProviderContract.getUserReserveData(WETHAddress, address)
  const aaveDebtOnWalletBeforeTransaction =
    await aaveProtocolDataProviderContract.getUserReserveData(USDCaddress, address)

  console.log(
    '[EOA] WETH Balance on AAVE before transaction: ',
    aaveCollateralOnWalletBeforeTransaction.currentATokenBalance.toString(),
  )
  console.log(
    '[EOA] USDC Debt on AAVE before transaction: ',
    aaveDebtOnWalletBeforeTransaction.currentVariableDebt.toString(),
  )

  const [dpmProxy] = await createDPMAccount(system.AccountFactory.contract)

  if (!dpmProxy) {
    throw new Error('Failed to create DPM proxy')
  }

  // approve aWETH to DPM
  await aWETHContract.approve(dpmProxy, aWETHBalance)

  const currentPosition = await getCurrentPositionAaveV3(
    {
      collateralToken: { symbol: 'WETH', precision: 18 },
      proxy: address,
      debtToken: { symbol: 'USDC', precision: 6 },
    },
    {
      addresses: aaveLikeAddresses,
      provider: provider,
      protocolVersion: AaveVersion.v3,
    },
  )

  console.log('[EOA] Current Position from dma: ', {
    collateral: {
      amount: currentPosition.collateral.amount.toString(),
      symbol: currentPosition.collateral.symbol,
    },
    debt: {
      amount: currentPosition.debt.amount.toString(),
      symbol: currentPosition.debt.symbol,
    },
  })

  const result = await migrateAave(
    {
      aToken: {
        address: aWETHaddress,
        amount: aWETHBalance,
      },
      vdToken: {
        address: vdUsdc,
      },
    },
    {
      protocolType: 'AAVE_V3' as const,
      proxy: dpmProxy,
      provider: provider,
      user: address,
      currentPosition: currentPosition,
      network: Network.MAINNET,
      addresses: aaveLikeAddresses,
    },
  )

  const dpmProxyContract = AccountImplementation__factory.connect(dpmProxy, signer)

  const tx = await dpmProxyContract.execute(
    system.OperationExecutor.contract.address,
    result.tx.data,
    {
      gasLimit: 5000000,
    },
  )

  await tx.wait()

  const aaveCollateralOnWalletAfterTransaction =
    await aaveProtocolDataProviderContract.getUserReserveData(WETHAddress, address)
  const aaveDebtOnWalletAfterTransaction =
    await aaveProtocolDataProviderContract.getUserReserveData(USDCaddress, address)

  console.log(
    '[EOA] WETH Balance on AAVE after transaction: ',
    aaveCollateralOnWalletAfterTransaction.currentATokenBalance.toString(),
  )
  console.log(
    '[EOA] USDC Debt on AAVE after transaction: ',
    aaveDebtOnWalletAfterTransaction.currentVariableDebt.toString(),
  )

  const aaveCollateralOnProxyAfterTransaction =
    await aaveProtocolDataProviderContract.getUserReserveData(WETHAddress, dpmProxy!)
  const aaveDebtOnProxyAfterTransaction = await aaveProtocolDataProviderContract.getUserReserveData(
    USDCaddress,
    dpmProxy!,
  )

  console.log(
    '[Proxy] WETH Balance on AAVE after transaction: ',
    aaveCollateralOnProxyAfterTransaction.currentATokenBalance.toString(),
  )
  console.log(
    '[Proxy] USDC Debt on AAVE after transaction',
    aaveDebtOnProxyAfterTransaction.currentVariableDebt.toString(),
  )
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
