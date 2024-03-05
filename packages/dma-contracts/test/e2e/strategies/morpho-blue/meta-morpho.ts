import {
  AaveOracle,
  AaveProtocolDataProvider,
  AccountImplementation,
  AccountImplementation__factory,
  ERC20,
  ERC20__factory,
  Pool,
  WETH,
  WETH__factory,
} from '@abis/types/ethers-contracts'
import { ADDRESSES } from '@deploy-configurations/addresses'
import { DeployedSystem } from '@deploy-configurations/types/deployed-system'
import { Network } from '@deploy-configurations/types/network'
import { getNetwork } from '@deploy-configurations/utils/network'
import { ONE } from '@dma-common/constants'
import { addressesByNetwork, createDPMAccount, oneInchCallMock } from '@dma-common/test-utils'
import { RuntimeConfig } from '@dma-common/types/common'
import { testBlockNumberForMigrations } from '@dma-contracts/test/config'
import { restoreSnapshot, Snapshot, TestDeploymentSystem, TestHelpers } from '@dma-contracts/utils'
import { strategies } from '@dma-library'
import { AaveLikeStrategyAddresses } from '@dma-library/operations/aave-like'
import { BigNumber as BN } from '@ethersproject/bignumber/lib/bignumber'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import hre from 'hardhat'

describe.only('Migrate | AAVE V3 -> DPM | E2E', async () => {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  let snapshot: Snapshot
  let provider: ethers.providers.JsonRpcProvider
  let signer: SignerWithAddress
  let address: string
  let WETH: WETH
  let USDC: ERC20

  let aavePoolDataProvider: AaveProtocolDataProvider
  let dpmAccount: AccountImplementation
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
    console.log('Restoring snapshot')
    ;({ snapshot } = await restoreSnapshot({
      hre,
      blockNumber: testBlockNumberForMigrations,
      useFallbackSwap: true,
      debug: true,
    }))
    console.log('snapshot restored')
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

    await system.AccountGuard.contract.setWhitelist(system.OperationExecutor.contract.address, true)

    const [dpmProxy] = await createDPMAccount(system.AccountFactory.contract)

    if (!dpmProxy) {
      throw new Error('Failed to create DPM proxy')
    }

    dpmAccount = AccountImplementation__factory.connect(dpmProxy, signer)
  })

  it('should migrate EOA AAVE V3 (WETH/USDC) -> DPM AAVE V3 (WETH/USDC)', async () => {
    const USDCBalance = await USDC.balanceOf(address)

    // approve aWETH to DPM
    await USDC.approve(dpmAccount.address, USDCBalance.toString())

    const result = await strategies.common.erc4626.deposit(
      {
        vault: '0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB',
        depositTokenAddress: USDC.address,
        depositTokenPrecision: 6,
        depositTokenSymbol: 'USDC',
        pullTokenAddress: USDC.address,
        pullTokenPrecision: 6,
        pullTokenSymbol: 'USDC',
        amount: new BigNumber('1000000'),
        proxyAddress: dpmAccount.address,
        slippage: new BigNumber(1),
        user: address,
      },
      {
        provider: provider,
        addresses: aaveLikeAddresses,
        network: network,
        operationExecutor: aaveLikeAddresses.operationExecutor,
        getSwapData: oneInchCallMock(ONE.div(new BigNumber(3500)), {
          from: 6,
          to: 6,
        }),
      },
    )

    const tx = await dpmAccount.execute(system.OperationExecutor.contract.address, result.tx.data, {
      gasLimit: 5000000,
    })

    await tx.wait()

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
  })
})
