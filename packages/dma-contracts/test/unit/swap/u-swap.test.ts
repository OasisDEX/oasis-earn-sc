import WETH_ABI from '@abis/external/tokens/IWETH.json'
import { ADDRESSES } from '@deploy-configurations/addresses'
import { CONTRACT_NAMES } from '@deploy-configurations/constants'
import { Network } from '@deploy-configurations/types/network'
import { ServiceRegistry } from '@deploy-configurations/utils/wrappers'
import { ONE } from '@dma-common/constants'
import { asPercentageValue, expect, FEE, swapOneInchTokens } from '@dma-common/test-utils'
import { RuntimeConfig } from '@dma-common/types/common'
import { balanceOf } from '@dma-common/utils/balances'
import { amountToWei } from '@dma-common/utils/common'
import { createDeploy } from '@dma-common/utils/deploy'
import init from '@dma-common/utils/init'
import { calculateFee } from '@dma-common/utils/swap'
import { swap, uniswapV3Swap, unoswap } from '@dma-contracts/test/fixtures'
import BigNumber from 'bignumber.js'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'

// TODO: OneInch swap is not working
describe.skip('uSwap | Unit', () => {
  let uSwap: Contract
  let config: RuntimeConfig
  let registry: ServiceRegistry
  let WETH: Contract
  let DAI: Contract

  before(async () => {
    config = await init()
    const deploy = await createDeploy({ config })

    await config.provider.send('hardhat_reset', [
      {
        forking: {
          jsonRpcUrl: process.env.MAINNET_URL,
        },
      },
    ])

    const [serviceRegistry] = await deploy('ServiceRegistry', [0])
    registry = new ServiceRegistry(serviceRegistry.address, config.signer)

    await registry.addEntry(
      CONTRACT_NAMES.common.UNISWAP_ROUTER,
      ADDRESSES[Network.MAINNET].common.UniswapRouterV3,
    )
    const [_uSwap] = await deploy('uSwap', [
      config.address,
      ADDRESSES[Network.MAINNET].common.FeeRecipient,
      FEE,
      serviceRegistry.address,
    ])
    uSwap = _uSwap

    WETH = new ethers.Contract(
      ADDRESSES[Network.MAINNET].common.WETH,
      WETH_ABI,
      config.provider,
    ).connect(config.signer)
    DAI = new ethers.Contract(
      ADDRESSES[Network.MAINNET].common.DAI,
      WETH_ABI,
      config.provider,
    ).connect(config.signer)
    await uSwap.setPool(WETH.address, DAI.address, 3000)
    await uSwap.setPool(DAI.address, WETH.address, 3000)
  })

  describe('WETH to DAI, fee in WETH', () => {
    const amountInWei = amountToWei(new BigNumber(10))
    const fee = calculateFee(amountInWei, FEE)
    const depositAmountWithFeeWei = amountInWei.plus(fee)
    const slippage = asPercentageValue(10, 100)

    let receiveAtLeast: BigNumber

    before(async () => {
      const response = await swapOneInchTokens(
        ADDRESSES[Network.MAINNET].common.WETH,
        ADDRESSES[Network.MAINNET].common.DAI,
        amountInWei.toFixed(0),
        uSwap.address,
        slippage.value.toFixed(),
      )

      receiveAtLeast = new BigNumber(response.toTokenAmount).times(ONE.minus(slippage.asDecimal))

      await WETH.deposit({ value: depositAmountWithFeeWei.toFixed(0) })
      await WETH.approve(uSwap.address, depositAmountWithFeeWei.toFixed(0))
      await uSwap.swapTokens([
        ADDRESSES[Network.MAINNET].common.WETH,
        ADDRESSES[Network.MAINNET].common.DAI,
        depositAmountWithFeeWei.toFixed(0),
        receiveAtLeast.toFixed(0),
        FEE,
        response.tx.data,
        true,
      ])
    })

    it('Performs swap WETH to DAI', async () => {
      const daiBalance = await balanceOf(DAI.address, config.address, { config })

      expect.toBe(daiBalance, 'gte', receiveAtLeast)
    })

    it('Pays fee in WETH', async () => {
      const feeWallet = await balanceOf(
        WETH.address,
        ADDRESSES[Network.MAINNET].common.FeeRecipient,
        { config },
      )
      expect.toBeEqual(feeWallet, fee)
    })
  })

  describe('Decodes 1inch calldata:', () => {
    it('swap', async () => {
      const minReturn = await uSwap.decodeOneInchCallData(swap)

      expect(minReturn).to.eq('253155553433896897812874325')
    })

    it('unoswap', async () => {
      const minReturn = await uSwap.decodeOneInchCallData(unoswap)

      expect(minReturn).to.eq('1545434805092')
    })

    it('uniswapV3Swap', async () => {
      const minReturn = await uSwap.decodeOneInchCallData(uniswapV3Swap)

      expect(minReturn).to.eq('6227917975974974414')
    })
  })
})
