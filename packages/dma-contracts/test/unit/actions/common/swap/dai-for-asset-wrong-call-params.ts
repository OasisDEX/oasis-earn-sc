import ERC20_ABI from '@abis/external/tokens/IERC20.json'
import { ADDRESSES } from '@deploy-configurations/addresses'
import { DeployedSystem } from '@deploy-configurations/types/deployed-system'
import { Network } from '@deploy-configurations/types/network'
import { FEE_BASE, ONE } from '@dma-common/constants'
import {
  asPercentageValue,
  exchangeFromDAI,
  expect,
  FEE,
  restoreSnapshot,
  swapUniswapTokens,
} from '@dma-common/test-utils'
import { RuntimeConfig } from '@dma-common/types/common'
import { balanceOf } from '@dma-common/utils/balances'
import { amountToWei } from '@dma-common/utils/common'
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
  let DAI: Contract
  let slippage: ReturnType<typeof asPercentageValue>
  let fee: ReturnType<typeof asPercentageValue>
  let config: RuntimeConfig

  let system: DeployedSystem

  before(async () => {
    slippage = asPercentageValue(8, 100)
    fee = asPercentageValue(FEE, FEE_BASE)
  })

  beforeEach(async () => {
    const { snapshot } = await restoreSnapshot({
      hre,
      blockNumber: testBlockNumber,
    })

    config = snapshot.config
    provider = snapshot.config.provider
    signer = snapshot.config.signer
    address = snapshot.config.address
    system = snapshot.testSystem.deployment.system

    DAI = new ethers.Contract(ADDRESSES[Network.TEST].common.DAI, ERC20_ABI, provider).connect(
      signer,
    )
  })

  afterEach(async () => {
    await restoreSnapshot({ hre, blockNumber: testBlockNumber })
  })

  describe('DAI for Asset without proper call parameters', async () => {
    let amountInWei: BigNumber
    let amountWithFeeInWei: BigNumber
    let daiBalance: BigNumber

    beforeEach(async () => {
      amountInWei = amountToWei(1000)
      amountWithFeeInWei = amountInWei.div(ONE.minus(fee.asDecimal))

      await swapUniswapTokens(
        ADDRESSES[Network.MAINNET].common.WETH,
        ADDRESSES[Network.MAINNET].common.DAI,
        amountToWei(10).toFixed(0),
        amountWithFeeInWei.toFixed(0),
        address,
        config,
      )

      daiBalance = new BigNumber(
        await balanceOf(ADDRESSES[Network.MAINNET].common.DAI, address, {
          config,
          isFormatted: true,
        }),
      )
    })

    afterEach(async () => {
      const currentDaiBalance = await balanceOf(ADDRESSES[Network.MAINNET].common.DAI, address, {
        config,
        isFormatted: true,
      })
      expect.toBeEqual(currentDaiBalance, daiBalance)
    })

    it('should not have allowance set', async () => {
      const receiveAtLeastInWeiAny = amountToWei(1)
      const data = 0

      const tx = system.Swap.contract.swapTokens(
        [
          ADDRESSES[Network.MAINNET].common.DAI,
          ADDRESSES[Network.MAINNET].common.WETH,
          amountWithFeeInWei.toFixed(0),
          receiveAtLeastInWeiAny.toFixed(0),
          FEE,
          data,
          true,
        ],
        {
          value: 0,
          gasLimit: 2500000,
        },
      )

      await expect(tx).to.be.revertedWith('Dai/insufficient-allowance')
    })

    it('should end up with unsuccessful swap', async () => {
      const receiveAtLeastInWeiAny = amountToWei(1)
      const data = 0

      await DAI.approve(system.Swap.contract.address, amountWithFeeInWei.toFixed(0))

      const tx = system.Swap.contract.swapTokens(
        [
          ADDRESSES[Network.MAINNET].common.DAI,
          ADDRESSES[Network.MAINNET].common.WETH,
          amountWithFeeInWei.toFixed(0),
          receiveAtLeastInWeiAny.toFixed(0),
          FEE,
          data,
          true,
        ],
        {
          value: 0,
          gasLimit: 2500000,
        },
      )
      await expect(tx).to.be.revertedWith('SwapFailed()')
    })

    it('should receive less', async () => {
      const receiveAtLeast = amountToWei(100000)

      await DAI.approve(system.Swap.contract.address, amountWithFeeInWei.toFixed(0))

      const response = await exchangeFromDAI(
        ADDRESSES[Network.MAINNET].common.WETH,
        amountInWei.toFixed(0),
        slippage.value.toFixed(),
        system.Swap.contract.address,
        ALLOWED_PROTOCOLS,
      )

      const tx = system.Swap.contract.swapTokens([
        ADDRESSES[Network.MAINNET].common.DAI,
        ADDRESSES[Network.MAINNET].common.WETH,
        amountWithFeeInWei.toFixed(0),
        receiveAtLeast.toFixed(0),
        FEE,
        response.tx.data,
        true,
      ])

      const expectedRevert = /ReceivedLess\(100000000000000000000000, \d+\)/
      await expect.revert(expectedRevert, tx)
    })
  })
})
