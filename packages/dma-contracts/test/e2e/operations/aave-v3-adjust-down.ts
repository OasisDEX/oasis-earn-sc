import { ADDRESSES } from '@deploy-configurations/addresses'
import { Address } from '@deploy-configurations/types/address'
import { DeployedSystem } from '@deploy-configurations/types/deployed-system'
import { Network } from '@deploy-configurations/types/network'
import { getNetwork } from '@deploy-configurations/utils/network'
import { addressesByNetwork, asPercentageValue } from '@dma-common/test-utils'
import { RuntimeConfig } from '@dma-common/types/common'
import { testBlockNumberForAaveV3 } from '@dma-contracts/test/config'
import { adjustRiskDownAAVEv3 } from '@dma-contracts/test/utils/aave/aave.operation.adjust-risk-down'
import { createETHPositionAAVEv3 } from '@dma-contracts/test/utils/aave/aave.operation.create-position'
import { enableZeroFee } from '@dma-contracts/test/utils/enable-zero-fees'
import { fundMockExchange } from '@dma-contracts/test/utils/fund-mock-exchange'
import { restoreSnapshot, Snapshot, TestDeploymentSystem, TestHelpers } from '@dma-contracts/utils'
import { toSolidityPercentage } from '@dma-contracts/utils/percentage.utils'
import { AaveLikeStrategyAddresses } from '@dma-library/operations/aave-like'
import { getAaveLikeSystemContracts, getContract } from '@dma-library/protocols/aave-like/utils'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ERC20, ERC20__factory, WETH, WETH__factory } from '@typechain'
import { expect } from 'chai'
import { ethers } from 'ethers'
import hre from 'hardhat'

describe('AAVE V3 | Adjust Risk Down | E2E', async () => {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  let snapshot: Snapshot
  let signer: SignerWithAddress
  let user: SignerWithAddress
  let WETH: WETH
  let DAI: ERC20
  let USDC: ERC20
  let oracle: Awaited<ReturnType<typeof getContract>>
  let ETHAddress: Address
  let slippage: ReturnType<typeof asPercentageValue>
  let config: RuntimeConfig
  let system: DeployedSystem
  let testSystem: TestDeploymentSystem
  let helpers: TestHelpers
  let network: Network
  let addresses: ReturnType<typeof addressesByNetwork>
  let aaveLikeAddresses: AaveLikeStrategyAddresses

  /* eslint-enable @typescript-eslint/no-unused-vars */

  beforeEach(async () => {
    ;({ snapshot } = await restoreSnapshot(
      {
        hre,
        blockNumber: testBlockNumberForAaveV3,
        useFallbackSwap: true, // switch to true to use mock exchange
        debug: false,
      },
      [fundMockExchange, enableZeroFee],
    ))

    signer = await SignerWithAddress.create(
      snapshot.config.signer as ethers.providers.JsonRpcSigner,
    )
    user = (await hre.ethers.getSigners())[1]

    system = snapshot.testSystem.deployment.system
    testSystem = snapshot.testSystem
    config = snapshot.config
    helpers = snapshot.testSystem.helpers

    network = await getNetwork(config.provider)

    ETHAddress = ADDRESSES[network].common.ETH
    WETH = WETH__factory.connect(ADDRESSES[network].common.WETH, config.signer)
    DAI = ERC20__factory.connect(ADDRESSES[network].common.DAI, config.signer)
    USDC = ERC20__factory.connect(ADDRESSES[network].common.USDC, config.signer)

    addresses = addressesByNetwork(Network.MAINNET)

    aaveLikeAddresses = {
      tokens: {
        WETH: WETH.address,
        DAI: DAI.address,
        USDC: USDC.address,
        ETH: ETHAddress,
      },
      operationExecutor: system.OperationExecutor.contract.address,
      chainlinkEthUsdPriceFeed: addresses.chainlinkEthUsdPriceFeed,
      oracle: addresses.aaveOracle,
      lendingPool: addresses.pool,
      poolDataProvider: addresses.poolDataProvider,
    }
    ;({ oracle } = await getAaveLikeSystemContracts(aaveLikeAddresses, config.provider, 'AAVE_V3'))

    const depositEthAmount = ethers.utils.parseEther('1')
    const maxLTV = toSolidityPercentage(50.0)

    const { success } = await createETHPositionAAVEv3(
      snapshot,
      WETH,
      DAI,
      aaveLikeAddresses,
      depositEthAmount,
      maxLTV,
      user,
    )

    expect(success).to.be.true
  })

  it('should adjust risk up on opened ETH/USDC position', async () => {
    const depositEthAmount = ethers.utils.parseEther('1')
    const maxLTV = toSolidityPercentage(50.0)

    const { success: successAdjust } = await adjustRiskDownAAVEv3(
      snapshot,
      WETH,
      DAI,
      aaveLikeAddresses,
      depositEthAmount,
      maxLTV,
      user,
    )

    expect(successAdjust).to.be.true
  })
})
