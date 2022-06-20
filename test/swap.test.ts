import { JsonRpcProvider } from '@ethersproject/providers'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { Contract, Signer } from 'ethers'
import { ethers } from 'hardhat'

import ERC20ABI from '../abi/IERC20.json'
import WETHABI from '../abi/IWETH.json'
import { ADDRESSES } from '../helpers/addresses'
import { ONE } from '../helpers/constants'
import init from '../helpers/init'
import {
  exchangeFromDAI,
  exchangeToDAI,
  swapOneInchTokens,
  swapTokens,
} from '../helpers/swap/1inch'
import { RuntimeConfig } from '../helpers/types/common'
import { amountFromWei, amountToWei, asPercentageValue, balanceOf } from '../helpers/utils'
import { expectToBe, expectToBeEqual } from './utils'

const AGGREGATOR_V3_ADDRESS = ADDRESSES.main.oneInchAggregator
const ALLOWED_PROTOCOLS = ['UNISWAP_V2', 'UNISWAP_V2']
const FEE = 20
const FEE_BASE = 10000

function calculateFee(amountWei: BigNumber, fee: number = FEE): BigNumber {
  return amountWei.times(new BigNumber(fee).div(FEE_BASE)).integerValue(BigNumber.ROUND_DOWN)
}

describe('Swap', async () => {
  let provider: JsonRpcProvider
  let signer: Signer
  let address: string
  let swap: Contract
  let WETH: Contract
  let DAI: Contract
  let feeBeneficiary: string
  let slippage: ReturnType<typeof asPercentageValue>
  let fee: ReturnType<typeof asPercentageValue>
  let snapshotId: string
  let config: RuntimeConfig

  before(async () => {
    config = await init()
    provider = config.provider
    signer = config.signer
    address = config.address

    feeBeneficiary = ADDRESSES.main.feeRecipient
    slippage = asPercentageValue(8, 100)
    fee = asPercentageValue(FEE, FEE_BASE)

    const swapFactory = await ethers.getContractFactory('Swap', signer)
    swap = await swapFactory.deploy(address, feeBeneficiary, FEE)

    await swap.deployed()

    WETH = new ethers.Contract(ADDRESSES.main.WETH, WETHABI, provider).connect(signer)
    DAI = new ethers.Contract(ADDRESSES.main.DAI, ERC20ABI, provider).connect(signer)
  })

  beforeEach(async () => {
    snapshotId = await provider.send('evm_snapshot', [])
  })

  afterEach(async () => {
    await provider.send('evm_revert', [snapshotId])
  })

  describe('Fee tiers', async () => {
    it('should have fee beneficiary address set', async () => {
      const exchangeFeeBeneficiary = await swap.feeBeneficiaryAddress()
      expectToBeEqual(exchangeFeeBeneficiary, feeBeneficiary)
    })

    it('should have a whitelisted caller set', async () => {
      expect(await swap.WHITELISTED_CALLERS(address)).to.be.true
    })

    it('should not allow unauthorized caller to add the fee tier', async () => {
      const tx = swap.connect(provider.getSigner(1)).addFeeTier('30')
      await expect(tx).to.be.revertedWith('Swap / Unauthorized Caller')
    })

    it('should allow beneficiary to add the fee tier', async () => {
      const toTransferAmount = `0x${amountToWei(1).toString(16)}`
      const tx0 = await signer.populateTransaction({ to: feeBeneficiary, value: toTransferAmount })
      await signer.sendTransaction(tx0)
      await provider.send('hardhat_impersonateAccount', [feeBeneficiary])
      const beneficiary = ethers.provider.getSigner(feeBeneficiary)
      await swap.connect(beneficiary).addFeeTier('30')
    })

    it('should support adding multiple fee tiers', async () => {
      await swap.addFeeTier(30)
      await swap.addFeeTier(40)

      expect(await swap.getFee(0)).to.equal(20)
      expect(await swap.getFee(1)).to.equal(30)
      expect(await swap.getFee(2)).to.equal(40)
    })

    it('should throw on access to non existent fee tier', async () => {
      const tx = swap.getFee(2)
      await expect(tx).to.be.revertedWith('Swap / Fee Tier does not exist.')
    })

    it('should allow to use different tiers', async () => {
      const amountInWei = amountToWei(10)
      const fee = 50
      const feeAmount = calculateFee(amountInWei, fee)
      const amountInWeiWithFee = amountInWei.plus(feeAmount)
      await swap.addFeeTier(fee)

      const response = await swapOneInchTokens(
        WETH.address,
        DAI.address,
        amountInWei.toFixed(0),
        swap.address,
        slippage.value.toFixed(),
        ['UNISWAP_V2'],
      )

      const receiveAtLeast = amountFromWei(response.toTokenAmount).times(
        ONE.minus(slippage.asDecimal),
      )
      const receiveAtLeastInWei = amountToWei(receiveAtLeast)
      await WETH.deposit({ value: amountInWeiWithFee.toFixed() })
      await WETH.approve(swap.address, amountInWeiWithFee.toFixed())
      await swap.swapTokens(
        WETH.address,
        DAI.address,
        amountInWeiWithFee.toFixed(0),
        receiveAtLeastInWei.toFixed(0),
        '1',
        response.tx.to,
        response.tx.data,
        {
          value: 0,
          gasLimit: 2500000,
        },
      )

      const feeBeneficiaryBalance = await balanceOf(WETH.address, feeBeneficiary, { config })
      expectToBeEqual(amountToWei(feeBeneficiaryBalance), feeAmount)
    })
  })

  describe('Asset for DAI', async () => {
    const assetAmount = new BigNumber(10)
    const assetAmountInWei = amountToWei(assetAmount)
    const feeAmount = calculateFee(assetAmountInWei)
    const assetAmountInWeiWithFee = assetAmountInWei.plus(feeAmount)
    let initialDaiWalletBalance: BigNumber
    let receiveAtLeastInWei: BigNumber
    let to: string
    let data: string

    before(async () => {
      initialDaiWalletBalance = amountToWei(
        new BigNumber(await balanceOf(ADDRESSES.main.WETH, address, { config })),
      )

      const response = await exchangeToDAI(
        ADDRESSES.main.WETH,
        assetAmountInWei.toFixed(0),
        swap.address,
        slippage.value.toFixed(),
        ALLOWED_PROTOCOLS,
      )
      to = response.tx.to
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

      beforeEach(async () => {
        localSnapshotId = await provider.send('evm_snapshot', [])

        await WETH.deposit({
          value: amountToWei(1000).toFixed(0),
        })

        initialWethWalletBalance = amountToWei(
          new BigNumber(await balanceOf(ADDRESSES.main.WETH, address, { config })),
        )
        initialDaiWalletBalance = amountToWei(
          new BigNumber(await balanceOf(ADDRESSES.main.DAI, address, { config })),
        )

        await WETH.approve(swap.address, assetAmountInWeiWithFee.toFixed())

        await swap.swapTokens(
          ADDRESSES.main.WETH,
          ADDRESSES.main.DAI,
          assetAmountInWeiWithFee.toFixed(0),
          receiveAtLeastInWei.toFixed(0),
          '0',
          to,
          data,
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
          balanceOf(ADDRESSES.main.WETH, address, { config }),
          balanceOf(ADDRESSES.main.DAI, address, { config }),
        ])

        expectToBeEqual(
          amountToWei(wethBalance),
          initialWethWalletBalance.minus(assetAmountInWeiWithFee),
        )
        expectToBe(amountToWei(daiBalance), 'gte', receiveAtLeastInWei)
      })

      it('should not have Asset amount left in the exchange', async () => {
        const exchangeWethBalance = amountToWei(
          await balanceOf(ADDRESSES.main.WETH, swap.address, { config }),
        )
        const wethBalance = amountToWei(await balanceOf(ADDRESSES.main.WETH, address, { config }))

        expectToBeEqual(wethBalance, initialWethWalletBalance.minus(assetAmountInWeiWithFee))
        expectToBeEqual(exchangeWethBalance, 0)
      })

      it('should not have DAI amount left in the exchange', async () => {
        const exchangeDaiBalance = await balanceOf(ADDRESSES.main.DAI, swap.address, { config })
        expectToBeEqual(exchangeDaiBalance, 0)
      })

      it('should have collected fee', async () => {
        const beneficiaryWethBalance = amountToWei(
          await balanceOf(ADDRESSES.main.WETH, feeBeneficiary, { config }),
        )

        expectToBeEqual(beneficiaryWethBalance, feeAmount, 6)
      })
    })

    describe('when transferring more amount to the exchange', async () => {
      let initialWethWalletBalanceWei: BigNumber
      let moreThanTheTransferAmountWei: BigNumber
      let moreThanTheTransferFeeAmountWei: BigNumber
      let assetAmountInWeiWithFee: BigNumber
      let localSnapshotId: string

      beforeEach(async () => {
        localSnapshotId = await provider.send('evm_snapshot', [])

        await WETH.deposit({
          value: amountToWei(1000).toFixed(0),
        })

        initialWethWalletBalanceWei = amountToWei(
          new BigNumber(await balanceOf(ADDRESSES.main.WETH, address, { config })),
        )
        moreThanTheTransferAmountWei = assetAmountInWei.plus(amountToWei(10))
        moreThanTheTransferFeeAmountWei = moreThanTheTransferAmountWei
          .times(FEE)
          .div(new BigNumber(FEE).plus(FEE_BASE))
          .integerValue(BigNumber.ROUND_DOWN)
        assetAmountInWeiWithFee = assetAmountInWei.plus(moreThanTheTransferFeeAmountWei)

        await WETH.approve(swap.address, moreThanTheTransferAmountWei.toFixed(0))
        await swap.swapTokens(
          ADDRESSES.main.WETH,
          ADDRESSES.main.DAI,
          moreThanTheTransferAmountWei.toFixed(0),
          receiveAtLeastInWei.toFixed(0),
          '0',
          to,
          data,
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
          await balanceOf(ADDRESSES.main.WETH, address, { config }),
        )
        const daiBalanceWei = amountToWei(await balanceOf(ADDRESSES.main.DAI, address, { config }))
        // In case when user sends more than the amount to swap, the Swap will charge higher fee

        expectToBeEqual(wethBalanceWei, initialWethWalletBalanceWei.minus(assetAmountInWeiWithFee))
        expectToBe(daiBalanceWei, 'gte', receiveAtLeastInWei)
      })

      it('should not have Asset amount left in the exchange', async () => {
        const exchangeWethBalanceWei = amountToWei(
          await balanceOf(ADDRESSES.main.WETH, swap.address, { config }),
        )
        const wethBalanceWei = amountToWei(
          await balanceOf(ADDRESSES.main.WETH, address, { config }),
        )

        expectToBeEqual(exchangeWethBalanceWei, 0)
        expectToBeEqual(wethBalanceWei, initialWethWalletBalanceWei.minus(assetAmountInWeiWithFee))
      })

      it('should not have DAI amount left in the exchange', async () => {
        const exchangeDaiBalance = await balanceOf(ADDRESSES.main.DAI, swap.address, { config })
        expectToBeEqual(exchangeDaiBalance, 0)
      })

      it('should have collected fee in weth', async () => {
        const beneficiaryWethBalance = amountToWei(
          await balanceOf(ADDRESSES.main.WETH, feeBeneficiary, { config }),
        )

        expectToBeEqual(beneficiaryWethBalance, moreThanTheTransferFeeAmountWei)
      })
    })

    describe('when transferring less amount to the exchange', async () => {
      let initialWethWalletBalance: BigNumber
      let lessThanTheTransferAmount: BigNumber
      let localSnapshotId: string

      beforeEach(async () => {
        localSnapshotId = await provider.send('evm_snapshot', [])

        await WETH.deposit({
          value: amountToWei(1000).toFixed(0),
        })

        initialWethWalletBalance = new BigNumber(
          await balanceOf(ADDRESSES.main.WETH, address, { config }),
        )
        lessThanTheTransferAmount = assetAmountInWeiWithFee.minus(amountToWei(5))

        await WETH.approve(swap.address, lessThanTheTransferAmount.toFixed(0))
      })

      afterEach(async () => {
        await provider.send('evm_revert', [localSnapshotId])
      })

      it('should throw an error and not exchange anything', async () => {
        const tx = swap.swapTokens(
          ADDRESSES.main.WETH,
          ADDRESSES.main.DAI,
          lessThanTheTransferAmount.toFixed(0),
          receiveAtLeastInWei.toFixed(0),
          '0',
          to,
          data,
          {
            value: 0,
            gasLimit: 2500000,
          },
        )

        await expect(tx).to.be.revertedWith('Swap / Could not swap')

        const wethBalance = await balanceOf(ADDRESSES.main.WETH, address, { config })
        const daiBalance = await balanceOf(ADDRESSES.main.DAI, address, { config })

        expectToBeEqual(wethBalance, initialWethWalletBalance)
        expectToBeEqual(daiBalance, 0)
      })

      it('should not have Asset amount left in the exchange', async () => {
        const exchangeWethBalance = await balanceOf(ADDRESSES.main.WETH, swap.address, { config })
        const wethBalance = await balanceOf(ADDRESSES.main.WETH, address, { config })

        expectToBeEqual(exchangeWethBalance, 0)
        expectToBeEqual(wethBalance, initialWethWalletBalance)
      })

      it('should not have DAI amount left in the exchange', async () => {
        const exchangeDaiBalance = await balanceOf(ADDRESSES.main.DAI, swap.address, { config })
        expectToBeEqual(exchangeDaiBalance, 0)
      })
    })

    describe('when sending some token amount in advance to the exchange', async () => {
      let localSnapshotId: string

      beforeEach(async () => {
        localSnapshotId = await provider.send('evm_snapshot', [])

        await WETH.deposit({
          value: amountToWei(1000).toFixed(0),
        })

        await WETH.approve(swap.address, assetAmountInWeiWithFee.toFixed(0))
      })

      afterEach(async () => {
        await provider.send('evm_revert', [localSnapshotId])
      })

      it('should transfer everything to the caller if the surplus is the same as the fromToken', async () => {
        const otherWallet = provider.getSigner(1)
        const transferredAmountWei = amountToWei(1)
        const initialWethWalletBalanceWei = amountToWei(
          new BigNumber(await balanceOf(ADDRESSES.main.WETH, address, { config })),
        )

        await WETH.connect(otherWallet).deposit({
          value: amountToWei(1).toFixed(0),
        })
        await WETH.connect(otherWallet).transfer(swap.address, transferredAmountWei.toFixed(0))
        const exchangeWethBalance = await balanceOf(ADDRESSES.main.WETH, swap.address, { config })
        expectToBeEqual(exchangeWethBalance, transferredAmountWei)

        await swap.swapTokens(
          ADDRESSES.main.WETH,
          ADDRESSES.main.DAI,
          assetAmountInWeiWithFee.toFixed(0),
          receiveAtLeastInWei.toFixed(0),
          '0',
          to,
          data,
          {
            value: 0,
            gasLimit: 2500000,
          },
        )

        const walletWethBalanceWei = amountToWei(
          await balanceOf(ADDRESSES.main.WETH, address, { config }),
        )
        expectToBeEqual(
          walletWethBalanceWei,
          initialWethWalletBalanceWei.minus(assetAmountInWeiWithFee).plus(transferredAmountWei),
        )
      })

      it('should transfer everything to the caller if there is a surplus of DAI ', async () => {
        const otherWallet = provider.getSigner(1)
        const otherWalletAddress = await otherWallet.getAddress()
        const amount = amountToWei(1)

        await swapTokens(
          ADDRESSES.main.WETH,
          ADDRESSES.main.DAI,
          amount.toFixed(0), // swapping 1 ETH
          amount.toFixed(0), // expecting at least 1 DAI
          otherWalletAddress,
          provider,
          otherWallet,
        )

        const otherWalletDaiBalance = await balanceOf(ADDRESSES.main.DAI, otherWalletAddress, {
          config,
        })
        expectToBe(amountFromWei(otherWalletDaiBalance), 'gte', 1)

        await DAI.connect(otherWallet).transfer(swap.address, amount.toFixed(0))
        let exchangeDaiBalance = await balanceOf(ADDRESSES.main.DAI, swap.address, { config })
        expectToBeEqual(exchangeDaiBalance, amount, 0)

        await swap.swapTokens(
          ADDRESSES.main.WETH,
          ADDRESSES.main.DAI,
          assetAmountInWeiWithFee.toFixed(0),
          receiveAtLeastInWei.toFixed(0),
          '0',
          to,
          data,
          {
            value: 0,
            gasLimit: 2500000,
          },
        )

        // This assertion basically asserts the funds that were pre-deposit are not left within the exchange
        // This DOES NOT test if the fund were actually sent to the caller. There is no way to do that with current design
        exchangeDaiBalance = await balanceOf(ADDRESSES.main.DAI, swap.address, { config })
        expectToBeEqual(exchangeDaiBalance, 0)
      })
    })
  })

  describe('DAI for Asset', async () => {
    let initialDaiWalletBalance: BigNumber
    let amountInWei: BigNumber
    let amountWithFeeInWei: BigNumber
    let receiveAtLeastInWei: BigNumber
    let to: string
    let data: string

    before(async () => {
      amountInWei = amountToWei(1000)
      amountWithFeeInWei = calculateFee(amountInWei).plus(amountInWei)

      const response = await exchangeFromDAI(
        ADDRESSES.main.WETH,
        amountInWei.toFixed(0),
        slippage.value.toFixed(),
        swap.address,
        ALLOWED_PROTOCOLS,
      )

      to = response.tx.to
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

        await swapTokens(
          ADDRESSES.main.WETH,
          ADDRESSES.main.DAI,
          amountToWei(10).toFixed(0),
          amountWithFeeInWei.toFixed(0),
          address,
          provider,
          signer,
        )

        initialDaiWalletBalance = new BigNumber(
          await balanceOf(ADDRESSES.main.DAI, address, { config }),
        )

        await DAI.approve(swap.address, amountWithFeeInWei.toFixed(0))

        await swap.swapTokens(
          ADDRESSES.main.DAI,
          ADDRESSES.main.WETH,
          amountWithFeeInWei.toFixed(0),
          receiveAtLeastInWei.toFixed(0),
          '0',
          to,
          data,
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
        const wethBalance = await balanceOf(ADDRESSES.main.WETH, address, { config })
        const daiBalance = await balanceOf(ADDRESSES.main.DAI, address, { config })

        expectToBeEqual(daiBalance, initialDaiWalletBalance.minus(amountWithFeeInWei), 0)
        expectToBe(wethBalance, 'gte', receiveAtLeastInWei)
      })

      it('should not have Asset amount left in the exchange', async () => {
        const exchangeWethBalance = await balanceOf(ADDRESSES.main.WETH, swap.address, { config })
        expectToBeEqual(exchangeWethBalance, 0)
      })

      it('should not have DAI amount left in the exchange', async () => {
        const exchangeDaiBalance = await balanceOf(ADDRESSES.main.DAI, swap.address, { config })
        expectToBeEqual(exchangeDaiBalance, 0)
      })

      it('should have collected fee', async () => {
        const beneficiaryDaiBalance = await balanceOf(ADDRESSES.main.DAI, feeBeneficiary, {
          config,
        })
        const expectedCollectedFee = calculateFee(amountInWei)
        expectToBeEqual(beneficiaryDaiBalance, expectedCollectedFee, 0)
      })
    })

    describe('when transferring more amount to the exchange', async () => {
      let initialDaiWalletBalance: BigNumber
      let moreThanTheTransferAmount: BigNumber
      let moreThanTheTransferAmountWithFee: BigNumber
      let surplusAmount: BigNumber
      let localSnapshotId: string

      beforeEach(async () => {
        localSnapshotId = await provider.send('evm_snapshot', [])

        await swapTokens(
          ADDRESSES.main.WETH,
          ADDRESSES.main.DAI,
          amountToWei(10).toFixed(0),
          amountWithFeeInWei.toFixed(0),
          address,
          provider,
          signer,
        )

        initialDaiWalletBalance = new BigNumber(
          await balanceOf(ADDRESSES.main.DAI, address, { config }),
        )
        surplusAmount = new BigNumber(10)
        moreThanTheTransferAmount = amountInWei.plus(amountToWei(surplusAmount))
        moreThanTheTransferAmountWithFee =
          calculateFee(moreThanTheTransferAmount).plus(moreThanTheTransferAmount)

        await DAI.approve(swap.address, moreThanTheTransferAmountWithFee.toFixed(0))

        await swap.swapTokens(
          ADDRESSES.main.DAI,
          ADDRESSES.main.WETH,
          moreThanTheTransferAmountWithFee.toFixed(0),
          receiveAtLeastInWei.toFixed(0),
          '0',
          to,
          data,
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
        const wethBalance = await balanceOf(ADDRESSES.main.WETH, address, { config })
        const daiBalance = await balanceOf(ADDRESSES.main.DAI, address, { config })

        const collectedFee = calculateFee(moreThanTheTransferAmount)

        expectToBeEqual(
          daiBalance,
          initialDaiWalletBalance.minus(amountInWei).minus(collectedFee),
          0,
        )
        expectToBe(wethBalance, 'gte', receiveAtLeastInWei)
      })

      it('should not have Asset amount left in the exchange', async () => {
        const exchangeWethBalance = await balanceOf(ADDRESSES.main.WETH, swap.address, { config })
        expectToBeEqual(exchangeWethBalance, 0)
      })

      it('should not have DAI amount left in the exchange', async () => {
        const exchangeDaiBalance = await balanceOf(ADDRESSES.main.DAI, swap.address, { config })
        expectToBeEqual(exchangeDaiBalance, 0)
      })

      it('should have collected fee', async () => {
        const beneficiaryDaiBalance = await balanceOf(ADDRESSES.main.DAI, feeBeneficiary, {
          config,
        })

        const expectedCollectedFee = moreThanTheTransferAmount.times(fee.asDecimal)
        expectToBeEqual(beneficiaryDaiBalance, expectedCollectedFee, 0)
      })
    })

    describe('when transferring less amount to the exchange', async () => {
      let initialDaiWalletBalance: BigNumber
      let lessThanTheTransferAmount: BigNumber
      let deficitAmount: BigNumber
      let localSnapshotId: string

      beforeEach(async () => {
        localSnapshotId = await provider.send('evm_snapshot', [])

        await swapTokens(
          ADDRESSES.main.WETH,
          ADDRESSES.main.DAI,
          amountToWei(10).toFixed(0),
          amountWithFeeInWei.toFixed(0),
          address,
          provider,
          signer,
        )

        initialDaiWalletBalance = new BigNumber(
          await balanceOf(ADDRESSES.main.DAI, address, { config }),
        )
        deficitAmount = new BigNumber(10)
        lessThanTheTransferAmount = new BigNumber(amountWithFeeInWei).minus(
          amountToWei(deficitAmount),
        )

        await DAI.approve(swap.address, amountWithFeeInWei.toFixed(0))
      })

      afterEach(async () => {
        await provider.send('evm_revert', [localSnapshotId])
      })

      it('should throw an error and not exchange anything', async () => {
        const tx = swap.swapTokens(
          ADDRESSES.main.DAI,
          ADDRESSES.main.WETH,
          lessThanTheTransferAmount.toFixed(0),
          receiveAtLeastInWei.toFixed(0),
          '0',
          to,
          data,
          {
            value: 0,
            gasLimit: 2500000,
          },
        )
        await expect(tx).to.be.revertedWith('Swap / Could not swap')
        const wethBalance = await balanceOf(ADDRESSES.main.WETH, address, { config })
        const daiBalance = await balanceOf(ADDRESSES.main.DAI, address, { config })

        expectToBeEqual(daiBalance, initialDaiWalletBalance)
        expectToBeEqual(wethBalance, 0)
      })

      it('should not have Asset amount left in the exchange', async () => {
        const exchangeWethBalance = await balanceOf(ADDRESSES.main.WETH, swap.address, { config })
        expectToBeEqual(exchangeWethBalance, 0)
      })

      it('should not have DAI amount left in the exchange', async () => {
        const exchangeDaiBalance = await balanceOf(ADDRESSES.main.DAI, swap.address, { config })
        expectToBeEqual(exchangeDaiBalance, 0)
      })
    })

    describe('when sending some token amount in advance to the exchange', async () => {
      let localSnapshotId: string

      beforeEach(async () => {
        localSnapshotId = await provider.send('evm_snapshot', [])

        await swapTokens(
          ADDRESSES.main.WETH,
          ADDRESSES.main.DAI,
          amountToWei(10).toFixed(0),
          amountWithFeeInWei.toFixed(0),
          address,
          provider,
          signer,
        )

        await DAI.approve(swap.address, amountWithFeeInWei.toFixed(0))
      })

      afterEach(async () => {
        await provider.send('evm_revert', [localSnapshotId])
      })

      it('should transfer everything to the caller if the surplus is the same as the fromToken', async () => {
        const otherWallet = provider.getSigner(1)
        const transferredAmountWei = amountToWei(1)
        const initialWethWalletBalanceWei = amountToWei(
          new BigNumber(await balanceOf(ADDRESSES.main.WETH, address, { config })),
        )
        const temporarySnapshot = await provider.send('evm_snapshot', [])

        await swap.swapTokens(
          ADDRESSES.main.DAI,
          ADDRESSES.main.WETH,
          amountWithFeeInWei.toFixed(0),
          receiveAtLeastInWei.toFixed(0),
          '0',
          to,
          data,
          {
            value: 0,
            gasLimit: 2500000,
          },
        )

        const currentWethBalanceWei = amountToWei(
          await balanceOf(ADDRESSES.main.WETH, address, { config }),
        )

        await provider.send('evm_revert', [temporarySnapshot])

        await WETH.connect(otherWallet).deposit({
          value: amountToWei(1).toFixed(0),
        })

        await WETH.connect(otherWallet).transfer(swap.address, transferredAmountWei.toFixed(0))
        const exchangeWethBalanceWei = amountToWei(
          await balanceOf(ADDRESSES.main.WETH, swap.address, { config }),
        )
        expectToBeEqual(exchangeWethBalanceWei, transferredAmountWei)

        await swap.swapTokens(
          ADDRESSES.main.DAI,
          ADDRESSES.main.WETH,
          amountWithFeeInWei.toFixed(0),
          receiveAtLeastInWei.toFixed(0),
          '0',
          to,
          data,
          {
            value: 0,
            gasLimit: 2500000,
          },
        )

        const wethBalanceWei = amountToWei(
          await balanceOf(ADDRESSES.main.WETH, address, { config }),
        )
        const expectedWethBalanceWei = initialWethWalletBalanceWei
          .plus(currentWethBalanceWei)
          .plus(transferredAmountWei)
        expectToBeEqual(wethBalanceWei, expectedWethBalanceWei)
      })

      it('should transfer everything to the caller if there is a surplus of DAI ', async () => {
        const otherWallet = provider.getSigner(1)
        const otherWalletAddress = await otherWallet.getAddress()
        const amount = amountToWei(ONE)

        await swapTokens(
          ADDRESSES.main.WETH,
          ADDRESSES.main.DAI,
          amount.toFixed(0), // swapping 1 ETH
          amount.toFixed(0), // expecting at least 1 DAI
          otherWalletAddress,
          provider,
          otherWallet,
        )

        const walletDaiBalance = new BigNumber(
          await balanceOf(ADDRESSES.main.DAI, address, { config }),
        )
        const otherWalletDaiBalance = new BigNumber(
          await balanceOf(ADDRESSES.main.DAI, otherWalletAddress, { config }),
        )
        expectToBe(amountFromWei(otherWalletDaiBalance), 'gte', 1)

        await DAI.connect(otherWallet).transfer(swap.address, amount.toFixed(0))
        const exchangeDaiBalance = await balanceOf(ADDRESSES.main.DAI, swap.address, { config })
        expectToBeEqual(exchangeDaiBalance, amount, 0)

        await swap.swapTokens(
          ADDRESSES.main.DAI,
          ADDRESSES.main.WETH,
          amountWithFeeInWei.toFixed(0),
          receiveAtLeastInWei.toFixed(0),
          '0',
          to,
          data,
          {
            value: 0,
            gasLimit: 2500000,
          },
        )

        const currentDaiBalance = await balanceOf(ADDRESSES.main.DAI, address, { config })
        const expectedDaiBalance = walletDaiBalance.minus(amountWithFeeInWei).plus(amountToWei(1))
        expectToBeEqual(currentDaiBalance, expectedDaiBalance, 0)
      })
    })
  })

  describe('Asset for DAI without proper call parameters', async () => {
    const balance = amountToWei(1000)
    let localSnapshotId: string

    beforeEach(async () => {
      localSnapshotId = await provider.send('evm_snapshot', [])

      await WETH.deposit({
        value: balance.toFixed(0),
      })
    })

    afterEach(async () => {
      const wethBalance = await balanceOf(ADDRESSES.main.WETH, address, { config })
      expectToBeEqual(wethBalance, balance)
      await provider.send('evm_revert', [localSnapshotId])
    })

    it('should not have allowance set', async () => {
      const amountInWei = amountToWei(10)
      const receiveAtLeastInWeiAny = amountToWei(1)
      const data = 0

      const tx = swap.swapTokens(
        ADDRESSES.main.WETH,
        ADDRESSES.main.DAI,
        amountInWei.toFixed(0),
        receiveAtLeastInWeiAny.toFixed(0),
        '0',
        AGGREGATOR_V3_ADDRESS,
        data,
        {
          value: 0,
          gasLimit: 2500000,
        },
      )
      await expect(tx).to.be.revertedWith('Swap / Not enough allowance')
    })

    it('should not have received anything', async () => {
      const amountInWei = amountToWei(10)
      const receiveAtLeastInWeiAny = amountToWei(1)
      const randomAddress = '0xddD11F156bD353F110Ae11574Dc8f5E9f3cE9C7E'
      const data = 0

      await WETH.approve(swap.address, amountInWei.toFixed(0))

      const tx = swap.swapTokens(
        ADDRESSES.main.WETH,
        ADDRESSES.main.DAI,
        amountInWei.toFixed(0),
        receiveAtLeastInWeiAny.toFixed(0),
        '0',
        randomAddress,
        data,
        {
          value: 0,
          gasLimit: 2500000,
        },
      )

      await expect(tx).to.be.revertedWith('Swap / Received less')
    })

    it('should end up with unsuccessful swap', async () => {
      const amountInWei = amountToWei(10)
      const receiveAtLeastInWeiAny = amountToWei(1)
      const data = 0

      await WETH.approve(swap.address, amountInWei.toFixed(0))

      const tx = swap.swapTokens(
        ADDRESSES.main.WETH,
        ADDRESSES.main.DAI,
        amountInWei.toFixed(0),
        receiveAtLeastInWeiAny.toFixed(0),
        '0',
        AGGREGATOR_V3_ADDRESS,
        data,
        {
          value: 0,
          gasLimit: 2500000,
        },
      )
      await expect(tx).to.be.revertedWith('Swap / Could not swap')
    })

    it('should receive less', async () => {
      const amount = new BigNumber(10)
      const amountInWei = amountToWei(amount)
      const amountInWeiWithFee = calculateFee(amountInWei).plus(amountInWei)
      const receiveAtLeast = amountToWei(100000)

      await WETH.approve(swap.address, amountInWeiWithFee.toFixed(0))

      const response = await exchangeToDAI(
        ADDRESSES.main.WETH,
        amountInWei.toFixed(0),
        swap.address,
        slippage.value.toFixed(),
        ALLOWED_PROTOCOLS,
      )

      const tx = swap.swapTokens(
        ADDRESSES.main.WETH,
        ADDRESSES.main.DAI,
        amountInWeiWithFee.toFixed(0),
        receiveAtLeast.toFixed(0),
        '0',
        response.tx.to,
        response.tx.data,
      )
      await expect(tx).to.be.revertedWith('Swap / Received less')
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

      await swapTokens(
        ADDRESSES.main.WETH,
        ADDRESSES.main.DAI,
        amountToWei(10).toFixed(0),
        amountWithFeeInWei.toFixed(0),
        address,
        provider,
        signer,
      )

      daiBalance = new BigNumber(await balanceOf(ADDRESSES.main.DAI, address, { config }))
    })

    afterEach(async () => {
      const currentDaiBalance = await balanceOf(ADDRESSES.main.DAI, address, { config })
      expectToBeEqual(currentDaiBalance, daiBalance)
      await provider.send('evm_revert', [localSnapshotId])
    })

    it('should not have allowance set', async () => {
      const receiveAtLeastInWeiAny = amountToWei(1)
      const data = 0

      const tx = swap.swapTokens(
        ADDRESSES.main.DAI,
        ADDRESSES.main.WETH,
        amountWithFeeInWei.toFixed(0),
        receiveAtLeastInWeiAny.toFixed(0),
        '0',
        AGGREGATOR_V3_ADDRESS,
        data,
        {
          value: 0,
          gasLimit: 2500000,
        },
      )

      await expect(tx).to.be.revertedWith('Swap / Not enough allowance')
    })

    it('should not have received anything', async () => {
      const receiveAtLeastInWeiAny = amountToWei(1)
      const randomAddress = '0xddD11F156bD353F110Ae11574Dc8f5E9f3cE9C7E'
      const data = 0

      await DAI.approve(swap.address, amountWithFeeInWei.toFixed(0))

      const tx = swap.swapTokens(
        ADDRESSES.main.DAI,
        ADDRESSES.main.WETH,
        amountWithFeeInWei.toFixed(0),
        receiveAtLeastInWeiAny.toFixed(0),
        '0',
        randomAddress,
        data,
        {
          value: 0,
          gasLimit: 2500000,
        },
      )

      await expect(tx).to.be.revertedWith('Swap / Received less')
    })

    it('should end up with unsuccessful swap', async () => {
      const receiveAtLeastInWeiAny = amountToWei(1)
      const data = 0

      await DAI.approve(swap.address, amountWithFeeInWei.toFixed(0))

      const tx = swap.swapTokens(
        ADDRESSES.main.DAI,
        ADDRESSES.main.WETH,
        amountWithFeeInWei.toFixed(0),
        receiveAtLeastInWeiAny.toFixed(0),
        '0',
        AGGREGATOR_V3_ADDRESS,
        data,
        {
          value: 0,
          gasLimit: 2500000,
        },
      )
      await expect(tx).to.be.revertedWith('Swap / Could not swap')
    })

    it('should receive less', async () => {
      const receiveAtLeast = amountToWei(100000)

      await DAI.approve(swap.address, amountWithFeeInWei.toFixed(0))

      const response = await exchangeFromDAI(
        ADDRESSES.main.WETH,
        amountInWei.toFixed(0),
        slippage.value.toFixed(),
        swap.address,
        ALLOWED_PROTOCOLS,
      )

      const tx = swap.swapTokens(
        ADDRESSES.main.DAI,
        ADDRESSES.main.WETH,
        amountWithFeeInWei.toFixed(0),
        receiveAtLeast.toFixed(0),
        '0',
        response.tx.to,
        response.tx.data,
      )

      await expect(tx).to.be.revertedWith('Swap / Received less')
    })
  })

  describe('Asset with different precision and no fully ERC20 compliant for DAI', () => {
    let initialUSDTBalanceInWei: BigNumber
    let receiveAtLeastInWei: BigNumber
    let feeInUSDT: BigNumber
    let to: string
    let data: string
    let localSnapshotId: string

    before(async () => {
      localSnapshotId = await provider.send('evm_snapshot', [])

      await swapTokens(
        ADDRESSES.main.WETH,
        ADDRESSES.main.USDT,
        amountToWei(1).toFixed(0),
        amountToWei(100, 6).toFixed(0),
        address,
        provider,
        signer,
      )

      initialUSDTBalanceInWei = amountToWei(
        await balanceOf(ADDRESSES.main.USDT, address, { config, decimals: 6 }),
        6,
      )
      feeInUSDT = initialUSDTBalanceInWei
        .times(FEE)
        .div(new BigNumber(FEE_BASE).plus(FEE))
        .integerValue(BigNumber.ROUND_DOWN)

      const USDT = new ethers.Contract(ADDRESSES.main.USDT, ERC20ABI, provider).connect(signer)
      await USDT.approve(swap.address, initialUSDTBalanceInWei.toFixed(0))

      const response = await exchangeToDAI(
        ADDRESSES.main.USDT,
        initialUSDTBalanceInWei.minus(feeInUSDT).toFixed(0),
        swap.address,
        slippage.value.toFixed(),
        ['UNISWAP_V2'],
      )

      to = response.tx.to
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
      await swap.swapTokens(
        ADDRESSES.main.USDT,
        ADDRESSES.main.DAI,
        initialUSDTBalanceInWei.toFixed(0),
        receiveAtLeastInWei.toFixed(0),
        '0',
        to,
        data,
        {
          value: 0,
          gasLimit: 2500000,
        },
      )

      const currentUSDTBalance = await balanceOf(ADDRESSES.main.USDT, address, {
        config,
        decimals: 6,
      })
      const currentDaiBalance = await balanceOf(ADDRESSES.main.DAI, address, { config })

      expectToBeEqual(currentUSDTBalance, 0)
      expectToBe(currentDaiBalance, 'gte', receiveAtLeastInWei)
    })
  })

  describe('DAI for Asset with different precision and no fully ERC20 compliant', () => {
    let daiBalanceInWei: BigNumber
    let amountWithFeeInWei: BigNumber
    let receiveAtLeastInWei: BigNumber
    let to: string
    let data: string
    let localSnapshotId: string

    before(async () => {
      localSnapshotId = await provider.send('evm_snapshot', [])
      const amountInWei = amountToWei(1000)
      amountWithFeeInWei = calculateFee(amountInWei).plus(amountInWei)

      await swapTokens(
        ADDRESSES.main.WETH,
        ADDRESSES.main.DAI,
        amountToWei(10).toFixed(0),
        amountWithFeeInWei.toFixed(0),
        address,
        provider,
        signer,
      )

      daiBalanceInWei = amountToWei(await balanceOf(ADDRESSES.main.DAI, address, { config }))

      const response = await exchangeFromDAI(
        ADDRESSES.main.USDT,
        amountInWei.toFixed(0),
        slippage.value.toFixed(),
        swap.address,
        ['UNISWAP_V2'],
      )

      to = response.tx.to
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
      await DAI.approve(swap.address, amountWithFeeInWei.toFixed(0))
      await swap.swapTokens(
        ADDRESSES.main.DAI,
        ADDRESSES.main.USDT,
        amountWithFeeInWei.toFixed(0),
        receiveAtLeastInWei.toFixed(0),
        '0',
        to,
        data,
        {
          value: 0,
          gasLimit: 2500000,
        },
      )

      const currentUSDTBalance = await balanceOf(ADDRESSES.main.USDT, address, {
        config,
        decimals: 6,
      })
      const currentDaiBalance = await balanceOf(ADDRESSES.main.DAI, address, { config })

      expectToBeEqual(currentDaiBalance, daiBalanceInWei.minus(amountWithFeeInWei), 0)
      expectToBe(currentUSDTBalance, 'gte', amountFromWei(receiveAtLeastInWei, 6))
    })
  })

  describe('between two erc20 tokens, (no DAI in the pair)', () => {
    const fromToken = ADDRESSES.main.WETH
    const toToken = ADDRESSES.main.WBTC
    const amountInWei = amountToWei(10)
    const toTokenDecimals = 8
    let amountWithFeeInWei: BigNumber
    let receiveAtLeastInWei: BigNumber
    let to: string
    let data: string
    let localSnapshotId: string
    let wethBalanceBefore: BigNumber

    before(async () => {
      localSnapshotId = await provider.send('evm_snapshot', [])
      amountWithFeeInWei = calculateFee(amountInWei).plus(amountInWei)

      const response = await swapOneInchTokens(
        fromToken,
        toToken,
        amountInWei.toFixed(0),
        swap.address,
        slippage.value.toFixed(),
        ['UNISWAP_V2'],
      )

      to = response.tx.to
      data = response.tx.data

      const receiveAtLeast = amountFromWei(response.toTokenAmount, 8).times(
        ONE.minus(slippage.asDecimal),
      )
      receiveAtLeastInWei = amountToWei(receiveAtLeast, 8)
      await WETH.deposit({
        value: amountToWei(1000).toFixed(0),
      })
      wethBalanceBefore = new BigNumber(await balanceOf(WETH.address, address, { config }))
      await WETH.approve(swap.address, amountWithFeeInWei.toFixed(0))

      await swap.swapTokens(
        ADDRESSES.main.WETH,
        ADDRESSES.main.WBTC,
        amountWithFeeInWei.toFixed(0),
        receiveAtLeastInWei.toFixed(0),
        '0',
        to,
        data,
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
      const currentToTokenBalance = await balanceOf(toToken, address, {
        config,
        decimals: toTokenDecimals,
      })
      expectToBe(currentToTokenBalance, 'gte', receiveAtLeastInWei)
    })

    it('should exchange exact amount of fromToken + fee', async () => {
      const currentFromTokenBalance = new BigNumber(await balanceOf(fromToken, address, { config }))
      expectToBeEqual(
        wethBalanceBefore.minus(amountWithFeeInWei),
        currentFromTokenBalance.toFixed(0),
      )
    })

    it('should collect fee in fromToken', async () => {
      const feeWalletBalance = await balanceOf(fromToken, feeBeneficiary, { config })

      expectToBeEqual(feeWalletBalance, calculateFee(amountInWei))
    })

    it('should not leave any fromToken in Swap contract', async () => {
      const swapBalance = await balanceOf(fromToken, swap.address, { config })

      expectToBeEqual(swapBalance, 0)
    })

    it('should not leave any toToken in Swap contract', async () => {
      const swapBalance = await balanceOf(toToken, swap.address, { config })

      expectToBeEqual(swapBalance, 0)
    })
  })
})
