import { ADDRESSES } from '@deploy-configurations/addresses'
import { Address } from '@deploy-configurations/types/address'
import { getNetwork } from '@deploy-configurations/utils/network'
import { DEFAULT_FEE as FEE } from '@dma-common/constants'
import { Percentage, swapOneInchTokens } from '@dma-common/test-utils'
import { RuntimeConfig } from '@dma-common/types/common'
import { balanceOf } from '@dma-common/utils/balances'
import { amountToWei } from '@dma-common/utils/common'
import { calculateFeeOnInputAmount } from '@dma-common/utils/swap'
import { TestDeploymentSystem } from '@dma-contracts/utils'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { WETH, WETH__factory } from '@typechain'
import BigNumber from 'bignumber.js'

async function wrapETH(
  WETH: WETH,
  amount: BigNumber,
  config: RuntimeConfig,
  signer: SignerWithAddress,
): Promise<BigNumber> {
  const wethBalanceBefore = amountToWei(
    await balanceOf(WETH.address, signer.address, { config, isFormatted: true }),
  )

  await WETH.connect(signer).deposit({
    value: amount.toFixed(0),
  })

  const wethBalanceAfter = amountToWei(
    await balanceOf(WETH.address, config.address, { config, isFormatted: true }),
  )

  return wethBalanceAfter.minus(wethBalanceBefore)
}

export async function swapTokens(
  testSystem: TestDeploymentSystem,
  config: RuntimeConfig,
  fromToken: Address,
  toToken: Address,
  amount: BigNumber,
  slippage: Percentage,
  signer?: SignerWithAddress,
) {
  if (!signer) {
    signer = config.signer as SignerWithAddress
  }

  const ALLOWED_PROTOCOLS = ['UNISWAP_V2', 'UNISWAP_V3']
  const system = testSystem.deployment.system

  const network = await getNetwork(config.provider)
  const ETHAddress = ADDRESSES[network].common.ETH
  const WETHAddress = ADDRESSES[network].common.WETH

  const WETH = WETH__factory.connect(WETHAddress, config.signer)

  if (fromToken === ETHAddress && toToken === WETHAddress) {
    await wrapETH(WETH, amount, config, signer)
    return
  }

  // Setup Swap
  const amountWithFeeInWei = calculateFeeOnInputAmount(amount).plus(amount)

  const response = await swapOneInchTokens(
    fromToken,
    toToken,
    amount.toFixed(0),
    system.Swap.contract.address,
    slippage.value.toFixed(),
    ALLOWED_PROTOCOLS,
  )

  const data = response.tx.data

  await system.Swap.contract.swapTokens(
    [fromToken, toToken, amountWithFeeInWei.toFixed(0), 0, FEE, data, true],
    {
      value: 0,
      gasLimit: 2500000,
    },
  )
}
