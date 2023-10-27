import { DeployedSystem } from '@deploy-configurations/types/deployed-system'
import { DEFAULT_FEE as FEE, ONE } from '@dma-common/constants'
import { asPercentageValue, exchangeToDAI, expect } from '@dma-common/test-utils'
import { FakeRequestEnv, RuntimeConfig } from '@dma-common/types/common'
import { balanceOf } from '@dma-common/utils/balances'
import { amountFromWei, amountToWei } from '@dma-common/utils/common'
import { calculateFee } from '@dma-common/utils/swap'
import { testBlockNumber } from '@dma-contracts/test/config'
import { restoreSnapshot, TestHelpers } from '@dma-contracts/utils'
import { MockExchange } from '@typechain'
import BigNumber from 'bignumber.js'
import { Contract, Signer } from 'ethers'
import hre from 'hardhat'

const ALLOWED_PROTOCOLS = ['UNISWAP_V2', 'UNISWAP_V3']

describe('Swap | Unit', async () => {
  let signer: Signer
  let address: string
  let slippage: ReturnType<typeof asPercentageValue>
  let config: RuntimeConfig
  let system: DeployedSystem
  let fakeRequestEnv: FakeRequestEnv
  let helpers: TestHelpers
  let USDT: Contract
  let DAI: Contract

  before(async () => {
    slippage = asPercentageValue(8, 100)
  })

  beforeEach(async () => {
    const { snapshot } = await restoreSnapshot({
      hre,
      blockNumber: testBlockNumber,
    })

    signer = snapshot.config.signer
    address = snapshot.config.address
    system = snapshot.testSystem.deployment.system
    config = snapshot.config
    helpers = snapshot.testSystem.helpers

    fakeRequestEnv = {
      mockExchange: system.MockExchange.contract as MockExchange,
      fakeWETH: helpers.fakeWETH,
      fakeDAI: helpers.fakeDAI,
    }

    USDT = helpers.fakeUSDT.connect(signer)
    DAI = helpers.fakeDAI.connect(signer)
  })

  afterEach(async () => {
    await restoreSnapshot({ hre, blockNumber: testBlockNumber })
  })

  describe('Asset with different precision and no fully ERC20 compliant for DAI', () => {
    let initialUSDTBalanceInWei: BigNumber
    let initialUSDTBalanceInWeiWithFee: BigNumber
    let receiveAtLeastInWei: BigNumber
    let feeInUSDT: BigNumber
    let data: string

    beforeEach(async () => {
      await helpers.fakeUSDT.mint(address, amountToWei(100, 6).toFixed(0))

      initialUSDTBalanceInWeiWithFee = amountToWei(
        await balanceOf(USDT.address, address, {
          config,
          isFormatted: true,
          decimals: 6,
        }),
        6,
      )

      feeInUSDT = calculateFee(initialUSDTBalanceInWeiWithFee)

      initialUSDTBalanceInWei = initialUSDTBalanceInWeiWithFee.minus(feeInUSDT)

      await USDT.approve(system.Swap.contract.address, initialUSDTBalanceInWeiWithFee.toFixed(0))

      const response = await exchangeToDAI(
        USDT.address,
        initialUSDTBalanceInWei.toFixed(0),
        system.Swap.contract.address,
        slippage.value.toFixed(),
        ALLOWED_PROTOCOLS,
        fakeRequestEnv,
      )

      data = response.tx.data

      const receiveAtLeast = amountFromWei(response.toTokenAmount).times(
        ONE.minus(slippage.asDecimal),
      )
      receiveAtLeastInWei = amountToWei(receiveAtLeast)
    })

    it(`should exchange to at least amount specified in receiveAtLeast`, async () => {
      await system.Swap.contract.swapTokens(
        [
          USDT.address,
          DAI.address,
          initialUSDTBalanceInWeiWithFee.toFixed(0),
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

      const currentUSDTBalance = await balanceOf(USDT.address, address, {
        config,
        decimals: 6,
        isFormatted: true,
      })
      const currentDaiBalanceWei = amountToWei(
        await balanceOf(DAI.address, address, {
          config,
          isFormatted: true,
        }),
      )

      expect.toBeEqual(currentUSDTBalance, 0)
      expect.toBe(currentDaiBalanceWei, 'gte', receiveAtLeastInWei)
    })
  })
})
