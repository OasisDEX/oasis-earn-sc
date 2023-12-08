import { ADDRESSES } from '@deploy-configurations/addresses'
import { Address } from '@deploy-configurations/types/address'
import { DeployedSystem } from '@deploy-configurations/types/deployed-system'
import { Network } from '@deploy-configurations/types/network'
import { getNetwork } from '@deploy-configurations/utils/network'
import { addressesByNetwork, asPercentageValue } from '@dma-common/test-utils'
import { RuntimeConfig } from '@dma-common/types/common'
import { DeploymentSystem } from '@dma-contracts/scripts/deployment/deploy'
import { testBlockNumberForAaveV3 } from '@dma-contracts/test/config'
import { adjustRiskUpAAVEv3 } from '@dma-contracts/test/utils/aave/aave.operation.adjust-risk-up'
import { createETHPositionAAVEv3 } from '@dma-contracts/test/utils/aave/aave.operation.create-position'
import { restoreSnapshot, Snapshot, TestDeploymentSystem, TestHelpers } from '@dma-contracts/utils'
import { toSolidityPercentage } from '@dma-contracts/utils/percentage.utils'
import { sendImpersonateFunds } from '@dma-contracts/utils/send-impersonate-funds'
import { AaveLikeStrategyAddresses } from '@dma-library/operations/aave-like'
import { getAaveLikeSystemContracts, getContract } from '@dma-library/protocols/aave-like/utils'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ERC20, ERC20__factory, MockExchange, Swap, WETH, WETH__factory } from '@typechain'
import { expect } from 'chai'
import { ethers } from 'ethers'
import hre from 'hardhat'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

describe('AAVE V3 | Adjust Risk Up | E2E', async () => {
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
    ;({ snapshot } = await restoreSnapshot({
      hre,
      blockNumber: testBlockNumberForAaveV3,
      useFallbackSwap: true, // switch to true to use mock exchange
      debug: false
    },
    [fundMockExchange, enableZeroFee]))

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

    const { success, requestedBorrowAmount, totalDaiBorrowed} =
      await createETHPositionAAVEv3(
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

    const {success: successAdjust} = await adjustRiskUpAAVEv3(snapshot,
      WETH,
      DAI,
      aaveLikeAddresses,
      depositEthAmount,
      maxLTV,
      user,)

      expect(successAdjust).to.be.true
  })
})


async function fetchAAVEContracts(
  hre: HardhatRuntimeEnvironment,
  system: DeployedSystem,
  network: Network,
) {
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

  return await getAaveLikeSystemContracts(aaveLikeAddresses, hre.ethers.provider, 'AAVE_V3')
}

async function fundMockExchange(
  hre: HardhatRuntimeEnvironment,
  ds: DeploymentSystem,
  helpers: TestHelpers, // eslint-disable-line @typescript-eslint/no-unused-vars
  extraDeployment: any, // eslint-disable-line @typescript-eslint/no-unused-vars
  useFallbackSwap: boolean, // eslint-disable-line @typescript-eslint/no-unused-vars
) {
  const whaleAddress: Address = '0xD831B3353Be1449d7131e92c8948539b1F18b86A'
  const USDCAddress: Address = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
  const DAIAddress: Address = '0x6b175474e89094c44da98b954eedeac495271d0f'
  const WETHAddress: Address = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'

  const { oracle } = await fetchAAVEContracts(hre, ds.getSystem().system, Network.MAINNET)
  const mockExchange = ds.getSystem().system.MockExchange.contract as MockExchange

  const WETH = await hre.ethers.getContractAt('IWETH', WETHAddress)


  await WETH.deposit({ value: ethers.utils.parseEther('1000') })


  await WETH.transfer(mockExchange.address, ethers.utils.parseEther('1000'))


  const signer = hre.ethers.provider.getSigner()
  
  await sendImpersonateFunds(
    hre,
    whaleAddress,
    DAIAddress,
    ethers.utils.parseEther('100000'),
    mockExchange.address,
  )

  const USDCPrice = await oracle.getAssetPrice(USDCAddress)
  const DAIPrice = await oracle.getAssetPrice(DAIAddress)
  const WETHPrice = await oracle.getAssetPrice(WETHAddress)
  
  // Scale prices by 10**10 because AAVE prices only use 8 decimals
  await mockExchange.setPrice(USDCAddress, USDCPrice.mul('10000000000'))
  await mockExchange.setPrice(DAIAddress, DAIPrice.mul('10000000000'))
  await mockExchange.setPrice(WETHAddress, WETHPrice.mul('10000000000'))
  
}

async function enableZeroFee(
  hre: HardhatRuntimeEnvironment,
  ds: DeploymentSystem,
  helpers: TestHelpers, // eslint-disable-line @typescript-eslint/no-unused-vars
  extraDeployment: any, // eslint-disable-line @typescript-eslint/no-unused-vars
  useFallbackSwap: boolean, // eslint-disable-line @typescript-eslint/no-unused-vars
) {
  const swap = (ds.getSystem().system.Swap.contract as Swap)
  await swap.addFeeTier(0)

}
