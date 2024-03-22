import {
  AaveProtocolDataProvider,
  AccountImplementation,
  AccountImplementation__factory,
  ERC20,
  ERC20__factory,
  IAccountImplementation,
  IAccountImplementation__factory,
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
import { restoreSnapshot, Snapshot } from '@dma-contracts/utils'
import { AaveLikeStrategyAddresses } from '@dma-library/operations/aave-like'
import { getAaveLikeSystemContracts } from '@dma-library/protocols/aave-like/utils'
import { migrateAave } from '@dma-library/strategies/aave/migrate/migrate-from-eoa'
import { PositionSource } from '@dma-library/strategies/aave-like'
import { impersonateAccount } from '@nomicfoundation/hardhat-network-helpers'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { ethers } from 'ethers'
import hre from 'hardhat'

// 0x2bA1eefeBb0A1807D1Df52c7EFc1aBdc9FcF5475 aave weth vault @ block : 19468682

describe.only('Migrate | AAVE V3 DsProxy -> DPM | E2E', async () => {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  let snapshot: Snapshot
  let provider: ethers.providers.JsonRpcProvider
  let signer: SignerWithAddress
  let address: string
  let WETH: WETH
  let DAI: ERC20
  let aavePoolDataProvider: AaveProtocolDataProvider
  let dpmAccount: AccountImplementation
  let stolenVault: IAccountImplementation
  let config: RuntimeConfig
  let system: DeployedSystem
  let network: Network
  let addresses: ReturnType<typeof addressesByNetwork>
  let aaveLikeAddresses: AaveLikeStrategyAddresses

  /* eslint-enable @typescript-eslint/no-unused-vars */

  beforeEach(async () => {
    ;({ snapshot } = await restoreSnapshot({
      hre,
      blockNumber: 19468682,
      useFallbackSwap: true,
    }))
    stolenVault = await IAccountImplementation__factory.connect(
      '0x2bA1eefeBb0A1807D1Df52c7EFc1aBdc9FcF5475',
      hre.ethers.provider,
    )
    const vaultOwner = await stolenVault.owner()
    await impersonateAccount(vaultOwner)
    const owner = await hre.ethers.provider.getSigner(vaultOwner)
    // @ts-ignore
    signer = owner

    provider = signer.provider as ethers.providers.JsonRpcProvider

    address = await signer.getAddress()

    console.log('Address: ', address)
    console.log('Stolen vault : ', stolenVault.address)

    system = snapshot.testSystem.deployment.system
    config = snapshot.config

    network = await getNetwork(config.provider)

    WETH = WETH__factory.connect(ADDRESSES[network].common.WETH, config.signer)
    DAI = ERC20__factory.connect(ADDRESSES[network].common.DAI, config.signer)

    addresses = addressesByNetwork(Network.MAINNET)

    aaveLikeAddresses = {
      tokens: {
        WETH: WETH.address,
        DAI: DAI.address,
        ETH: ADDRESSES[network].common.ETH,
        USDC: ADDRESSES[network].common.USDC,
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
    await system.AccountGuard.contract.setWhitelist(system.ERC20ProxyActions.contract.address, true)

    const [dpmProxy] = await createDPMAccount(system.AccountFactory.contract, address)

    if (!dpmProxy) {
      throw new Error('Failed to create DPM proxy')
    }

    dpmAccount = AccountImplementation__factory.connect(dpmProxy, signer)
  })

  it('should migrate dsProxy AAVE V3 (WETH/DAI) -> DPM AAVE V3 (WETH/DAI)', async () => {
    const aaveCollateralOnWalletBeforeTransaction = await aavePoolDataProvider.getUserReserveData(
      WETH.address,
      stolenVault.address,
    )
    const aaveDebtOnWalletBeforeTransaction = await aavePoolDataProvider.getUserReserveData(
      DAI.address,
      stolenVault.address,
    )

    console.log(
      '[  dsProxy  ] WETH Balance on AAVE before transaction : ',
      ethers.utils.formatUnits(
        aaveCollateralOnWalletBeforeTransaction.currentATokenBalance.toString(),
        18,
      ),
    )
    console.log(
      '[  dsProxy  ] DAI Debt on AAVE before transaction     : ',
      ethers.utils.formatUnits(
        aaveDebtOnWalletBeforeTransaction.currentVariableDebt.toString(),
        18,
      ),
    )

    const migrationArgs = {
      collateralToken: { address: WETH.address, symbol: 'WETH' as Tokens, precision: 18 },
      debtToken: { address: DAI.address, symbol: 'DAI' as Tokens, precision: 18 },
      positionSource: PositionSource.DS_PROXY,
      sourceAddress: stolenVault.address,
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
      DAI.address,
      address,
    )

    console.log(
      '[  dsProxy  ] WETH Balance on AAVE after transaction  : ',
      ethers.utils.formatUnits(
        aaveCollateralOnWalletAfterTransaction.currentATokenBalance.toString(),
        18,
      ),
    )
    console.log(
      '[  dsProxy  ] DAI Debt on AAVE after transaction      : ',
      ethers.utils.formatUnits(aaveDebtOnWalletAfterTransaction.currentVariableDebt.toString(), 18),
    )

    const aaveCollateralOnProxyAfterTransaction = await aavePoolDataProvider.getUserReserveData(
      WETH.address,
      dpmAccount.address,
    )
    const aaveDebtOnProxyAfterTransaction = await aavePoolDataProvider.getUserReserveData(
      DAI.address,
      dpmAccount.address,
    )

    console.log(
      '[dpm account] WETH Balance on AAVE after transaction  : ',
      ethers.utils.formatUnits(
        aaveCollateralOnProxyAfterTransaction.currentATokenBalance.toString(),
        18,
      ),
    )
    console.log(
      '[dpm account] DAI Debt on AAVE after transaction      :',
      ethers.utils.formatUnits(aaveDebtOnProxyAfterTransaction.currentVariableDebt.toString(), 18),
    )

    expect(aaveCollateralOnWalletAfterTransaction.currentATokenBalance).to.be.equal(0)
    expect(aaveDebtOnWalletAfterTransaction.currentVariableDebt).to.be.equal(0)
    expect(aaveCollateralOnProxyAfterTransaction.currentATokenBalance).to.be.gte(
      aaveCollateralOnWalletBeforeTransaction.currentATokenBalance,
    )
  })
})
