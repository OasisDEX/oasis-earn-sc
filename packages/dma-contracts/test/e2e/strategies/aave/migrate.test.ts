import {
  AaveOracle,
  AccountImplementation__factory,
  ERC20__factory,
  Pool,
  Pool__factory,
  PoolDataProvider,
  WETH__factory,
} from '@abis/types/ethers-contracts'
import { ADDRESSES } from '@deploy-configurations/addresses'
import { DeployedSystem } from '@deploy-configurations/types/deployed-system'
import { Network } from '@deploy-configurations/types/network'
import { getNetwork } from '@deploy-configurations/utils/network'
import { addressesByNetwork, createDPMAccount } from '@dma-common/test-utils'
import { RuntimeConfig } from '@dma-common/types/common'
import { testBlockNumberForAaveV3 } from '@dma-contracts/test/config'
import { restoreSnapshot, Snapshot, TestDeploymentSystem, TestHelpers } from '@dma-contracts/utils'
import { AaveVersion } from '@dma-library'
import { AaveLikeStrategyAddresses } from '@dma-library/operations/aave-like'
// import { getRefinanceOperationDefinition } from '@dma-library/operations/refinance'
import { getAaveLikeSystemContracts } from '@dma-library/protocols/aave-like/utils'
import { migrateAaveFromEOA } from '@dma-library/strategies/aave/migrate/migrate-from-eoa'
import { getCurrentPositionAaveV3 } from '@dma-library/views/aave'
import { BigNumber as BN } from '@ethersproject/bignumber/lib/bignumber'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { OperationsRegistry__factory, ServiceRegistry__factory } from '@typechain'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { ethers } from 'ethers'
import hre from 'hardhat'
describe('Migrate | AAVE V3 -> DPM | E2E', async () => {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  let snapshot: Snapshot
  let provider: ethers.providers.JsonRpcProvider
  let signer: SignerWithAddress
  let address: string
  let WETH: WETH
  let USDC: ERC20
  let AWETH: ERC20
  let VDUSDC: ERC20
  let aaveOracle: AaveOracle
  let aavePoolDataProvider: PoolDataProvider
  let aavePool: Pool
  let config: RuntimeConfig
  let system: DeployedSystem
  let testSystem: TestDeploymentSystem
  let helpers: TestHelpers
  let network: Network
  let addresses: ReturnType<typeof addressesByNetwork>
  let aaveLikeAddresses: AaveLikeStrategyAddresses
  const oneEther = BN.from('1000000000000000000')
  const oneUSDC = BN.from('1000000')

  /* eslint-enable @typescript-eslint/no-unused-vars */

  beforeEach(async () => {
    ;({ snapshot } = await restoreSnapshot({
      hre,
      blockNumber: testBlockNumberForAaveV3,
      useFallbackSwap: true,
    }))

    signer = await SignerWithAddress.create(
      snapshot.config.signer as ethers.providers.JsonRpcSigner,
    )

    provider = signer.provider as ethers.providers.JsonRpcProvider

    address = await signer.getAddress()

    console.log('Address: ', address)

    system = snapshot.testSystem.deployment.system
    testSystem = snapshot.testSystem
    config = snapshot.config
    helpers = snapshot.testSystem.helpers

    network = await getNetwork(config.provider)

    WETH = WETH__factory.connect(ADDRESSES[network].common.WETH, config.signer)
    USDC = ERC20__factory.connect(ADDRESSES[network].common.USDC, config.signer)

    addresses = addressesByNetwork(Network.MAINNET)

    aaveLikeAddresses = {
      tokens: {
        WETH: WETH.address,
        DAI: ADDRESSES[network].common.DAI,
        USDC: USDC.address,
        ETH: ADDRESSES[network].common.ETH,
      },
      operationExecutor: system.OperationExecutor.contract.address,
      chainlinkEthUsdPriceFeed: addresses.chainlinkEthUsdPriceFeed,
      oracle: addresses.aaveOracle,
      lendingPool: addresses.pool,
      poolDataProvider: addresses.poolDataProvider,
    }
    ;({ oracle: aaveOracle, poolDataProvider: aavePoolDataProvider } =
      await getAaveLikeSystemContracts(aaveLikeAddresses, config.provider, 'AAVE_V3'))

    await system.AccountGuard.contract.setWhitelist(system.OperationExecutor.contract.address, true)
    aavePool = Pool__factory.connect(addresses.pool, config.signer)

    const wethReserveAaveData = await aavePoolDataProvider.getReserveTokensAddresses(WETH.address)
    const usdcReserveAaveData = await aavePoolDataProvider.getReserveTokensAddresses(USDC.address)

    const aWETHaddress = wethReserveAaveData.aTokenAddress
    const vdUsdc = usdcReserveAaveData.variableDebtTokenAddress

    AWETH = ERC20__factory.connect(aWETHaddress, signer)
    VDUSDC = ERC20__factory.connect(vdUsdc, signer)
  })

  it('should migrate EOA AAVE V3 (WETH/USDC) -> DPM AAVE V3 (WETH/USDC)', async () => {
    await WETH.deposit({ value: oneEther.mul(10) })
    await WETH.approve(aavePool.address, oneEther.mul(10))
    await aavePool['supply(address,uint256,address,uint16)'](
      WETH.address,
      oneEther.mul(10),
      address,
      0,
    )
    await aavePool['borrow(address,uint256,uint256,uint16,address)'](
      USDC.address,
      oneUSDC.mul(1000),
      2,
      0,
      address,
    )

    // Print current USDC Balance
    const usdcBalance = await USDC.balanceOf(address)
    console.log('USDC Balance on Signer after Borrow: ', usdcBalance.toString())

    // Print aWETH Balance
    const aWETHBalance = await AWETH.balanceOf(address)
    console.log('aWETH Balance on Signer after Supply: ', aWETHBalance.toString())

    const aaveCollateralOnWalletBeforeTransaction = await aavePoolDataProvider.getUserReserveData(
      WETH.address,
      address,
    )
    const aaveDebtOnWalletBeforeTransaction = await aavePoolDataProvider.getUserReserveData(
      USDC.address,
      address,
    )

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

    console.log(`DPM Proxy: ${dpmProxy}`)

    // approve aWETH to DPM
    console.log(`Current aWETH Balance: ${aWETHBalance.toString()}`)
    await AWETH.approve(dpmProxy, new BigNumber(aWETHBalance.toString()).times(1.01).toFixed(0))

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

    const migrationArgs = {
      aToken: {
        address: AWETH.address,
        amount: aWETHBalance,
      },
      vdToken: {
        address: VDUSDC.address,
      },
    }

    console.log('Migration Args: ', migrationArgs)

    const result = await migrateAaveFromEOA(migrationArgs, {
      protocolType: 'AAVE_V3' as const,
      proxy: dpmProxy,
      provider: provider,
      user: address,
      currentPosition: currentPosition,
      network: Network.MAINNET,
      addresses: aaveLikeAddresses,
    })

    const dpmProxyContract = AccountImplementation__factory.connect(dpmProxy, signer)

    const tx = await dpmProxyContract.execute(
      system.OperationExecutor.contract.address,
      result.tx.data,
      {
        gasLimit: 5000000,
      },
    )

    await tx.wait()

    const aaveCollateralOnWalletAfterTransaction = await aavePoolDataProvider.getUserReserveData(
      WETH.address,
      address,
    )
    const aaveDebtOnWalletAfterTransaction = await aavePoolDataProvider.getUserReserveData(
      USDC.address,
      address,
    )

    console.log(
      '[EOA] WETH Balance on AAVE after transaction: ',
      aaveCollateralOnWalletAfterTransaction.currentATokenBalance.toString(),
    )
    console.log(
      '[EOA] USDC Debt on AAVE after transaction: ',
      aaveDebtOnWalletAfterTransaction.currentVariableDebt.toString(),
    )

    const aaveCollateralOnProxyAfterTransaction = await aavePoolDataProvider.getUserReserveData(
      WETH.address,
      dpmProxy!,
    )
    const aaveDebtOnProxyAfterTransaction = await aavePoolDataProvider.getUserReserveData(
      USDC.address,
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

    expect(aaveCollateralOnWalletAfterTransaction.currentATokenBalance).to.be.equal(0)
    expect(aaveDebtOnWalletAfterTransaction.currentVariableDebt).to.be.equal(0)
    expect(aaveCollateralOnProxyAfterTransaction.currentATokenBalance).to.be.gte(
      aaveCollateralOnWalletBeforeTransaction.currentATokenBalance,
    )
  })
})
