import ERC20_ABI from '@abis/external/tokens/IERC20.json'
import WETH_ABI from '@abis/external/tokens/IWETH.json'
import { initialiseConfig } from '@dma-contracts/test/fixtures'
import { ADDRESSES } from '@dma-deployments/addresses'
import { Network } from '@dma-deployments/types/network'
import { Contract } from '@ethersproject/contracts'
import { JsonRpcProvider } from '@ethersproject/providers'
import { FEE_BASE, ONE } from '@oasisdex/dma-common/constants'
import {
  asPercentageValue,
  DeployedSystemInfo,
  deploySystem,
  expect,
  FEE,
} from '@oasisdex/dma-common/test-utils'
import { RuntimeConfig } from '@oasisdex/dma-common/types/common'
import { amountFromWei, amountToWei, balanceOf } from '@oasisdex/dma-common/utils/common'
import {
  calculateFee,
  exchangeFromDAI,
  exchangeToDAI,
  swapOneInchTokens,
  swapUniswapTokens,
} from '@oasisdex/dma-common/utils/swap'
import BigNumber from 'bignumber.js'
import { Signer } from 'ethers'
import { ethers } from 'hardhat'

const ALLOWED_PROTOCOLS = ['UNISWAP_V2', 'UNISWAP_V3']

describe('Swap', async () => {
  let provider: JsonRpcProvider
  let signer: Signer
  let address: string
  let WETH: Contract
  let DAI: Contract
  let feeBeneficiary: string
  let slippage: ReturnType<typeof asPercentageValue>
  let fee: ReturnType<typeof asPercentageValue>
  let snapshotId: string
  let config: RuntimeConfig

  let system: DeployedSystemInfo

  before(async () => {
    ;({ config, provider, signer, address } = await initialiseConfig())

    await provider.send('hardhat_reset', [
      {
        forking: {
          jsonRpcUrl: process.env.MAINNET_URL,
        },
      },
    ])

    const { system: _system } = await deploySystem(config, false, false)
    system = _system

    feeBeneficiary = ADDRESSES[Network.MAINNET].common.FeeRecipient
    slippage = asPercentageValue(8, 100)
    fee = asPercentageValue(FEE, FEE_BASE)

    WETH = new ethers.Contract(ADDRESSES[Network.MAINNET].common.WETH, WETH_ABI, provider).connect(
      signer,
    )
    DAI = new ethers.Contract(ADDRESSES[Network.MAINNET].common.DAI, ERC20_ABI, provider).connect(
      signer,
    )
  })

  beforeEach(async () => {
    snapshotId = await provider.send('evm_snapshot', [])
  })

  afterEach(async () => {
    await provider.send('evm_revert', [snapshotId])
  })

  describe('Fee tiers', async () => {
    it('should have fee beneficiary address set', async () => {
      const exchangeFeeBeneficiary = await system.common.swap.feeBeneficiaryAddress()
      expect.toBeEqual(exchangeFeeBeneficiary, feeBeneficiary)
    })

    it('should have a whitelisted caller set', async () => {
      expect(await system.common.swap.authorizedAddresses(address)).to.be.true
    })

    it('should not allow unauthorized caller to add the fee tier', async () => {
      const tx = system.common.swap.connect(provider.getSigner(1)).addFeeTier('30')
      await expect(tx).to.be.revertedWith('Unauthorized()')
    })

    it('should allow beneficiary to add the fee tier', async () => {
      const toTransferAmount = `0x${amountToWei(1).toString(16)}`
      const tx0 = await signer.populateTransaction({ to: feeBeneficiary, value: toTransferAmount })
      await signer.sendTransaction(tx0)
      await provider.send('hardhat_impersonateAccount', [feeBeneficiary])
      const beneficiary = ethers.provider.getSigner(feeBeneficiary)
      await system.common.swap.connect(beneficiary).addFeeTier('30')
    })

    it('should support adding multiple fee tiers', async () => {
      await system.common.swap.addFeeTier(30)
      await system.common.swap.addFeeTier(40)

      expect(await system.common.swap.verifyFee(20)).to.equal(true)
      expect(await system.common.swap.verifyFee(30)).to.equal(true)
      expect(await system.common.swap.verifyFee(40)).to.equal(true)
    })

    it('should support removing fee tiers', async () => {
      await system.common.swap.addFeeTier(30)
      await system.common.swap.removeFeeTier(30)
      const isValid = await system.common.swap.verifyFee(30)

      expect(isValid).to.be.equal(false)
    })

    it('should verify is fee exists', async () => {
      const isFeeValid = await system.common.swap.verifyFee(2)
      expect(isFeeValid).to.equal(false)
    })

    it('should throw on adding feeTier that already exists', async () => {
      const tx = system.common.swap.addFeeTier(20)
      await expect(tx).to.be.revertedWith('FeeTierAlreadyExists(20)')
    })

    it('should allow to use different tiers', async () => {
      const amountInWei = amountToWei(10)
      const fee = 50
      const feeAmount = calculateFee(amountInWei, fee)
      const amountInWeiWithFee = amountInWei.plus(feeAmount)
      await system.common.swap.addFeeTier(fee)

      const response = await swapOneInchTokens(
        WETH.address,
        DAI.address,
        amountInWei.toFixed(0),
        system.common.swap.address,
        slippage.value.toFixed(),
        ALLOWED_PROTOCOLS,
      )

      const feeBeneficiaryBalanceBefore = await balanceOf(WETH.address, feeBeneficiary, {
        config,
        isFormatted: true,
      })
      const receiveAtLeastInWei = new BigNumber(response.toTokenAmount).times(
        ONE.minus(slippage.asDecimal),
      )
      await WETH.deposit({ value: amountInWeiWithFee.toFixed() })
      await WETH.approve(system.common.swap.address, amountInWeiWithFee.toFixed())
      await system.common.swap.swapTokens(
        [
          WETH.address,
          DAI.address,
          amountInWeiWithFee.toFixed(0),
          receiveAtLeastInWei.toFixed(0),
          fee,
          response.tx.data,
          true,
        ],
        {
          value: 0,
          gasLimit: 2500000,
        },
      )

      const feeBeneficiaryBalanceAfter = await balanceOf(WETH.address, feeBeneficiary, {
        config,
        isFormatted: true,
      })
      const feeBeneficiaryBalanceChange = feeBeneficiaryBalanceAfter.minus(
        feeBeneficiaryBalanceBefore,
      )
      expect.toBeEqual(amountToWei(feeBeneficiaryBalanceChange), feeAmount)
    })

    it('should throw an error when fee tier does not exist', async () => {
      const amountInWei = amountToWei(10)
      const fee = 99
      const feeAmount = calculateFee(amountInWei, fee)
      const amountInWeiWithFee = amountInWei.plus(feeAmount)

      const response = await swapOneInchTokens(
        WETH.address,
        DAI.address,
        amountInWei.toFixed(0),
        system.common.swap.address,
        slippage.value.toFixed(),
        ALLOWED_PROTOCOLS,
      )

      const receiveAtLeastInWei = new BigNumber(response.toTokenAmount).times(
        ONE.minus(slippage.asDecimal),
      )
      await WETH.deposit({ value: amountInWeiWithFee.toFixed() })
      await WETH.approve(system.common.swap.address, amountInWeiWithFee.toFixed())
      const tx = system.common.swap.swapTokens(
        [
          WETH.address,
          DAI.address,
          amountInWeiWithFee.toFixed(0),
          receiveAtLeastInWei.toFixed(0),
          fee,
          response.tx.data,
          true,
        ],
        {
          value: 0,
          gasLimit: 2500000,
        },
      )

      await expect(tx).to.be.revertedWith(`FeeTierDoesNotExist(${fee})`)
    })
  })

  describe('Asset for DAI', async () => {
    const assetAmount = new BigNumber(10)
    const assetAmountInWei = amountToWei(assetAmount)
    const feeAmount = calculateFee(assetAmountInWei)
    const assetAmountInWeiWithFee = assetAmountInWei.plus(feeAmount)
    let receiveAtLeastInWei: BigNumber
    let data: string

    before(async () => {
      const response = await exchangeToDAI(
        ADDRESSES[Network.MAINNET].common.WETH,
        assetAmountInWei.toFixed(0),
        system.common.swap.address,
        slippage.value.toFixed(),
        ALLOWED_PROTOCOLS,
      )
      data = response.tx.data

      const receiveAtLeast = amountFromWei(response.toTokenAmount).times(
        ONE.minus(slippage.asDecimal),
      )
      receiveAtLeastInWei = amountToWei(receiveAtLeast)
    })

    afterEach(async () => {
      await provider.send('evm_revert', [snapshotId])
    })

    describe('when transferring an exact amount to the exchange', async () => {
      let localSnapshotId: string
      let initialWethWalletBalance: BigNumber
      let feeBeneficiaryBalanceBefore: BigNumber

      beforeEach(async () => {
        localSnapshotId = await provider.send('evm_snapshot', [])

        await WETH.deposit({
          value: amountToWei(1000).toFixed(0),
        })
        feeBeneficiaryBalanceBefore = await balanceOf(WETH.address, feeBeneficiary, {
          config,
        })

        initialWethWalletBalance = amountToWei(
          new BigNumber(
            await balanceOf(ADDRESSES[Network.MAINNET].common.WETH, address, {
              config,
              isFormatted: true,
            }),
          ),
        )

        await WETH.approve(system.common.swap.address, assetAmountInWeiWithFee.toFixed())

        await system.common.swap.swapTokens(
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
      })

      afterEach(async () => {
        await provider.send('evm_revert', [localSnapshotId])
      })

      it(`should receive at least amount specified in receiveAtLeast`, async () => {
        const [wethBalance, daiBalance] = await Promise.all([
          balanceOf(ADDRESSES[Network.MAINNET].common.WETH, address, { config, isFormatted: true }),
          balanceOf(ADDRESSES[Network.MAINNET].common.DAI, address, { config, isFormatted: true }),
        ])

        expect.toBeEqual(
          amountToWei(wethBalance),
          initialWethWalletBalance.minus(assetAmountInWeiWithFee),
        )
        expect.toBe(amountToWei(daiBalance), 'gte', receiveAtLeastInWei)
      })

      it('should not have Asset amount left in the exchange', async () => {
        const exchangeWethBalance = amountToWei(
          await balanceOf(ADDRESSES[Network.MAINNET].common.WETH, system.common.swap.address, {
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

        expect.toBeEqual(wethBalance, initialWethWalletBalance.minus(assetAmountInWeiWithFee))
        expect.toBeEqual(exchangeWethBalance, 0)
      })

      it('should not have DAI amount left in the exchange', async () => {
        const exchangeDaiBalance = await balanceOf(
          ADDRESSES[Network.MAINNET].common.DAI,
          system.common.swap.address,
          {
            config,
            isFormatted: true,
          },
        )
        expect.toBeEqual(exchangeDaiBalance, 0)
      })

      it('should have collected fee', async () => {
        const beneficiaryWethBalanceAfter = await balanceOf(
          ADDRESSES[Network.MAINNET].common.WETH,
          feeBeneficiary,
          {
            config,
          },
        )
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
          feeBeneficiary,
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

        await WETH.approve(system.common.swap.address, fromAmountInWei.toFixed())

        const response = await exchangeToDAI(
          ADDRESSES[Network.MAINNET].common.WETH,
          fromAmountInWei.toFixed(0),
          system.common.swap.address,
          slippage.value.toFixed(),
          ALLOWED_PROTOCOLS,
        )

        const receiveAtLeastInWei = new BigNumber(response.toTokenAmount).times(
          ONE.minus(slippage.asDecimal),
        )

        await system.common.swap.swapTokens(
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
          feeBeneficiary,
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
          await balanceOf(ADDRESSES[Network.MAINNET].common.WETH, system.common.swap.address, {
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
          system.common.swap.address,
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
          feeBeneficiary,
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

        await WETH.approve(system.common.swap.address, moreThanTheTransferAmountWei.toFixed(0))
        await system.common.swap.swapTokens(
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
          await balanceOf(ADDRESSES[Network.MAINNET].common.WETH, system.common.swap.address, {
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
          system.common.swap.address,
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
          feeBeneficiary,
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

        await WETH.approve(system.common.swap.address, lessThanTheTransferAmount.toFixed(0))
      })

      afterEach(async () => {
        await provider.send('evm_revert', [localSnapshotId])
      })

      it('should throw an error and not exchange anything', async () => {
        const tx = system.common.swap.swapTokens(
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
          system.common.swap.address,
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
          system.common.swap.address,
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

        await WETH.approve(system.common.swap.address, assetAmountInWeiWithFee.toFixed(0))
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
          system.common.swap.address,
          transferredAmountWei.toFixed(0),
        )
        const exchangeWethBalanceWei = amountToWei(
          await balanceOf(ADDRESSES[Network.MAINNET].common.WETH, system.common.swap.address, {
            config,
            isFormatted: true,
          }),
        )
        expect.toBeEqual(exchangeWethBalanceWei, transferredAmountWei)

        await system.common.swap.swapTokens(
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

        await DAI.connect(otherWallet).transfer(system.common.swap.address, amountWei.toFixed(0))
        let exchangeDaiBalanceWei = amountToWei(
          new BigNumber(
            await balanceOf(ADDRESSES[Network.MAINNET].common.DAI, system.common.swap.address, {
              config,
              isFormatted: true,
            }),
          ),
        )
        expect.toBeEqual(exchangeDaiBalanceWei, amountWei, 0)

        await system.common.swap.swapTokens(
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
            await balanceOf(ADDRESSES[Network.MAINNET].common.DAI, system.common.swap.address, {
              config,
              isFormatted: true,
            }),
          ),
        )
        expect.toBeEqual(exchangeDaiBalanceWei, 0)
      })
    })
  })

  describe('DAI for Asset', async () => {
    let initialDaiWalletBalanceWei: BigNumber
    let beneficiaryDaiBalanceWeiBefore: BigNumber
    let amountInWei: BigNumber
    let amountWithFeeInWei: BigNumber
    let receiveAtLeastInWei: BigNumber
    let data: string

    before(async () => {
      amountInWei = amountToWei(1000)
      amountWithFeeInWei = calculateFee(amountInWei).plus(amountInWei)

      const response = await exchangeFromDAI(
        ADDRESSES[Network.MAINNET].common.WETH,
        amountInWei.toFixed(0),
        slippage.value.toFixed(),
        system.common.swap.address,
        ALLOWED_PROTOCOLS,
      )

      data = response.tx.data

      const receiveAtLeast = amountFromWei(response.toTokenAmount).times(
        ONE.minus(slippage.asDecimal),
      )
      receiveAtLeastInWei = amountToWei(receiveAtLeast)
    })

    describe('when transferring an exact amount to the exchange', async () => {
      let localSnapshotId: string

      beforeEach(async () => {
        localSnapshotId = await provider.send('evm_snapshot', [])

        await swapUniswapTokens(
          ADDRESSES[Network.MAINNET].common.WETH,
          ADDRESSES[Network.MAINNET].common.DAI,
          amountToWei(10).toFixed(0),
          amountWithFeeInWei.toFixed(0),
          address,
          config,
        )
        beneficiaryDaiBalanceWeiBefore = await balanceOf(
          ADDRESSES[Network.MAINNET].common.DAI,
          feeBeneficiary,
          {
            config,
          },
        )
        initialDaiWalletBalanceWei = amountToWei(
          new BigNumber(
            await balanceOf(ADDRESSES[Network.MAINNET].common.DAI, address, {
              config,
              isFormatted: true,
            }),
          ),
        )

        await DAI.approve(system.common.swap.address, amountWithFeeInWei.toFixed(0))

        await system.common.swap.swapTokens(
          [
            ADDRESSES[Network.MAINNET].common.DAI,
            ADDRESSES[Network.MAINNET].common.WETH,
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

        expect.toBeEqual(daiBalanceWei, initialDaiWalletBalanceWei.minus(amountWithFeeInWei), 0)
        expect.toBe(wethBalanceWei, 'gte', receiveAtLeastInWei)
      })

      it('should not have Asset amount left in the exchange', async () => {
        const exchangeWethBalanceWei = amountToWei(
          new BigNumber(
            await balanceOf(ADDRESSES[Network.MAINNET].common.WETH, system.common.swap.address, {
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
            await balanceOf(ADDRESSES[Network.MAINNET].common.DAI, system.common.swap.address, {
              config,
              isFormatted: true,
            }),
          ),
        )
        expect.toBeEqual(exchangeDaiBalanceWei, 0)
      })

      it('should have collected fee', async () => {
        const beneficiaryDaiBalanceWeiAfter = await balanceOf(
          ADDRESSES[Network.MAINNET].common.DAI,
          feeBeneficiary,
          {
            config,
          },
        )
        const beneficiaryDaiBalanceWeiChange = beneficiaryDaiBalanceWeiAfter.minus(
          beneficiaryDaiBalanceWeiBefore,
        )
        const expectedCollectedFee = calculateFee(amountInWei)
        expect.toBeEqual(beneficiaryDaiBalanceWeiChange, expectedCollectedFee, 0)
      })
    })

    describe('when transferring more amount to the exchange', async () => {
      let initialDaiWalletBalanceWei: BigNumber
      let moreThanTheTransferAmountWei: BigNumber
      let moreThanTheTransferAmountWithFee: BigNumber
      let surplusAmount: BigNumber
      let localSnapshotId: string

      beforeEach(async () => {
        localSnapshotId = await provider.send('evm_snapshot', [])

        await swapUniswapTokens(
          ADDRESSES[Network.MAINNET].common.WETH,
          ADDRESSES[Network.MAINNET].common.DAI,
          amountToWei(10).toFixed(0),
          amountWithFeeInWei.toFixed(0),
          address,
          config,
        )

        initialDaiWalletBalanceWei = amountToWei(
          new BigNumber(
            await balanceOf(ADDRESSES[Network.MAINNET].common.DAI, address, {
              config,
              isFormatted: true,
            }),
          ),
        )
        surplusAmount = new BigNumber(10)
        moreThanTheTransferAmountWei = amountInWei.plus(amountToWei(surplusAmount))
        moreThanTheTransferAmountWithFee = calculateFee(moreThanTheTransferAmountWei).plus(
          moreThanTheTransferAmountWei,
        )

        await DAI.approve(system.common.swap.address, moreThanTheTransferAmountWithFee.toFixed(0))

        await system.common.swap.swapTokens(
          [
            ADDRESSES[Network.MAINNET].common.DAI,
            ADDRESSES[Network.MAINNET].common.WETH,
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

      afterEach(async () => {
        await provider.send('evm_revert', [localSnapshotId])
      })

      it('should exchange all needed amount and return the surplus', async () => {
        const wethBalanceWei = amountToWei(
          new BigNumber(
            await balanceOf(ADDRESSES[Network.MAINNET].common.WETH, address, {
              config,
              isFormatted: true,
            }),
          ),
        )
        const daiBalanceWei = amountToWei(
          new BigNumber(
            await balanceOf(ADDRESSES[Network.MAINNET].common.DAI, address, {
              config,
              isFormatted: true,
            }),
          ),
        )

        const collectedFeeWei = calculateFee(moreThanTheTransferAmountWei)

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
            await balanceOf(ADDRESSES[Network.MAINNET].common.WETH, system.common.swap.address, {
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
            await balanceOf(ADDRESSES[Network.MAINNET].common.DAI, system.common.swap.address, {
              config,
              isFormatted: true,
            }),
          ),
        )
        expect.toBeEqual(exchangeDaiBalanceWei, 0)
      })

      it('should have collected fee', async () => {
        const beneficiaryDaiBalanceWeiAfter = await balanceOf(
          ADDRESSES[Network.MAINNET].common.DAI,
          feeBeneficiary,
          {
            config,
          },
        )
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
      let localSnapshotId: string

      beforeEach(async () => {
        localSnapshotId = await provider.send('evm_snapshot', [])

        await swapUniswapTokens(
          ADDRESSES[Network.MAINNET].common.WETH,
          ADDRESSES[Network.MAINNET].common.DAI,
          amountToWei(10).toFixed(0),
          amountWithFeeInWei.toFixed(0),
          address,
          config,
        )

        initialDaiWalletBalanceWei = amountToWei(
          new BigNumber(
            await balanceOf(ADDRESSES[Network.MAINNET].common.DAI, address, {
              config,
              isFormatted: true,
            }),
          ),
        )

        initialWethBalanceWei = amountToWei(
          new BigNumber(
            await balanceOf(ADDRESSES[Network.MAINNET].common.WETH, address, {
              config,
              isFormatted: true,
            }),
          ),
        )

        deficitAmount = new BigNumber(10)
        lessThanTheTransferAmount = new BigNumber(amountWithFeeInWei).minus(
          amountToWei(deficitAmount),
        )

        await DAI.approve(system.common.swap.address, amountWithFeeInWei.toFixed(0))
      })

      afterEach(async () => {
        await provider.send('evm_revert', [localSnapshotId])
      })

      it('should throw an error and not exchange anything', async () => {
        const tx = system.common.swap.swapTokens(
          [
            ADDRESSES[Network.MAINNET].common.DAI,
            ADDRESSES[Network.MAINNET].common.WETH,
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
            await balanceOf(ADDRESSES[Network.MAINNET].common.WETH, address, {
              config,
              isFormatted: true,
            }),
          ),
        )
        const daiBalanceWei = amountToWei(
          new BigNumber(
            await balanceOf(ADDRESSES[Network.MAINNET].common.DAI, address, {
              config,
              isFormatted: true,
            }),
          ),
        )

        expect.toBeEqual(daiBalanceWei, initialDaiWalletBalanceWei)
        expect.toBeEqual(wethBalanceWei, initialWethBalanceWei)
      })

      it('should not have Asset amount left in the exchange', async () => {
        const exchangeWethBalance = await balanceOf(
          ADDRESSES[Network.MAINNET].common.WETH,
          system.common.swap.address,
          { config, isFormatted: true },
        )
        expect.toBeEqual(exchangeWethBalance, 0)
      })

      it('should not have DAI amount left in the exchange', async () => {
        const exchangeDaiBalance = await balanceOf(
          ADDRESSES[Network.MAINNET].common.DAI,
          system.common.swap.address,
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

        await swapUniswapTokens(
          ADDRESSES[Network.MAINNET].common.WETH,
          ADDRESSES[Network.MAINNET].common.DAI,
          amountToWei(10).toFixed(0),
          amountWithFeeInWei.toFixed(0),
          address,
          config,
        )

        await DAI.approve(system.common.swap.address, amountWithFeeInWei.toFixed(0))
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

        const temporarySnapshot = await provider.send('evm_snapshot', [])

        await system.common.swap.swapTokens(
          [
            ADDRESSES[Network.MAINNET].common.DAI,
            ADDRESSES[Network.MAINNET].common.WETH,
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
          await balanceOf(ADDRESSES[Network.MAINNET].common.WETH, address, {
            config,
            isFormatted: true,
          }),
        ).minus(initialWethWalletBalanceWei)

        await provider.send('evm_revert', [temporarySnapshot])

        await WETH.connect(otherWallet).deposit({
          value: amountToWei(1).toFixed(0),
        })

        await WETH.connect(otherWallet).transfer(
          system.common.swap.address,
          transferredAmountWei.toFixed(0),
        )
        const exchangeWethBalanceWei = amountToWei(
          await balanceOf(ADDRESSES[Network.MAINNET].common.WETH, system.common.swap.address, {
            config,
            isFormatted: true,
          }),
        )
        expect.toBeEqual(exchangeWethBalanceWei, transferredAmountWei)

        await system.common.swap.swapTokens(
          [
            ADDRESSES[Network.MAINNET].common.DAI,
            ADDRESSES[Network.MAINNET].common.WETH,
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
          await balanceOf(ADDRESSES[Network.MAINNET].common.WETH, address, {
            config,
            isFormatted: true,
          }),
        )
        const expectedWethBalanceWei = initialWethWalletBalanceWei
          .plus(wethFromExchangeInWei)
          .plus(transferredAmountWei)
        expect.toBeEqual(wethBalanceWei, expectedWethBalanceWei)
      })

      it('should transfer everything to the caller if there is a surplus of DAI ', async () => {
        const otherWallet = provider.getSigner(1)
        const otherWalletAddress = await otherWallet.getAddress()
        const amountWei = amountToWei(ONE)

        await swapUniswapTokens(
          ADDRESSES[Network.MAINNET].common.WETH,
          ADDRESSES[Network.MAINNET].common.DAI,
          amountWei.toFixed(0), // swapping 1 ETH
          amountWei.toFixed(0), // expecting at least 1 DAI
          otherWalletAddress,
          { provider, signer: otherWallet, address: await otherWallet.getAddress() },
        )

        const walletDaiBalanceWei = amountToWei(
          new BigNumber(
            await balanceOf(ADDRESSES[Network.MAINNET].common.DAI, address, {
              config,
              isFormatted: true,
            }),
          ),
        )
        const otherWalletDaiBalance = new BigNumber(
          await balanceOf(ADDRESSES[Network.MAINNET].common.DAI, otherWalletAddress, {
            config,
            isFormatted: true,
          }),
        )

        expect.toBe(otherWalletDaiBalance, 'gte', 1)

        await DAI.connect(otherWallet).transfer(system.common.swap.address, amountWei.toFixed(0))
        const exchangeDaiBalanceWei = amountToWei(
          new BigNumber(
            await balanceOf(ADDRESSES[Network.MAINNET].common.DAI, system.common.swap.address, {
              config,
              isFormatted: true,
            }),
          ),
        )
        expect.toBeEqual(exchangeDaiBalanceWei, amountWei, 0)

        await system.common.swap.swapTokens(
          [
            ADDRESSES[Network.MAINNET].common.DAI,
            ADDRESSES[Network.MAINNET].common.WETH,
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
            await balanceOf(ADDRESSES[Network.MAINNET].common.DAI, address, {
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

  describe('Asset for DAI without proper call parameters', async () => {
    const balance = amountToWei(1000)
    let initialWethBalanceWei: BigNumber
    let localSnapshotId: string

    before(async () => {
      initialWethBalanceWei = amountToWei(
        await balanceOf(ADDRESSES[Network.MAINNET].common.WETH, address, {
          config,
          isFormatted: true,
        }),
      )
    })

    beforeEach(async () => {
      localSnapshotId = await provider.send('evm_snapshot', [])

      await WETH.deposit({
        value: balance.toFixed(0),
      })
    })

    afterEach(async () => {
      const wethBalance = amountToWei(
        await balanceOf(ADDRESSES[Network.MAINNET].common.WETH, address, {
          config,
          isFormatted: true,
        }),
      )
      expect.toBeEqual(wethBalance, initialWethBalanceWei.plus(balance))
      await provider.send('evm_revert', [localSnapshotId])
    })

    it('should not have allowance set', async () => {
      const amountInWei = amountToWei(10)
      const receiveAtLeastInWeiAny = amountToWei(1)
      const data = 0

      const tx = system.common.swap.swapTokens(
        [
          ADDRESSES[Network.MAINNET].common.WETH,
          ADDRESSES[Network.MAINNET].common.DAI,
          amountInWei.toFixed(0),
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
      await expect(tx).to.be.revertedWith('SafeERC20: low-level call failed')
    })

    it('should end up with unsuccessful swap', async () => {
      const amountInWei = amountToWei(10)
      const receiveAtLeastInWeiAny = amountToWei(1)
      const data = 0

      await WETH.approve(system.common.swap.address, amountInWei.toFixed(0))

      const tx = system.common.swap.swapTokens(
        [
          ADDRESSES[Network.MAINNET].common.WETH,
          ADDRESSES[Network.MAINNET].common.DAI,
          amountInWei.toFixed(0),
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
      const amount = new BigNumber(10)
      const amountInWei = amountToWei(amount)
      const amountInWeiWithFee = calculateFee(amountInWei).plus(amountInWei)
      const receiveAtLeast = amountToWei(100000)

      await WETH.approve(system.common.swap.address, amountInWeiWithFee.toFixed(0))

      const response = await exchangeToDAI(
        ADDRESSES[Network.MAINNET].common.WETH,
        amountInWei.toFixed(0),
        system.common.swap.address,
        slippage.value.toFixed(),
        ALLOWED_PROTOCOLS,
      )

      const tx = system.common.swap.swapTokens([
        ADDRESSES[Network.MAINNET].common.WETH,
        ADDRESSES[Network.MAINNET].common.DAI,
        amountInWeiWithFee.toFixed(0),
        receiveAtLeast.toFixed(0),
        FEE,
        response.tx.data,
        true,
      ])

      const expectedRevert = /ReceivedLess\(100000000000000000000000, \d+\)/
      await expect.revert(expectedRevert, tx)
    })
  })

  describe('DAI for Asset without proper call parameters', async () => {
    let amountInWei: BigNumber
    let amountWithFeeInWei: BigNumber
    let daiBalance: BigNumber
    let localSnapshotId: string

    beforeEach(async () => {
      localSnapshotId = await provider.send('evm_snapshot', [])

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
      await provider.send('evm_revert', [localSnapshotId])
    })

    it('should not have allowance set', async () => {
      const receiveAtLeastInWeiAny = amountToWei(1)
      const data = 0

      const tx = system.common.swap.swapTokens(
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

      await DAI.approve(system.common.swap.address, amountWithFeeInWei.toFixed(0))

      const tx = system.common.swap.swapTokens(
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

      await DAI.approve(system.common.swap.address, amountWithFeeInWei.toFixed(0))

      const response = await exchangeFromDAI(
        ADDRESSES[Network.MAINNET].common.WETH,
        amountInWei.toFixed(0),
        slippage.value.toFixed(),
        system.common.swap.address,
        ALLOWED_PROTOCOLS,
      )

      const tx = system.common.swap.swapTokens([
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
      await USDT.approve(system.common.swap.address, initialUSDTBalanceInWei.toFixed(0))

      const response = await exchangeToDAI(
        ADDRESSES[Network.MAINNET].common.USDT,
        initialUSDTBalanceInWei.minus(feeInUSDT).toFixed(0),
        system.common.swap.address,
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
      await system.common.swap.swapTokens(
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
        system.common.swap.address,
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
      await DAI.approve(system.common.swap.address, amountWithFeeInWei.toFixed(0))
      await system.common.swap.swapTokens(
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

  describe('between two erc20 tokens, (no DAI in the pair)', () => {
    const fromToken = ADDRESSES[Network.MAINNET].common.WETH
    const toToken = ADDRESSES[Network.MAINNET].common.WBTC
    const amountInWei = amountToWei(10)
    const toTokenDecimals = 8
    let feeWalletBalanceWeiBefore: BigNumber
    let amountWithFeeInWei: BigNumber
    let receiveAtLeastInWei: BigNumber
    let data: string
    let localSnapshotId: string
    let wethBalanceBeforeWei: BigNumber

    before(async () => {
      localSnapshotId = await provider.send('evm_snapshot', [])
      amountWithFeeInWei = calculateFee(amountInWei).plus(amountInWei)

      const response = await swapOneInchTokens(
        fromToken,
        toToken,
        amountInWei.toFixed(0),
        system.common.swap.address,
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
      feeWalletBalanceWeiBefore = await balanceOf(fromToken, feeBeneficiary, { config })
      await WETH.approve(system.common.swap.address, amountWithFeeInWei.toFixed(0))

      await system.common.swap.swapTokens(
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

    after(async () => {
      await provider.send('evm_revert', [localSnapshotId])
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
      const feeWalletBalanceWeiAfter = await balanceOf(fromToken, feeBeneficiary, { config })
      const feeWalletBalanceWeiChange = feeWalletBalanceWeiAfter.minus(feeWalletBalanceWeiBefore)

      expect.toBeEqual(feeWalletBalanceWeiChange, calculateFee(amountInWei))
    })

    it('should not leave any fromToken in Swap contract', async () => {
      const swapBalance = await balanceOf(fromToken, system.common.swap.address, {
        config,
        isFormatted: true,
      })

      expect.toBeEqual(swapBalance, 0)
    })

    it('should not leave any toToken in Swap contract', async () => {
      const swapBalance = await balanceOf(toToken, system.common.swap.address, {
        config,
        isFormatted: true,
      })

      expect.toBeEqual(swapBalance, 0)
    })
  })
})
