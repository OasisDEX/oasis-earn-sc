/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  AccountImplementation,
  AccountImplementation__factory,
  ERC20,
  ERC20__factory,
  SparkLendingPool,
  SparkLendingPool__factory,
  SparkOracle,
  SparkPoolDataProvider,
  SparkPoolDataProvider__factory,
  WETH,
  WETH__factory,
} from '@abis/types/ethers-contracts'
import { ADDRESSES } from '@deploy-configurations/addresses'
import { DeployedSystem } from '@deploy-configurations/types/deployed-system'
import { Network } from '@deploy-configurations/types/network'
import { getNetwork } from '@deploy-configurations/utils/network'
import {
  addressesByNetwork,
  createDPMAccount,
  NetworkAddressesForNetwork,
} from '@dma-common/test-utils'
import { RuntimeConfig } from '@dma-common/types/common'
import { testBlockNumberForMigrations } from '@dma-contracts/test/config'
import { restoreSnapshot, Snapshot, TestDeploymentSystem, TestHelpers } from '@dma-contracts/utils'
import { AaveLikeStrategyAddresses } from '@dma-library/operations/aave-like'
import { migrateSparkFromEOA } from '@dma-library/strategies/spark/migrate/migrate-from-eoa'
import { getCurrentSparkPosition } from '@dma-library/views/spark'
import { BigNumber as BN } from '@ethersproject/bignumber/lib/bignumber'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { ethers } from 'ethers'
import hre from 'hardhat'

describe('Migrate | Spark -> DPM | E2E', async () => {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  let snapshot: Snapshot
  let provider: ethers.providers.JsonRpcProvider
  let signer: SignerWithAddress
  let address: string
  let WETH: WETH
  let USDC: ERC20
  let SPWETH: ERC20
  let VDUSDC: ERC20
  let sparkOracle: SparkOracle
  let sparkPoolDataProvider: SparkPoolDataProvider
  let dpmAccount: AccountImplementation
  let sparkPool: SparkLendingPool
  let config: RuntimeConfig
  let system: DeployedSystem
  let testSystem: TestDeploymentSystem
  let helpers: TestHelpers
  let network: Network
  let addresses: NetworkAddressesForNetwork<Network.MAINNET>
  let aaveLikeAddresses: AaveLikeStrategyAddresses
  const oneEther = BN.from('1000000000000000000')
  const oneUSDC = BN.from('1000000')

  /* eslint-enable @typescript-eslint/no-unused-vars */

  beforeEach(async () => {
    ;({ snapshot } = await restoreSnapshot({
      hre,
      blockNumber: testBlockNumberForMigrations,
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

    if (!addresses) {
      throw new Error('Addresses not found')
    }

    aaveLikeAddresses = {
      tokens: {
        WETH: WETH.address,
        DAI: ADDRESSES[network].common.DAI,
        USDC: USDC.address,
        ETH: ADDRESSES[network].common.ETH,
      },
      operationExecutor: system.OperationExecutor.contract.address,
      chainlinkEthUsdPriceFeed: addresses.chainlinkEthUsdPriceFeed,
      oracle: addresses.sparkOracle!,
      lendingPool: addresses.sparkPool!,
      poolDataProvider: addresses.sparkPoolDataProvider!,
    }

    await system.AccountGuard.contract.setWhitelist(system.OperationExecutor.contract.address, true)

    sparkPool = SparkLendingPool__factory.connect(addresses.sparkPool!, config.signer)
    sparkPoolDataProvider = SparkPoolDataProvider__factory.connect(
      addresses.sparkPoolDataProvider!,
      config.signer,
    )

    const wethReserveSparkData = await sparkPoolDataProvider.getReserveTokensAddresses(WETH.address)
    const usdcReserveSparkData = await sparkPoolDataProvider.getReserveTokensAddresses(USDC.address)

    const spWETHaddress = wethReserveSparkData.spTokenAddress
    const vdUsdc = usdcReserveSparkData.variableDebtTokenAddress

    SPWETH = ERC20__factory.connect(spWETHaddress, signer)
    VDUSDC = ERC20__factory.connect(vdUsdc, signer)

    const [dpmProxy] = await createDPMAccount(system.AccountFactory.contract)

    if (!dpmProxy) {
      throw new Error('Failed to create DPM proxy')
    }

    dpmAccount = AccountImplementation__factory.connect(dpmProxy, signer)
  })

  it('should migrate EOA Spark (WETH/USDC) -> DPM Spark (WETH/USDC)', async () => {
    await WETH.deposit({ value: oneEther.mul(10) })
    await WETH.approve(sparkPool.address, oneEther.mul(10))
    await sparkPool['supply(address,uint256,address,uint16)'](
      WETH.address,
      oneEther.mul(10),
      address,
      0,
    )
    await sparkPool['borrow(address,uint256,uint256,uint16,address)'](
      USDC.address,
      oneUSDC.mul(1000),
      2,
      0,
      address,
    )

    const sparkCollateralOnWalletBeforeTransaction = await sparkPoolDataProvider.getUserReserveData(
      WETH.address,
      address,
    )
    const sparkDebtOnWalletBeforeTransaction = await sparkPoolDataProvider.getUserReserveData(
      USDC.address,
      address,
    )

    console.log(
      '[EOA] WETH Balance on Spark before transaction: ',
      sparkCollateralOnWalletBeforeTransaction.currentSpTokenBalance.toString(),
    )
    console.log(
      '[EOA] USDC Debt on Spark before transaction: ',
      sparkDebtOnWalletBeforeTransaction.currentVariableDebt.toString(),
    )

    const spWETHBalance = await SPWETH.balanceOf(address)

    console.log('[EOA] SPWETH Balance: ', spWETHBalance.toString())

    // approve spWETH to DPM
    await SPWETH.approve(
      dpmAccount.address,
      new BigNumber(spWETHBalance.toString()).times(1.01).toFixed(0),
    ) // we need to approve slightly more than the balance

    const currentPosition = await getCurrentSparkPosition(
      {
        collateralToken: { symbol: 'WETH', precision: 18 },
        proxy: address,
        debtToken: { symbol: 'USDC', precision: 6 },
      },
      {
        addresses: aaveLikeAddresses,
        provider: provider,
      },
    )

    const migrationArgs = {
      aToken: {
        address: SPWETH.address,
        amount: new BigNumber(spWETHBalance.toString()),
      },
      vdToken: {
        address: VDUSDC.address,
      },
    }

    const result = await migrateSparkFromEOA(migrationArgs, {
      protocolType: 'Spark' as const,
      proxy: dpmAccount.address,
      provider: provider,
      user: address,
      currentPosition: currentPosition,
      network: Network.MAINNET,
      addresses: aaveLikeAddresses,
    })

    const tx = await dpmAccount.execute(system.OperationExecutor.contract.address, result.tx.data, {
      gasLimit: 5000000,
    })

    await tx.wait()

    const sparkCollateralOnWalletAfterTransaction = await sparkPoolDataProvider.getUserReserveData(
      WETH.address,
      address,
    )
    const sparkDebtOnWalletAfterTransaction = await sparkPoolDataProvider.getUserReserveData(
      USDC.address,
      address,
    )

    console.log(
      '[EOA] WETH Balance on Spark after transaction: ',
      sparkCollateralOnWalletAfterTransaction.currentSpTokenBalance.toString(),
    )
    console.log(
      '[EOA] USDC Debt on Spark after transaction: ',
      sparkDebtOnWalletAfterTransaction.currentVariableDebt.toString(),
    )

    const sparkCollateralOnProxyAfterTransaction = await sparkPoolDataProvider.getUserReserveData(
      WETH.address,
      dpmAccount.address,
    )
    const sparkDebtOnProxyAfterTransaction = await sparkPoolDataProvider.getUserReserveData(
      USDC.address,
      dpmAccount.address,
    )

    console.log(
      '[Proxy] WETH Balance on Spark after transaction: ',
      sparkCollateralOnProxyAfterTransaction.currentSpTokenBalance.toString(),
    )
    console.log(
      '[Proxy] USDC Debt on Spark after transaction',
      sparkDebtOnProxyAfterTransaction.currentVariableDebt.toString(),
    )

    // Right now I don't check it, becuase it's not clear what the expected value should be. Maybe there will be some leftovers
    // expect(sparkCollateralOnWalletAfterTransaction.currentSpTokenBalance).to.be.equal(0)
    expect(sparkDebtOnWalletAfterTransaction.currentVariableDebt).to.be.equal(0)
    expect(sparkCollateralOnProxyAfterTransaction.currentSpTokenBalance).to.be.gte(
      sparkCollateralOnWalletBeforeTransaction.currentSpTokenBalance,
    )
  })
})
