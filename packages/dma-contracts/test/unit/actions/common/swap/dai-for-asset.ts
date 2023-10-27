import { ADDRESSES } from '@deploy-configurations/addresses'
import { DeployedSystem } from '@deploy-configurations/types/deployed-system'
import { Network } from '@deploy-configurations/types/network'
import { DEFAULT_FEE as FEE, FEE_BASE, ONE } from '@dma-common/constants'
import { asPercentageValue, exchangeFromDAI, expect } from '@dma-common/test-utils'
import { FakeRequestEnv, RuntimeConfig } from '@dma-common/types/common'
import { balanceOf } from '@dma-common/utils/balances'
import { amountFromWei, amountToWei } from '@dma-common/utils/common'
import { calculateFeeOnInputAmount } from '@dma-common/utils/swap'
import { testBlockNumber } from '@dma-contracts/test/config'
import { restoreSnapshot, TestHelpers } from '@dma-contracts/utils'
import { Contract } from '@ethersproject/contracts'
import { JsonRpcProvider } from '@ethersproject/providers'
import { MockExchange } from '@typechain'
import BigNumber from 'bignumber.js'
import { Signer } from 'ethers'
import hre from 'hardhat'

const ALLOWED_PROTOCOLS = ['UNISWAP_V2', 'UNISWAP_V3']

describe('Swap | Unit', async () => {
  let provider: JsonRpcProvider
  let signer: Signer
  let address: string
  let WETH: Contract
  let DAI: Contract
  let feeBeneficiaryAddress: string
  let slippage: ReturnType<typeof asPercentageValue>
  let fee: ReturnType<typeof asPercentageValue>
  let config: RuntimeConfig
  let helpers: TestHelpers
  let fakeRequestEnv: FakeRequestEnv
  let system: DeployedSystem
  let receiveAtLeastInWei: BigNumber
  let data: string

  const amountInWei = amountToWei(1000)
  const feeAmount = calculateFeeOnInputAmount(amountInWei)
  const amountWithFeeInWei = amountInWei.plus(feeAmount)

  before(async () => {
    feeBeneficiaryAddress = ADDRESSES[Network.TEST].common.FeeRecipient
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
    helpers = snapshot.testSystem.helpers

    fakeRequestEnv = {
      mockExchange: system.MockExchange.contract as MockExchange,
      fakeWETH: helpers.fakeWETH,
      fakeDAI: helpers.fakeDAI,
    }

    WETH = helpers.fakeWETH.connect(signer)
    DAI = helpers.fakeDAI.connect(signer)

    const response = await exchangeFromDAI(
      WETH.address,
      amountInWei.toFixed(0),
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

  afterEach(async () => {
    await restoreSnapshot({ hre, blockNumber: testBlockNumber })
  })

  describe('DAI for Asset', async () => {
    let initialDaiWalletBalanceWei: BigNumber
    let beneficiaryDaiBalanceWeiBefore: BigNumber

    describe('when transferring an exact amount to the exchange', async () => {
      beforeEach(async () => {
        await helpers.fakeDAI.mint(address, amountWithFeeInWei.toFixed(0))

        beneficiaryDaiBalanceWeiBefore = await balanceOf(DAI.address, feeBeneficiaryAddress, {
          config,
        })
        initialDaiWalletBalanceWei = amountToWei(
          new BigNumber(
            await balanceOf(DAI.address, address, {
              config,
              isFormatted: true,
            }),
          ),
        )

        await DAI.approve(system.Swap.contract.address, amountWithFeeInWei.toFixed(0))

        await system.Swap.contract.swapTokens([
          DAI.address,
          WETH.address,
          amountWithFeeInWei.toFixed(0),
          receiveAtLeastInWei.toFixed(0),
          FEE,
          data,
          true,
        ])
      })

      it(`should receive at least amount specified in receiveAtLeast`, async () => {
        const wethBalanceWei = amountToWei(
          await balanceOf(WETH.address, address, {
            config,
            isFormatted: true,
          }),
        )
        const daiBalanceWei = amountToWei(
          await balanceOf(DAI.address, address, {
            config,
            isFormatted: true,
          }),
        )

        expect.toBeEqual(daiBalanceWei, initialDaiWalletBalanceWei.minus(amountWithFeeInWei), 0)
        expect.toBe(wethBalanceWei, 'gte', receiveAtLeastInWei)
      })

      it('should not have Asset amount left in the exchange', async () => {
        const exchangeWethBalanceWei = amountToWei(
          new BigNumber(
            await balanceOf(WETH.address, system.Swap.contract.address, {
              config,
              isFormatted: true,
            }),
          ),
        )
        expect.toBeEqual(exchangeWethBalanceWei, 0)
      })

      it('should not have DAI amount left in the exchange', async () => {
        const exchangeDaiBalanceWei = amountToWei(
          new BigNumber(
            await balanceOf(DAI.address, system.Swap.contract.address, {
              config,
              isFormatted: true,
            }),
          ),
        )
        expect.toBeEqual(exchangeDaiBalanceWei, 0)
      })

      it('should have collected fee', async () => {
        const beneficiaryDaiBalanceWeiAfter = await balanceOf(DAI.address, feeBeneficiaryAddress, {
          config,
        })
        const beneficiaryDaiBalanceWeiChange = beneficiaryDaiBalanceWeiAfter.minus(
          beneficiaryDaiBalanceWeiBefore,
        )
        expect.toBeEqual(beneficiaryDaiBalanceWeiChange, feeAmount, 0)
      })
    })

    describe('when transferring more amount to the exchange', async () => {
      let initialDaiWalletBalanceWei: BigNumber
      let moreThanTheTransferAmountWei: BigNumber
      let moreThanTheTransferAmountWithFee: BigNumber
      let surplusAmount: BigNumber

      beforeEach(async () => {
        surplusAmount = new BigNumber(10)

        moreThanTheTransferAmountWei = amountInWei.plus(amountToWei(surplusAmount))
        moreThanTheTransferAmountWithFee = calculateFeeOnInputAmount(
          moreThanTheTransferAmountWei,
        ).plus(moreThanTheTransferAmountWei)

        await helpers.fakeDAI.mint(address, moreThanTheTransferAmountWithFee.toFixed(0))
        await DAI.approve(system.Swap.contract.address, moreThanTheTransferAmountWithFee.toFixed(0))

        initialDaiWalletBalanceWei = amountToWei(
          new BigNumber(
            await balanceOf(DAI.address, address, {
              config,
              isFormatted: true,
            }),
          ),
        )

        await system.Swap.contract.swapTokens(
          [
            DAI.address,
            WETH.address,
            moreThanTheTransferAmountWithFee.toFixed(0),
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

      it('should exchange all needed amount and return the surplus', async () => {
        const wethBalanceWei = amountToWei(
          new BigNumber(
            await balanceOf(WETH.address, address, {
              config,
              isFormatted: true,
            }),
          ),
        )
        const daiBalanceWei = amountToWei(
          new BigNumber(
            await balanceOf(DAI.address, address, {
              config,
              isFormatted: true,
            }),
          ),
        )

        const collectedFeeWei = calculateFeeOnInputAmount(moreThanTheTransferAmountWei)

        expect.toBeEqual(
          daiBalanceWei,
          initialDaiWalletBalanceWei.minus(amountInWei).minus(collectedFeeWei),
          0,
        )
        expect.toBe(wethBalanceWei, 'gte', receiveAtLeastInWei)
      })

      it('should not have Asset amount left in the exchange', async () => {
        const exchangeWethBalanceWei = amountToWei(
          new BigNumber(
            await balanceOf(WETH.address, system.Swap.contract.address, {
              config,
              isFormatted: true,
            }),
          ),
        )
        expect.toBeEqual(exchangeWethBalanceWei, 0)
      })

      it('should not have DAI amount left in the exchange', async () => {
        const exchangeDaiBalanceWei = amountToWei(
          new BigNumber(
            await balanceOf(DAI.address, system.Swap.contract.address, {
              config,
              isFormatted: true,
            }),
          ),
        )
        expect.toBeEqual(exchangeDaiBalanceWei, 0)
      })

      it('should have collected fee', async () => {
        const beneficiaryDaiBalanceWeiAfter = await balanceOf(DAI.address, feeBeneficiaryAddress, {
          config,
        })
        const beneficiaryDaiBalanceWeiChange = beneficiaryDaiBalanceWeiAfter.minus(
          beneficiaryDaiBalanceWeiBefore,
        )
        const expectedCollectedFeeWei = moreThanTheTransferAmountWei.times(fee.asDecimal)
        expect.toBeEqual(beneficiaryDaiBalanceWeiChange, expectedCollectedFeeWei, 0)
      })
    })

    describe('when transferring less amount to the exchange', async () => {
      let initialDaiWalletBalanceWei: BigNumber
      let initialWethBalanceWei: BigNumber
      let lessThanTheTransferAmount: BigNumber
      let deficitAmount: BigNumber

      beforeEach(async () => {
        await helpers.fakeDAI.mint(address, amountWithFeeInWei.toFixed(0))

        initialDaiWalletBalanceWei = amountToWei(
          new BigNumber(
            await balanceOf(DAI.address, address, {
              config,
              isFormatted: true,
            }),
          ),
        )

        initialWethBalanceWei = amountToWei(
          new BigNumber(
            await balanceOf(WETH.address, address, {
              config,
              isFormatted: true,
            }),
          ),
        )

        deficitAmount = new BigNumber(10)
        lessThanTheTransferAmount = new BigNumber(amountWithFeeInWei).minus(
          amountToWei(deficitAmount),
        )

        await DAI.approve(system.Swap.contract.address, amountWithFeeInWei.toFixed(0))
      })

      it('should throw an error and not exchange anything', async () => {
        const tx = system.Swap.contract.swapTokens(
          [
            DAI.address,
            WETH.address,
            lessThanTheTransferAmount.toFixed(0),
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
        await expect(tx).to.be.revertedWith('SwapFailed()')
        const wethBalanceWei = amountToWei(
          new BigNumber(
            await balanceOf(WETH.address, address, {
              config,
              isFormatted: true,
            }),
          ),
        )
        const daiBalanceWei = amountToWei(
          new BigNumber(
            await balanceOf(DAI.address, address, {
              config,
              isFormatted: true,
            }),
          ),
        )

        expect.toBeEqual(daiBalanceWei, initialDaiWalletBalanceWei)
        expect.toBeEqual(wethBalanceWei, initialWethBalanceWei)
      })

      it('should not have Asset amount left in the exchange', async () => {
        const exchangeWethBalance = await balanceOf(WETH.address, system.Swap.contract.address, {
          config,
          isFormatted: true,
        })
        expect.toBeEqual(exchangeWethBalance, 0)
      })

      it('should not have DAI amount left in the exchange', async () => {
        const exchangeDaiBalance = await balanceOf(DAI.address, system.Swap.contract.address, {
          config,
          isFormatted: true,
        })
        expect.toBeEqual(exchangeDaiBalance, 0)
      })
    })

    describe('when sending some token amount in advance to the exchange', async () => {
      beforeEach(async () => {
        const doubleAmountWithFeeInWei = amountWithFeeInWei.times(2)

        await helpers.fakeDAI.mint(address, doubleAmountWithFeeInWei.toFixed(0))
        await DAI.approve(system.Swap.contract.address, doubleAmountWithFeeInWei.toFixed(0))
      })

      it('should transfer everything to the caller if the surplus is the same as the fromToken', async () => {
        const otherWallet = provider.getSigner(1)
        const transferredAmountWei = amountToWei(1)
        const initialWethWalletBalanceWei = amountToWei(
          new BigNumber(
            await balanceOf(WETH.address, address, {
              config,
              isFormatted: true,
            }),
          ),
        )

        await system.Swap.contract.swapTokens(
          [
            DAI.address,
            WETH.address,
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

        const wethFromExchangeInWei = amountToWei(
          await balanceOf(WETH.address, address, {
            config,
            isFormatted: true,
          }),
        ).minus(initialWethWalletBalanceWei)

        await WETH.connect(otherWallet).deposit({
          value: amountToWei(1).toFixed(0),
        })

        await WETH.connect(otherWallet).transfer(
          system.Swap.contract.address,
          transferredAmountWei.toFixed(0),
        )
        const exchangeWethBalanceWei = amountToWei(
          await balanceOf(WETH.address, system.Swap.contract.address, {
            config,
            isFormatted: true,
          }),
        )
        expect.toBeEqual(exchangeWethBalanceWei, transferredAmountWei)

        await system.Swap.contract.swapTokens(
          [
            DAI.address,
            WETH.address,
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

        const wethBalanceWei = amountToWei(
          await balanceOf(WETH.address, address, {
            config,
            isFormatted: true,
          }),
        )
        const expectedWethBalanceWei = initialWethWalletBalanceWei
          .plus(wethFromExchangeInWei)
          .plus(wethFromExchangeInWei)
          .plus(transferredAmountWei)

        expect.toBeEqual(wethBalanceWei, expectedWethBalanceWei)
      })

      it('should transfer everything to the caller if there is a surplus of DAI ', async () => {
        const otherWallet = provider.getSigner(1)
        const otherWalletAddress = await otherWallet.getAddress()
        const amountWei = amountToWei(ONE)

        await helpers.fakeDAI.mint(otherWalletAddress, amountWei.toFixed(0))

        const walletDaiBalanceWei = amountToWei(
          new BigNumber(
            await balanceOf(DAI.address, address, {
              config,
              isFormatted: true,
            }),
          ),
        )
        const otherWalletDaiBalance = new BigNumber(
          await balanceOf(DAI.address, otherWalletAddress, {
            config,
            isFormatted: true,
          }),
        )

        expect.toBe(otherWalletDaiBalance, 'gte', 1)

        await DAI.connect(otherWallet).transfer(system.Swap.contract.address, amountWei.toFixed(0))
        const exchangeDaiBalanceWei = amountToWei(
          new BigNumber(
            await balanceOf(DAI.address, system.Swap.contract.address, {
              config,
              isFormatted: true,
            }),
          ),
        )
        expect.toBeEqual(exchangeDaiBalanceWei, amountWei, 0)

        await system.Swap.contract.swapTokens(
          [
            DAI.address,
            WETH.address,
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

        const currentDaiBalanceWei = amountToWei(
          new BigNumber(
            await balanceOf(DAI.address, address, {
              config,
              isFormatted: true,
            }),
          ),
        )
        const expectedDaiBalanceWei = walletDaiBalanceWei
          .minus(amountWithFeeInWei)
          .plus(amountToWei(1))
        expect.toBeEqual(currentDaiBalanceWei, expectedDaiBalanceWei, 0)
      })
    })
  })
})
