import WETH_ABI from '@abis/external/tokens/IWETH.json'
import { ADDRESSES } from '@deploy-configurations/addresses'
import { DeployedSystem } from '@deploy-configurations/types/deployed-system'
import { Network } from '@deploy-configurations/types/network'
import { ONE } from '@dma-common/constants'
import {
  asPercentageValue,
  expect,
  FEE,
  restoreSnapshot,
  swapOneInchTokens,
} from '@dma-common/test-utils'
import { RuntimeConfig } from '@dma-common/types/common'
import { balanceOf } from '@dma-common/utils/balances'
import { amountFromWei, amountToWei } from '@dma-common/utils/common'
import { calculateFee } from '@dma-common/utils/swap'
import { testBlockNumber } from '@dma-contracts/test/config'
import { Contract } from '@ethersproject/contracts'
import { JsonRpcProvider } from '@ethersproject/providers'
import BigNumber from 'bignumber.js'
import { Signer } from 'ethers'
import hre, { ethers } from 'hardhat'

const ALLOWED_PROTOCOLS = ['UNISWAP_V2', 'UNISWAP_V3']

// TODO: OneInch swap tests are failing
describe.skip('Swap | Unit', async () => {
  let provider: JsonRpcProvider
  let signer: Signer
  let address: string
  let WETH: Contract
  let feeBeneficiaryAddress: string
  let slippage: ReturnType<typeof asPercentageValue>
  let config: RuntimeConfig

  let system: DeployedSystem

  before(async () => {
    feeBeneficiaryAddress = ADDRESSES[Network.TEST].common.FeeRecipient
    slippage = asPercentageValue(8, 100)

    WETH = new ethers.Contract(ADDRESSES[Network.TEST].common.WETH, WETH_ABI, provider).connect(
      signer,
    )
  })

  beforeEach(async () => {
    const { snapshot } = await restoreSnapshot({
      hre,
      blockNumber: testBlockNumber,
    })

    provider = snapshot.config.provider
    signer = snapshot.config.signer
    address = snapshot.config.address
    system = snapshot.testSystem.deployment.system
  })

  afterEach(async () => {
    await restoreSnapshot({ hre, blockNumber: testBlockNumber })
  })

  describe('Between two erc20 tokens, (no DAI in the pair)', () => {
    const fromToken = ADDRESSES[Network.MAINNET].common.WETH
    const toToken = ADDRESSES[Network.MAINNET].common.WBTC
    const amountInWei = amountToWei(10)
    const toTokenDecimals = 8
    let feeWalletBalanceWeiBefore: BigNumber
    let amountWithFeeInWei: BigNumber
    let receiveAtLeastInWei: BigNumber
    let data: string
    let wethBalanceBeforeWei: BigNumber

    before(async () => {
      const { snapshot } = await restoreSnapshot({
        hre,
        blockNumber: testBlockNumber,
      })

      provider = snapshot.config.provider
      signer = snapshot.config.signer
      address = snapshot.config.address
      system = snapshot.testSystem.deployment.system

      amountWithFeeInWei = calculateFee(amountInWei).plus(amountInWei)

      const response = await swapOneInchTokens(
        fromToken,
        toToken,
        amountInWei.toFixed(0),
        system.Swap.contract.address,
        slippage.value.toFixed(),
        ALLOWED_PROTOCOLS,
      )

      data = response.tx.data

      const receiveAtLeast = amountFromWei(response.toTokenAmount, 8).times(
        ONE.minus(slippage.asDecimal),
      )
      receiveAtLeastInWei = amountToWei(receiveAtLeast, 8)
      await WETH.deposit({
        value: amountToWei(1000).toFixed(0),
      })
      wethBalanceBeforeWei = amountToWei(
        await balanceOf(WETH.address, address, { config, isFormatted: true }),
      )
      feeWalletBalanceWeiBefore = await balanceOf(fromToken, feeBeneficiaryAddress, { config })
      await WETH.approve(system.Swap.contract.address, amountWithFeeInWei.toFixed(0))

      await system.Swap.contract.swapTokens(
        [
          ADDRESSES[Network.MAINNET].common.WETH,
          ADDRESSES[Network.MAINNET].common.WBTC,
          amountWithFeeInWei.toFixed(0),
          receiveAtLeastInWei.toFixed(0),
          FEE,
          data,
          true,
        ],
        {
          value: 0,
          gasLimit: 2500000,
        },
      )
    })

    it('should exchange fromToken to receiveAtLeast amount of toToken', async () => {
      const currentToTokenBalanceWei = amountToWei(
        await balanceOf(toToken, address, {
          config,
          isFormatted: true,
          decimals: toTokenDecimals,
        }),
      )
      expect.toBe(currentToTokenBalanceWei, 'gte', receiveAtLeastInWei)
    })

    it('should exchange exact amount of fromToken + fee', async () => {
      const currentFromTokenBalanceWei = amountToWei(
        await balanceOf(fromToken, address, { config, isFormatted: true }),
      )
      expect.toBeEqual(
        wethBalanceBeforeWei.minus(amountWithFeeInWei),
        currentFromTokenBalanceWei.toFixed(0),
      )
    })

    it('should collect fee in fromToken', async () => {
      const feeWalletBalanceWeiAfter = await balanceOf(fromToken, feeBeneficiaryAddress, { config })
      const feeWalletBalanceWeiChange = feeWalletBalanceWeiAfter.minus(feeWalletBalanceWeiBefore)

      expect.toBeEqual(feeWalletBalanceWeiChange, calculateFee(amountInWei))
    })

    it('should not leave any fromToken in Swap contract', async () => {
      const swapBalance = await balanceOf(fromToken, system.Swap.contract.address, {
        config,
        isFormatted: true,
      })

      expect.toBeEqual(swapBalance, 0)
    })

    it('should not leave any toToken in Swap contract', async () => {
      const swapBalance = await balanceOf(toToken, system.Swap.contract.address, {
        config,
        isFormatted: true,
      })

      expect.toBeEqual(swapBalance, 0)
    })
  })
})
