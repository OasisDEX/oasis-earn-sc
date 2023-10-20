import ERC20_ABI from '@abis/external/tokens/IERC20.json'
import { ADDRESSES } from '@deploy-configurations/addresses'
import { DeployedSystem } from '@deploy-configurations/types/deployed-system'
import { Network } from '@deploy-configurations/types/network'
import { FEE_BASE, ONE } from '@dma-common/constants'
import {
  asPercentageValue,
  exchangeToDAI,
  expect,
  FEE,
  restoreSnapshot,
  swapUniswapTokens,
} from '@dma-common/test-utils'
import { RuntimeConfig } from '@dma-common/types/common'
import { balanceOf } from '@dma-common/utils/balances'
import { amountFromWei, amountToWei } from '@dma-common/utils/common'
import { testBlockNumber } from '@dma-contracts/test/config'
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
  let slippage: ReturnType<typeof asPercentageValue>
  let config: RuntimeConfig

  let system: DeployedSystem

  before(async () => {
    slippage = asPercentageValue(8, 100)
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

  describe('Asset with different precision and no fully ERC20 compliant for DAI', () => {
    let initialUSDTBalanceInWei: BigNumber
    let receiveAtLeastInWei: BigNumber
    let feeInUSDT: BigNumber
    let data: string
    let localSnapshotId: string

    before(async () => {
      localSnapshotId = await provider.send('evm_snapshot', [])

      await swapUniswapTokens(
        ADDRESSES[Network.MAINNET].common.WETH,
        ADDRESSES[Network.MAINNET].common.USDT,
        amountToWei(1).toFixed(0),
        amountToWei(100, 6).toFixed(0),
        address,
        config,
      )

      initialUSDTBalanceInWei = amountToWei(
        await balanceOf(ADDRESSES[Network.MAINNET].common.USDT, address, {
          config,
          isFormatted: true,
          decimals: 6,
        }),
        6,
      )
      feeInUSDT = initialUSDTBalanceInWei
        .times(FEE)
        .div(new BigNumber(FEE_BASE).plus(FEE))
        .integerValue(BigNumber.ROUND_DOWN)

      const USDT = new ethers.Contract(
        ADDRESSES[Network.MAINNET].common.USDT,
        ERC20_ABI,
        provider,
      ).connect(signer)
      await USDT.approve(system.Swap.contract.address, initialUSDTBalanceInWei.toFixed(0))

      const response = await exchangeToDAI(
        ADDRESSES[Network.MAINNET].common.USDT,
        initialUSDTBalanceInWei.minus(feeInUSDT).toFixed(0),
        system.Swap.contract.address,
        slippage.value.toFixed(),
        ALLOWED_PROTOCOLS,
      )

      data = response.tx.data

      const receiveAtLeast = amountFromWei(response.toTokenAmount).times(
        ONE.minus(slippage.asDecimal),
      )
      receiveAtLeastInWei = amountToWei(receiveAtLeast)
    })

    after(async () => {
      await provider.send('evm_revert', [localSnapshotId])
    })

    it(`should exchange to at least amount specified in receiveAtLeast`, async () => {
      await system.Swap.contract.swapTokens(
        [
          ADDRESSES[Network.MAINNET].common.USDT,
          ADDRESSES[Network.MAINNET].common.DAI,
          initialUSDTBalanceInWei.toFixed(0),
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

      const currentUSDTBalance = await balanceOf(ADDRESSES[Network.MAINNET].common.USDT, address, {
        config,
        decimals: 6,
        isFormatted: true,
      })
      const currentDaiBalanceWei = amountToWei(
        await balanceOf(ADDRESSES[Network.MAINNET].common.DAI, address, {
          config,
          isFormatted: true,
        }),
      )

      expect.toBeEqual(currentUSDTBalance, 0)
      expect.toBe(currentDaiBalanceWei, 'gte', receiveAtLeastInWei)
    })
  })
})
