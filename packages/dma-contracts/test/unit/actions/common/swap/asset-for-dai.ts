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
  TestHelpers,
} from '@dma-common/test-utils'
import { FakeRequestEnv, RuntimeConfig } from '@dma-common/types/common'
import { balanceOf } from '@dma-common/utils/balances'
import { amountFromWei, amountToWei } from '@dma-common/utils/common'
import { calculateFeeOnInputAmount } from '@dma-common/utils/swap'
import { testBlockNumber } from '@dma-contracts/test/config'
import { Contract } from '@ethersproject/contracts'
import { JsonRpcProvider } from '@ethersproject/providers'
import { MockExchange } from '@typechain'
import BigNumber from 'bignumber.js'
import { Signer } from 'ethers'
import hre from 'hardhat'

const ALLOWED_PROTOCOLS = ['UNISWAP_V2', 'UNISWAP_V3']

// TODO: OneInch tests are failing
describe.only('Swap | Unit', async () => {
  let provider: JsonRpcProvider
  let signer: Signer
  let address: string
  let WETH: Contract
  let DAI: Contract
  let feeBeneficiaryAddress: string
  let slippage: ReturnType<typeof asPercentageValue>
  let config: RuntimeConfig
  let system: DeployedSystem
  let helpers: TestHelpers
  let fakeRequestEnv: FakeRequestEnv

  describe('Asset for DAI', async () => {
    const assetAmount = new BigNumber(10)
    const assetAmountInWei = amountToWei(assetAmount)
    const feeAmount = calculateFeeOnInputAmount(assetAmountInWei)
    const assetAmountInWeiWithFee = assetAmountInWei.plus(feeAmount)
    let receiveAtLeastInWei: BigNumber
    let data: string

    before(async () => {
      slippage = asPercentageValue(8, 100)

      feeBeneficiaryAddress = ADDRESSES[Network.TEST].common.FeeRecipient
    })

    beforeEach(async () => {
      const { snapshot } = await restoreSnapshot({
        hre,
        blockNumber: testBlockNumber,
      })

      provider = snapshot.config.provider
      signer = snapshot.config.signer
      address = snapshot.config.address
      config = snapshot.config
      system = snapshot.testSystem.deployment.system
      helpers = snapshot.testSystem.helpers

      fakeRequestEnv = {
        mockExchange: system.MockExchange.contract as MockExchange,
        fakeWETH: helpers.fakeWETH,
        fakeDAI: helpers.fakeDAI,
      }

      WETH = helpers.fakeWETH.connect(signer)
      DAI = helpers.fakeDAI.connect(signer)

      const response = await exchangeToDAI(
        WETH.address,
        assetAmountInWei.toFixed(0),
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

    describe.only('when transferring an exact amount to the exchange', async () => {
      let initialWethWalletBalance: BigNumber
      let feeBeneficiaryBalanceBefore: BigNumber

      beforeEach(async () => {
        await WETH.deposit({
          value: amountToWei(1000).toFixed(0),
        })
        feeBeneficiaryBalanceBefore = await balanceOf(WETH.address, feeBeneficiaryAddress, {
          config,
        })

        initialWethWalletBalance = amountToWei(
          new BigNumber(
            await balanceOf(helpers.fakeWETH.address, address, {
              config,
              isFormatted: true,
            }),
          ),
        )

        await WETH.approve(system.Swap.contract.address, assetAmountInWeiWithFee.toFixed())

        await system.Swap.contract.swapTokens(
          [
            WETH.address,
            DAI.address,
            assetAmountInWeiWithFee.toFixed(0),
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

      it(`should receive at least amount specified in receiveAtLeast`, async () => {
        const [wethBalance, daiBalance] = await Promise.all([
          balanceOf(WETH.address, address, { config, isFormatted: true }),
          balanceOf(DAI.address, address, { config, isFormatted: true }),
        ])

        expect.toBeEqual(
          amountToWei(wethBalance),
          initialWethWalletBalance.minus(assetAmountInWeiWithFee),
        )
        expect.toBe(amountToWei(daiBalance), 'gte', receiveAtLeastInWei)
      })

      it('should not have Asset amount left in the exchange', async () => {
        const exchangeWethBalance = amountToWei(
          await balanceOf(WETH.address, system.Swap.contract.address, {
            config,
            isFormatted: true,
          }),
        )
        const wethBalance = amountToWei(
          await balanceOf(WETH.address, address, {
            config,
            isFormatted: true,
          }),
        )

        expect.toBeEqual(wethBalance, initialWethWalletBalance.minus(assetAmountInWeiWithFee))
        expect.toBeEqual(exchangeWethBalance, 0)
      })

      it('should not have DAI amount left in the exchange', async () => {
        const exchangeDaiBalance = await balanceOf(DAI.address, system.Swap.contract.address, {
          config,
          isFormatted: true,
        })
        expect.toBeEqual(exchangeDaiBalance, 0)
      })

      it('should have collected fee', async () => {
        const beneficiaryWethBalanceAfter = await balanceOf(WETH.address, feeBeneficiaryAddress, {
          config,
        })
        const feeBeneficiaryChange = beneficiaryWethBalanceAfter.minus(feeBeneficiaryBalanceBefore)
        expect.toBeEqual(feeBeneficiaryChange, feeAmount, 6)
      })
    })

    describe('when taking fee in toToken', async () => {
      let localSnapshotId: string
      let initialWethWalletBalance: BigNumber
      let initialDaiWalletBalance: BigNumber
      let feeWalletBalanceBefore: BigNumber
      const fromAmountInWei = amountToWei(new BigNumber(10))

      beforeEach(async () => {
        localSnapshotId = await provider.send('evm_snapshot', [])

        await WETH.deposit({
          value: amountToWei(1000).toFixed(0),
        })

        feeWalletBalanceBefore = await balanceOf(
          ADDRESSES[Network.MAINNET].common.DAI,
          feeBeneficiaryAddress,
          {
            config,
          },
        )
        initialWethWalletBalance = new BigNumber(
          await balanceOf(ADDRESSES[Network.MAINNET].common.WETH, address, { config }),
        )

        initialDaiWalletBalance = new BigNumber(
          await balanceOf(ADDRESSES[Network.MAINNET].common.DAI, address, { config }),
        )

        await WETH.approve(system.Swap.contract.address, fromAmountInWei.toFixed())

        const response = await exchangeToDAI(
          ADDRESSES[Network.MAINNET].common.WETH,
          fromAmountInWei.toFixed(0),
          system.Swap.contract.address,
          slippage.value.toFixed(),
          ALLOWED_PROTOCOLS,
        )

        const receiveAtLeastInWei = new BigNumber(response.toTokenAmount).times(
          ONE.minus(slippage.asDecimal),
        )

        await system.Swap.contract.swapTokens(
          [
            ADDRESSES[Network.MAINNET].common.WETH,
            ADDRESSES[Network.MAINNET].common.DAI,
            fromAmountInWei.toFixed(0),
            receiveAtLeastInWei.toFixed(0),
            FEE,
            response.tx.data,
            false,
          ],
          {
            value: 0,
            gasLimit: 2500000,
          },
        )
      })

      afterEach(async () => {
        await provider.send('evm_revert', [localSnapshotId])
      })

      it(`should collect fee in DAI (toToken)`, async () => {
        const feeWalletBalanceAfter = await balanceOf(
          ADDRESSES[Network.MAINNET].common.DAI,
          feeBeneficiaryAddress,
          {
            config,
          },
        )
        const daiBalance = await balanceOf(ADDRESSES[Network.MAINNET].common.DAI, address, {
          config,
        })

        const expectedFee = daiBalance
          .minus(initialDaiWalletBalance)
          .times(new BigNumber(FEE).div(FEE_BASE))
          .toFixed(0, BigNumber.ROUND_DOWN)
        const feeWalletBalanceChange = feeWalletBalanceAfter.minus(feeWalletBalanceBefore)
        expect.toBeEqual(expectedFee, feeWalletBalanceChange)

        expect.toBe(daiBalance.plus(feeWalletBalanceChange), 'gte', receiveAtLeastInWei)
      })

      it('should not have Asset amount left in the exchange', async () => {
        const exchangeWethBalance = amountToWei(
          await balanceOf(ADDRESSES[Network.MAINNET].common.WETH, system.Swap.contract.address, {
            config,
            isFormatted: true,
          }),
        )
        const wethBalance = amountToWei(
          await balanceOf(ADDRESSES[Network.MAINNET].common.WETH, address, {
            config,
            isFormatted: true,
          }),
        )

        expect.toBeEqual(wethBalance, initialWethWalletBalance.minus(fromAmountInWei))
        expect.toBeEqual(exchangeWethBalance, 0)
      })

      it('should not have DAI amount left in the exchange', async () => {
        const exchangeDaiBalance = await balanceOf(
          ADDRESSES[Network.MAINNET].common.DAI,
          system.Swap.contract.address,
          {
            config,
            isFormatted: true,
          },
        )
        expect.toBeEqual(exchangeDaiBalance, 0)
      })
    })

    describe('when transferring more amount to the exchange', async () => {
      let initialWethWalletBalanceWei: BigNumber
      let beneficiaryWethBalanceBefore: BigNumber
      let moreThanTheTransferAmountWei: BigNumber
      let moreThanTheTransferFeeAmountWei: BigNumber
      let assetAmountInWeiWithFee: BigNumber
      let localSnapshotId: string

      beforeEach(async () => {
        localSnapshotId = await provider.send('evm_snapshot', [])

        beneficiaryWethBalanceBefore = await balanceOf(
          ADDRESSES[Network.MAINNET].common.WETH,
          feeBeneficiaryAddress,
          {
            config,
          },
        )

        await WETH.deposit({
          value: amountToWei(1000).toFixed(0),
        })

        initialWethWalletBalanceWei = amountToWei(
          new BigNumber(
            await balanceOf(ADDRESSES[Network.MAINNET].common.WETH, address, {
              config,
              isFormatted: true,
            }),
          ),
        )
        moreThanTheTransferAmountWei = assetAmountInWei.plus(amountToWei(10))
        moreThanTheTransferFeeAmountWei = moreThanTheTransferAmountWei
          .times(FEE)
          .div(new BigNumber(FEE).plus(FEE_BASE))
          .integerValue(BigNumber.ROUND_DOWN)
        assetAmountInWeiWithFee = assetAmountInWei.plus(moreThanTheTransferFeeAmountWei)

        await WETH.approve(system.Swap.contract.address, moreThanTheTransferAmountWei.toFixed(0))
        await system.Swap.contract.swapTokens(
          [
            ADDRESSES[Network.MAINNET].common.WETH,
            ADDRESSES[Network.MAINNET].common.DAI,
            moreThanTheTransferAmountWei.toFixed(0),
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

      afterEach(async () => {
        await provider.send('evm_revert', [localSnapshotId])
      })

      it(`should receive at least amount specified in receiveAtLeast`, async () => {
        const wethBalanceWei = amountToWei(
          await balanceOf(ADDRESSES[Network.MAINNET].common.WETH, address, {
            config,
            isFormatted: true,
          }),
        )
        const daiBalanceWei = amountToWei(
          await balanceOf(ADDRESSES[Network.MAINNET].common.DAI, address, {
            config,
            isFormatted: true,
          }),
        )
        // In case when user sends more than the amount to swap, the Swap will charge higher fee

        expect.toBeEqual(wethBalanceWei, initialWethWalletBalanceWei.minus(assetAmountInWeiWithFee))
        expect.toBe(daiBalanceWei, 'gte', receiveAtLeastInWei)
      })

      it('should not have Asset amount left in the exchange', async () => {
        const exchangeWethBalanceWei = amountToWei(
          await balanceOf(ADDRESSES[Network.MAINNET].common.WETH, system.Swap.contract.address, {
            config,
            isFormatted: true,
          }),
        )
        const wethBalanceWei = amountToWei(
          await balanceOf(ADDRESSES[Network.MAINNET].common.WETH, address, {
            config,
            isFormatted: true,
          }),
        )

        expect.toBeEqual(exchangeWethBalanceWei, 0)
        expect.toBeEqual(wethBalanceWei, initialWethWalletBalanceWei.minus(assetAmountInWeiWithFee))
      })

      it('should not have DAI amount left in the exchange', async () => {
        const exchangeDaiBalance = await balanceOf(
          ADDRESSES[Network.MAINNET].common.DAI,
          system.Swap.contract.address,
          {
            config,
            isFormatted: true,
          },
        )
        expect.toBeEqual(exchangeDaiBalance, 0)
      })

      it('should have collected fee in weth', async () => {
        const beneficiaryWethBalanceAfter = await balanceOf(
          ADDRESSES[Network.MAINNET].common.WETH,
          feeBeneficiaryAddress,
          {
            config,
          },
        )

        const beneficiaryWethBalanceChange = beneficiaryWethBalanceAfter.minus(
          beneficiaryWethBalanceBefore,
        )
        expect.toBeEqual(beneficiaryWethBalanceChange, moreThanTheTransferFeeAmountWei)
      })
    })

    describe('when transferring less amount to the exchange', async () => {
      let initialWethWalletBalance: BigNumber
      let lessThanTheTransferAmount: BigNumber
      let initialDaiBalance: BigNumber
      let localSnapshotId: string

      beforeEach(async () => {
        localSnapshotId = await provider.send('evm_snapshot', [])

        await WETH.deposit({
          value: amountToWei(1000).toFixed(0),
        })

        initialWethWalletBalance = new BigNumber(
          await balanceOf(ADDRESSES[Network.MAINNET].common.WETH, address, {
            config,
            isFormatted: true,
          }),
        )

        initialDaiBalance = new BigNumber(
          await balanceOf(ADDRESSES[Network.MAINNET].common.DAI, address, {
            config,
            isFormatted: true,
          }),
        )

        lessThanTheTransferAmount = assetAmountInWeiWithFee.minus(amountToWei(5))

        await WETH.approve(system.Swap.contract.address, lessThanTheTransferAmount.toFixed(0))
      })

      afterEach(async () => {
        await provider.send('evm_revert', [localSnapshotId])
      })

      it('should throw an error and not exchange anything', async () => {
        const tx = system.Swap.contract.swapTokens(
          [
            ADDRESSES[Network.MAINNET].common.WETH,
            ADDRESSES[Network.MAINNET].common.DAI,
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

        const wethBalance = await balanceOf(ADDRESSES[Network.MAINNET].common.WETH, address, {
          config,
          isFormatted: true,
        })
        const daiBalance = await balanceOf(ADDRESSES[Network.MAINNET].common.DAI, address, {
          config,
          isFormatted: true,
        })

        expect.toBeEqual(wethBalance, initialWethWalletBalance)
        expect.toBeEqual(daiBalance, initialDaiBalance)
      })

      it('should not have Asset amount left in the exchange', async () => {
        const exchangeWethBalance = await balanceOf(
          ADDRESSES[Network.MAINNET].common.WETH,
          system.Swap.contract.address,
          { config, isFormatted: true },
        )
        const wethBalance = await balanceOf(ADDRESSES[Network.MAINNET].common.WETH, address, {
          config,
          isFormatted: true,
        })

        expect.toBeEqual(exchangeWethBalance, 0)
        expect.toBeEqual(wethBalance, initialWethWalletBalance)
      })

      it('should not have DAI amount left in the exchange', async () => {
        const exchangeDaiBalance = await balanceOf(
          ADDRESSES[Network.MAINNET].common.DAI,
          system.Swap.contract.address,
          {
            config,
            isFormatted: true,
          },
        )
        expect.toBeEqual(exchangeDaiBalance, 0)
      })
    })

    describe('when sending some token amount in advance to the exchange', async () => {
      let localSnapshotId: string

      beforeEach(async () => {
        localSnapshotId = await provider.send('evm_snapshot', [])

        await WETH.deposit({
          value: amountToWei(1000).toFixed(0),
        })

        await WETH.approve(system.Swap.contract.address, assetAmountInWeiWithFee.toFixed(0))
      })

      afterEach(async () => {
        await provider.send('evm_revert', [localSnapshotId])
      })

      it('should transfer everything to the caller if the surplus is the same as the fromToken', async () => {
        const otherWallet = provider.getSigner(1)
        const transferredAmountWei = amountToWei(1)
        const initialWethWalletBalanceWei = amountToWei(
          new BigNumber(
            await balanceOf(ADDRESSES[Network.MAINNET].common.WETH, address, {
              config,
              isFormatted: true,
            }),
          ),
        )

        await WETH.connect(otherWallet).deposit({
          value: amountToWei(1).toFixed(0),
        })
        await WETH.connect(otherWallet).transfer(
          system.Swap.contract.address,
          transferredAmountWei.toFixed(0),
        )
        const exchangeWethBalanceWei = amountToWei(
          await balanceOf(ADDRESSES[Network.MAINNET].common.WETH, system.Swap.contract.address, {
            config,
            isFormatted: true,
          }),
        )
        expect.toBeEqual(exchangeWethBalanceWei, transferredAmountWei)

        await system.Swap.contract.swapTokens(
          [
            ADDRESSES[Network.MAINNET].common.WETH,
            ADDRESSES[Network.MAINNET].common.DAI,
            assetAmountInWeiWithFee.toFixed(0),
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

        const walletWethBalanceWei = amountToWei(
          await balanceOf(ADDRESSES[Network.MAINNET].common.WETH, address, {
            config,
            isFormatted: true,
          }),
        )
        expect.toBeEqual(
          walletWethBalanceWei,
          initialWethWalletBalanceWei.minus(assetAmountInWeiWithFee).plus(transferredAmountWei),
        )
      })

      it('should transfer everything to the caller if there is a surplus of DAI ', async () => {
        const otherWallet = provider.getSigner(1)
        const otherWalletAddress = await otherWallet.getAddress()
        const amountWei = amountToWei(1)

        await swapUniswapTokens(
          ADDRESSES[Network.MAINNET].common.WETH,
          ADDRESSES[Network.MAINNET].common.DAI,
          amountWei.toFixed(0), // swapping 1 ETH
          amountWei.toFixed(0), // expecting at least 1 DAI
          otherWalletAddress,
          {
            provider,
            signer: otherWallet,
            address: await otherWallet.getAddress(),
          },
        )

        const otherWalletDaiBalance = await balanceOf(
          ADDRESSES[Network.MAINNET].common.DAI,
          otherWalletAddress,
          {
            config,
            isFormatted: true,
          },
        )

        expect.toBe(otherWalletDaiBalance, 'gte', 1)

        await DAI.connect(otherWallet).transfer(system.Swap.contract.address, amountWei.toFixed(0))
        let exchangeDaiBalanceWei = amountToWei(
          new BigNumber(
            await balanceOf(ADDRESSES[Network.MAINNET].common.DAI, system.Swap.contract.address, {
              config,
              isFormatted: true,
            }),
          ),
        )
        expect.toBeEqual(exchangeDaiBalanceWei, amountWei, 0)

        await system.Swap.contract.swapTokens(
          [
            ADDRESSES[Network.MAINNET].common.WETH,
            ADDRESSES[Network.MAINNET].common.DAI,
            assetAmountInWeiWithFee.toFixed(0),
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

        // This assertion basically asserts the funds that were pre-deposit are not left within the exchange
        // This DOES NOT test if the fund were actually sent to the caller. There is no way to do that with current design
        exchangeDaiBalanceWei = amountToWei(
          new BigNumber(
            await balanceOf(ADDRESSES[Network.MAINNET].common.DAI, system.Swap.contract.address, {
              config,
              isFormatted: true,
            }),
          ),
        )
        expect.toBeEqual(exchangeDaiBalanceWei, 0)
      })
    })
  })
})
