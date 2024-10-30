import {
  AaveProtocolDataProvider,
  AccountImplementation,
  AccountImplementation__factory,
  ERC20,
  ERC20__factory,
  Pool,
  Pool__factory,
  WETH,
  WETH__factory,
} from '@abis/types/ethers-contracts'
import { ADDRESSES, SystemKeys } from '@deploy-configurations/addresses'
import { DeployedSystem } from '@deploy-configurations/types/deployed-system'
import { Tokens } from '@deploy-configurations/types/deployment-config'
import { Network } from '@deploy-configurations/types/network'
import { getNetwork } from '@deploy-configurations/utils/network'
import { addressesByNetwork, createDPMAccount } from '@dma-common/test-utils'
import { RuntimeConfig } from '@dma-common/types/common'
import { testBlockNumberForMigrations } from '@dma-contracts/test/config'
import { restoreSnapshot, Snapshot } from '@dma-contracts/utils'
import { AaveLikeStrategyAddresses } from '@dma-library/operations/aave-like'
import { getAaveLikeSystemContracts } from '@dma-library/protocols/aave-like/utils'
import { migrateAave } from '@dma-library/strategies/aave/migrate/migrate-from-eoa'
import { PositionSource } from '@dma-library/strategies/common/migrate'
import { BigNumber as BN } from '@ethersproject/bignumber/lib/bignumber'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
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
  let aavePoolDataProvider: AaveProtocolDataProvider
  let dpmAccount: AccountImplementation
  let aavePool: Pool
  let config: RuntimeConfig
  let system: DeployedSystem
  let network: Network
  let addresses: ReturnType<typeof addressesByNetwork>
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
    config = snapshot.config

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

    // @ts-ignore
    ;({ poolDataProvider: aavePoolDataProvider } = await getAaveLikeSystemContracts(
      aaveLikeAddresses,
      config.provider,
      'AAVE_V3',
    ))

    await system.AccountGuard.contract.setWhitelist(system.OperationExecutor.contract.address, true)
    aavePool = Pool__factory.connect(addresses.pool, config.signer)

    const [dpmProxy] = await createDPMAccount(system.AccountFactory.contract)

    if (!dpmProxy) {
      throw new Error('Failed to create DPM proxy')
    }

    dpmAccount = AccountImplementation__factory.connect(dpmProxy, signer)
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

    const migrationArgs = {
      collateralToken: { address: WETH.address, symbol: 'WETH' as Tokens, precision: 18 },
      debtToken: { address: USDC.address, symbol: 'USDC' as Tokens, precision: 18 },
      positionSource: PositionSource.EOA,
      sourceAddress: address,
      protocol: SystemKeys.AAVE,
    }
    const result = await migrateAave(migrationArgs, {
      proxy: dpmAccount.address,
      provider: provider,
      user: address,
      network: Network.MAINNET,
      operationExecutor: system.OperationExecutor.contract.address,
      erc20ProxyActions: system.ERC20ProxyActions.contract.address,
    })

    await signer.sendTransaction({ to: result.approval.to, data: result.approval.data })

    const tx = await dpmAccount.execute(
      system.OperationExecutor.contract.address,
      result.migration.tx.data,
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
      dpmAccount.address,
    )
    const aaveDebtOnProxyAfterTransaction = await aavePoolDataProvider.getUserReserveData(
      USDC.address,
      dpmAccount.address,
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
