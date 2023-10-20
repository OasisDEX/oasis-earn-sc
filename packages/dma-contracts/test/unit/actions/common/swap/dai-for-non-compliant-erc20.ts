import ERC20_ABI from '@abis/external/tokens/IERC20.json'
import { ADDRESSES } from '@deploy-configurations/addresses'
import { DeployedSystem } from '@deploy-configurations/types/deployed-system'
import { Network } from '@deploy-configurations/types/network'
import { ONE } from '@dma-common/constants'
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
  let DAI: Contract
  let slippage: ReturnType<typeof asPercentageValue>
  let config: RuntimeConfig

  let system: DeployedSystem

  before(async () => {
    slippage = asPercentageValue(8, 100)

    DAI = new ethers.Contract(ADDRESSES[Network.TEST].common.DAI, ERC20_ABI, provider).connect(
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

  describe('DAI for Asset with different precision and no fully ERC20 compliant', () => {
    let daiBalanceInWei: BigNumber
    let amountWithFeeInWei: BigNumber
    let receiveAtLeastInWei: BigNumber
    let data: string
    let localSnapshotId: string

    before(async () => {
      localSnapshotId = await provider.send('evm_snapshot', [])
      const amountInWei = amountToWei(1000)
      amountWithFeeInWei = calculateFee(amountInWei).plus(amountInWei)

      await swapUniswapTokens(
        ADDRESSES[Network.MAINNET].common.WETH,
        ADDRESSES[Network.MAINNET].common.DAI,
        amountToWei(10).toFixed(0),
        amountWithFeeInWei.toFixed(0),
        address,
        config,
      )

      daiBalanceInWei = amountToWei(
        await balanceOf(ADDRESSES[Network.MAINNET].common.DAI, address, {
          config,
          isFormatted: true,
        }),
      )

      const response = await exchangeFromDAI(
        ADDRESSES[Network.MAINNET].common.USDT,
        amountInWei.toFixed(0),
        slippage.value.toFixed(),
        system.Swap.contract.address,
        ALLOWED_PROTOCOLS,
      )

      data = response.tx.data

      const receiveAtLeast = amountFromWei(response.toTokenAmount, 6).times(
        ONE.minus(slippage.asDecimal),
      )
      receiveAtLeastInWei = amountToWei(receiveAtLeast, 6)
    })

    after(async () => {
      await provider.send('evm_revert', [localSnapshotId])
    })

    it(`should exchange to at least amount specified in receiveAtLeast`, async () => {
      await DAI.approve(system.Swap.contract.address, amountWithFeeInWei.toFixed(0))
      await system.Swap.contract.swapTokens(
        [
          ADDRESSES[Network.MAINNET].common.DAI,
          ADDRESSES[Network.MAINNET].common.USDT,
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

      const currentUSDTBalance = await balanceOf(ADDRESSES[Network.MAINNET].common.USDT, address, {
        config,
        decimals: 6,
        isFormatted: true,
      })

      const currentDaiBalance = amountToWei(
        await balanceOf(ADDRESSES[Network.MAINNET].common.DAI, address, {
          config,
          isFormatted: true,
        }),
      )

      expect.toBeEqual(currentDaiBalance, daiBalanceInWei.minus(amountWithFeeInWei), 0)
      expect.toBe(currentUSDTBalance, 'gte', amountFromWei(receiveAtLeastInWei, 6))
    })
  })
})
