import { ADDRESSES } from '@deploy-configurations/addresses'
import { Address } from '@deploy-configurations/types/address'
import { DeployedSystem } from '@deploy-configurations/types/deployed-system'
import { Network } from '@deploy-configurations/types/network'
import { getNetwork } from '@deploy-configurations/utils/network'
import { MAX_UINT } from '@dma-common/constants'
import { asPercentageValue, expect } from '@dma-common/test-utils'
import { RuntimeConfig } from '@dma-common/types/common'
import { balanceOf } from '@dma-common/utils/balances'
import { amountToWei } from '@dma-common/utils/common'
import { calculateFeeOnInputAmount } from '@dma-common/utils/swap'
import { testBlockNumber } from '@dma-contracts/test/config'
import { swapTokens } from '@dma-contracts/test/utils/swap'
import { restoreSnapshot, TestDeploymentSystem, TestHelpers } from '@dma-contracts/utils'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ERC20, ERC20__factory, WETH, WETH__factory } from '@typechain'
import { ethers } from 'ethers'
import hre from 'hardhat'

describe('Swap | 1Inch | E2E', async () => {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  let signer: SignerWithAddress
  let WETH: WETH
  let DAI: ERC20
  let ETHAddress: Address
  let slippage: ReturnType<typeof asPercentageValue>
  let config: RuntimeConfig
  let system: DeployedSystem
  let testSystem: TestDeploymentSystem
  let helpers: TestHelpers
  let network: Network
  /* eslint-enable @typescript-eslint/no-unused-vars */

  before(async () => {
    slippage = asPercentageValue(15, 100)
  })

  beforeEach(async () => {
    const { snapshot } = await restoreSnapshot({
      hre,
      blockNumber: testBlockNumber,
      useFallbackSwap: false,
    })

    signer = await SignerWithAddress.create(
      snapshot.config.signer as ethers.providers.JsonRpcSigner,
    )
    system = snapshot.testSystem.deployment.system
    testSystem = snapshot.testSystem
    config = snapshot.config
    helpers = snapshot.testSystem.helpers

    network = await getNetwork(config.provider)

    ETHAddress = ADDRESSES[network].common.ETH
    WETH = WETH__factory.connect(ADDRESSES[network].common.WETH, config.signer)
    DAI = ERC20__factory.connect(ADDRESSES[network].common.DAI, config.signer)
  })

  it('should exchange ETH for WETH', async () => {
    const amountInWei = amountToWei(1)

    const wethBalanceBefore = amountToWei(
      await balanceOf(WETH.address, signer.address, { config, isFormatted: true }),
    )

    await swapTokens(testSystem, config, ETHAddress, WETH.address, amountInWei, slippage, signer)

    const wethBalanceAfter = amountToWei(
      await balanceOf(WETH.address, signer.address, { config, isFormatted: true }),
    )

    const wethReceived = wethBalanceAfter.minus(wethBalanceBefore)

    expect.toBeEqual(wethReceived, amountInWei)
  })

  it.skip('should exchange WETH for DAI', async () => {
    const amountInWei = amountToWei(10)
    const amountWithFeeInWei = calculateFeeOnInputAmount(amountInWei).plus(amountInWei)

    await swapTokens(
      testSystem,
      config,
      ETHAddress,
      WETH.address,
      amountWithFeeInWei,
      slippage,
      signer,
    )

    const daiBalanceBefore = amountToWei(
      await balanceOf(DAI.address, signer.address, { config, isFormatted: true }),
    )

    await WETH.approve(system.Swap.contract.address, MAX_UINT)
    await swapTokens(testSystem, config, WETH.address, DAI.address, amountInWei, slippage, signer)

    const daiBalanceAfter = amountToWei(
      await balanceOf(DAI.address, signer.address, { config, isFormatted: true }),
    )

    expect.toBe(daiBalanceAfter, 'gt', daiBalanceBefore)
  })
})
