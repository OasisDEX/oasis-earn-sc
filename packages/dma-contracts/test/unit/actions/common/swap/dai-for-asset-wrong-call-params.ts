import { DeployedSystem } from '@deploy-configurations/types/deployed-system'
import { DEFAULT_FEE as FEE, FEE_BASE, ONE } from '@dma-common/constants'
import { asPercentageValue, exchangeFromDAI, expect } from '@dma-common/test-utils'
import { FakeRequestEnv, RuntimeConfig } from '@dma-common/types/common'
import { balanceOf } from '@dma-common/utils/balances'
import { amountToWei } from '@dma-common/utils/common'
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
  let helpers: TestHelpers
  let slippage: ReturnType<typeof asPercentageValue>
  let fee: ReturnType<typeof asPercentageValue>
  let config: RuntimeConfig
  let DAI: Contract
  let WETH: Contract
  let fakeRequestEnv: FakeRequestEnv

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
    signer = snapshot.config.signer
    address = snapshot.config.address
    system = snapshot.testSystem.deployment.system
    helpers = snapshot.testSystem.helpers

    fakeRequestEnv = {
      mockExchange: system.MockExchange.contract as MockExchange,
      fakeWETH: helpers.fakeWETH,
      fakeDAI: helpers.fakeDAI,
    }

    DAI = helpers.fakeDAI.connect(signer)
    WETH = helpers.fakeWETH.connect(signer)
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

      await helpers.fakeDAI.mint(address, amountWithFeeInWei.toFixed(0))

      daiBalance = new BigNumber(
        await balanceOf(DAI.address, address, {
          config,
          isFormatted: true,
        }),
      )
    })

    afterEach(async () => {
      const currentDaiBalance = await balanceOf(DAI.address, address, {
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
          DAI.address,
          WETH.address,
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

      await expect(tx).to.be.revertedWith('ERC20: insufficient allowance')
    })

    it('should end up with unsuccessful swap', async () => {
      const receiveAtLeastInWeiAny = amountToWei(1)
      const data = 0

      await DAI.approve(system.Swap.contract.address, amountWithFeeInWei.toFixed(0))

      const tx = system.Swap.contract.swapTokens(
        [
          DAI.address,
          WETH.address,
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
        WETH.address,
        amountInWei.toFixed(0),
        system.Swap.contract.address,
        slippage.value.toFixed(),
        ALLOWED_PROTOCOLS,
        fakeRequestEnv,
      )

      const tx = system.Swap.contract.swapTokens([
        DAI.address,
        WETH.address,
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
