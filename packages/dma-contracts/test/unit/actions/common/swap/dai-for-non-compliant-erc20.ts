import { DeployedSystem } from '@deploy-configurations/types/deployed-system'
import { DEFAULT_FEE as FEE, ONE } from '@dma-common/constants'
import { asPercentageValue, exchangeFromDAI, expect } from '@dma-common/test-utils'
import { FakeRequestEnv, RuntimeConfig } from '@dma-common/types/common'
import { balanceOf } from '@dma-common/utils/balances'
import { amountFromWei, amountToWei } from '@dma-common/utils/common'
import { calculateFeeOnInputAmount } from '@dma-common/utils/swap'
import { testBlockNumber } from '@dma-contracts/test/config'
import { restoreSnapshot, TestHelpers } from '@dma-contracts/utils'
import { Contract } from '@ethersproject/contracts'
import { MockExchange } from '@typechain'
import BigNumber from 'bignumber.js'
import { Signer } from 'ethers'
import hre from 'hardhat'

const ALLOWED_PROTOCOLS = ['UNISWAP_V2', 'UNISWAP_V3']

describe('Swap | Unit', async () => {
  let signer: Signer
  let address: string
  let DAI: Contract
  let USDT: Contract
  let slippage: ReturnType<typeof asPercentageValue>
  let config: RuntimeConfig
  let system: DeployedSystem
  let fakeRequestEnv: FakeRequestEnv
  let helpers: TestHelpers

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
    helpers = snapshot.testSystem.helpers
    config = snapshot.config

    fakeRequestEnv = {
      mockExchange: system.MockExchange.contract as MockExchange,
      fakeWETH: helpers.fakeWETH,
      fakeDAI: helpers.fakeDAI,
    }

    DAI = helpers.fakeDAI.connect(signer)
    USDT = helpers.fakeUSDT.connect(signer)
  })

  afterEach(async () => {
    await restoreSnapshot({ hre, blockNumber: testBlockNumber })
  })

  describe('DAI for Asset with different precision and no fully ERC20 compliant', () => {
    let daiBalanceInWei: BigNumber
    let amountInWei: BigNumber
    let amountWithFeeInWei: BigNumber
    let receiveAtLeastInWei: BigNumber
    let data: string

    before(async () => {
      amountInWei = amountToWei(1000)
      amountWithFeeInWei = calculateFeeOnInputAmount(amountInWei).plus(amountInWei)
    })

    beforeEach(async () => {
      await helpers.fakeDAI.mint(address, amountWithFeeInWei.toFixed(0))

      daiBalanceInWei = amountToWei(
        await balanceOf(DAI.address, address, {
          config,
          isFormatted: true,
        }),
      )

      const response = await exchangeFromDAI(
        USDT.address,
        amountInWei.toFixed(0),
        system.Swap.contract.address,
        slippage.value.toFixed(),
        ALLOWED_PROTOCOLS,
        fakeRequestEnv,
      )

      data = response.tx.data

      const receiveAtLeast = amountFromWei(response.toTokenAmount, 6).times(
        ONE.minus(slippage.asDecimal),
      )
      receiveAtLeastInWei = amountToWei(receiveAtLeast, 6)
    })

    it(`should exchange to at least amount specified in receiveAtLeast`, async () => {
      await DAI.approve(system.Swap.contract.address, amountWithFeeInWei.toFixed(0))
      await system.Swap.contract.swapTokens(
        [
          DAI.address,
          USDT.address,
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

      const currentUSDTBalance = await balanceOf(USDT.address, address, {
        config,
        decimals: 6,
        isFormatted: true,
      })

      const currentDaiBalance = amountToWei(
        await balanceOf(DAI.address, address, {
          config,
          isFormatted: true,
        }),
      )

      expect.toBeEqual(currentDaiBalance, daiBalanceInWei.minus(amountWithFeeInWei), 0)
      expect.toBe(currentUSDTBalance, 'gte', amountFromWei(receiveAtLeastInWei, 6))
    })
  })
})
