import { ethers } from 'hardhat'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { JsonRpcProvider } from '@ethersproject/providers'
import { Contract, Signer } from 'ethers'
import WETHABI from '../abi/IWETH.json'
import ERC20ABI from '../abi/IERC20.json'
import MAINNET_ADDRESSES from '../addresses/mainnet.json'
import { init, FEE, FEE_BASE, swapTokens } from './common/utils/mcd-deployment.utils'
import { exchangeToDAI, exchangeFromDAI, exchangeAnyTokens } from './common/http-apis'

import { asPercentageValue, expectToBe, expectToBeEqual } from './common/utils/test.utils'
import { ADDRESSES, one } from './common/cosntants'
import { amountFromWei, amountToWei, balanceOf } from '../helpers/utils'

const AGGREGATOR_V3_ADDRESS = '0x11111112542d85b3ef69ae05771c2dccff4faa26'
const ALLOWED_PROTOCOLS = ['UNISWAP_V2','UNISWAP_V2']

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

  before(async () => {
    ;[provider, signer] = await init({ provider, signer })
    address = await signer.getAddress()

    feeBeneficiary = ADDRESSES.feeRecipient
    slippage = asPercentageValue(8, 100)
    fee = asPercentageValue(FEE, FEE_BASE)

    const swapFactory = await ethers.getContractFactory('Swap', signer)
    swap = await swapFactory.deploy(address, feeBeneficiary, FEE)

    await swap.deployed()

    WETH = new ethers.Contract(MAINNET_ADDRESSES.ETH, WETHABI, provider).connect(signer)
    DAI = new ethers.Contract(MAINNET_ADDRESSES.MCD_DAI, ERC20ABI, provider).connect(signer)
  })

  beforeEach(async () => {
    snapshotId = await provider.send('evm_snapshot', [])
  })

  afterEach(async () => {
    await provider.send('evm_revert', [snapshotId])
  })

  describe('Fee tiers', async () => {
    before(async () => {
      
    })

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

    it.only('should allow to use different tiers', async () => {
      const amountInWei = amountToWei(10)
      const fee = 50
      const feeAmount = calculateFee(amountInWei, fee)
      const amountInWeiWithFee = amountInWei.plus(feeAmount)
      await swap.addFeeTier(fee)

      const response = await exchangeAnyTokens(
        WETH.address,
        DAI.address,
        amountInWei.toFixed(0),
        swap.address,
        slippage.value.toFixed(),
        ['UNISWAP_V2'],
      )

      const receiveAtLeast = amountFromWei(response.toTokenAmount).times(
        one.minus(slippage.asDecimal),
      )
      const receiveAtLeastInWei = amountToWei(receiveAtLeast)
      await WETH.deposit({value: amountInWeiWithFee.toFixed()})
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

      const feeBeneficiaryBalance = await balanceOf(WETH.address, feeBeneficiary, {})
      expectToBeEqual(feeBeneficiaryBalance, feeAmount)
    })
  })

  describe('Asset for DAI', async () => {
    let assetAmount = new BigNumber(10)
    let assetAmountInWei = amountToWei(assetAmount)
    let feeAmount = calculateFee(assetAmountInWei)
    let assetAmountInWeiWithFee = amountToWei(assetAmount).plus(feeAmount)
    let initialDaiWalletBalance: BigNumber
    let receiveAtLeastInWei: BigNumber
    let to: string
    let data: string

    before(async () => {
      initialDaiWalletBalance = await balanceOf(MAINNET_ADDRESSES.ETH, address)

      const response = await exchangeToDAI(
        MAINNET_ADDRESSES.ETH,
        assetAmountInWei.toFixed(0),
        swap.address,
        slippage.value.toFixed(),
        ALLOWED_PROTOCOLS,
      )
      to = response.tx.to
      data = response.tx.data

      const receiveAtLeast = amountFromWei(response.toTokenAmount).times(
        one.minus(slippage.asDecimal),
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

        initialWethWalletBalance = await balanceOf(MAINNET_ADDRESSES.ETH, address)
        initialDaiWalletBalance = await balanceOf(MAINNET_ADDRESSES.MCD_DAI, address)

        await WETH.approve(swap.address, assetAmountInWeiWithFee.toFixed())

        await swap.swapTokens(
          MAINNET_ADDRESSES.ETH,
          MAINNET_ADDRESSES.MCD_DAI,
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
          balanceOf(MAINNET_ADDRESSES.ETH, address),
          balanceOf(MAINNET_ADDRESSES.MCD_DAI, address),
        ])

        expectToBeEqual(wethBalance, initialWethWalletBalance.minus(assetAmountInWeiWithFee))
        expectToBe(daiBalance, 'gte', receiveAtLeastInWei)
      })

      it('should not have Asset amount left in the exchange', async () => {
        const exchangeWethBalance = await balanceOf(MAINNET_ADDRESSES.ETH, swap.address)
        const wethBalance = await balanceOf(MAINNET_ADDRESSES.ETH, address)

        expectToBeEqual(wethBalance, initialWethWalletBalance.minus(assetAmountInWeiWithFee))
        expectToBeEqual(exchangeWethBalance, 0)
      })

      it('should not have DAI amount left in the exchange', async () => {
        const exchangeDaiBalance = await balanceOf(MAINNET_ADDRESSES.MCD_DAI, swap.address)
        expectToBeEqual(exchangeDaiBalance, 0)
      })

      it('should have collected fee', async () => {
        const beneficiaryWethBalance = await balanceOf(MAINNET_ADDRESSES.ETH, feeBeneficiary)

        expectToBeEqual(beneficiaryWethBalance, feeAmount, 6)
      })
    })

    describe('when transferring more amount to the exchange', async () => {
      let initialWethWalletBalance: BigNumber
      let moreThanTheTransferAmount: BigNumber
      let moreThanTheTransferFeeAmount: BigNumber
      let assetAmountInWeiWithFee: BigNumber
      let localSnapshotId: string

      beforeEach(async () => {
        localSnapshotId = await provider.send('evm_snapshot', [])

        await WETH.deposit({
          value: amountToWei(1000).toFixed(0),
        })

        initialWethWalletBalance = await balanceOf(MAINNET_ADDRESSES.ETH, address)
        moreThanTheTransferAmount = assetAmountInWei.plus(amountToWei(10))
        moreThanTheTransferFeeAmount = moreThanTheTransferAmount.times(FEE).div(new BigNumber(FEE).plus(FEE_BASE)).integerValue(BigNumber.ROUND_DOWN)
        assetAmountInWeiWithFee = assetAmountInWei.plus(moreThanTheTransferFeeAmount)

        await WETH.approve(swap.address, moreThanTheTransferAmount.toFixed(0))
        await swap.swapTokens(
          MAINNET_ADDRESSES.ETH,
          MAINNET_ADDRESSES.MCD_DAI,
          moreThanTheTransferAmount.toFixed(0),
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
        const wethBalance = await balanceOf(MAINNET_ADDRESSES.ETH, address)
        const daiBalance = await balanceOf(MAINNET_ADDRESSES.MCD_DAI, address)
        // In case when user sends more than the amount to swap, the Swap will charge higher fee
 
        expectToBeEqual(wethBalance.toFixed(0), initialWethWalletBalance.minus(assetAmountInWeiWithFee))
        expectToBe(daiBalance, 'gte', receiveAtLeastInWei)
      })
      
      it('should not have Asset amount left in the exchange', async () => {
        const exchangeWethBalance = await balanceOf(MAINNET_ADDRESSES.ETH, swap.address)
        const wethBalance = await balanceOf(MAINNET_ADDRESSES.ETH, address)

        expectToBeEqual(exchangeWethBalance, 0)
        expectToBeEqual(wethBalance, initialWethWalletBalance.minus(assetAmountInWeiWithFee))
      })

      it('should not have DAI amount left in the exchange', async () => {
        const exchangeDaiBalance = await balanceOf(MAINNET_ADDRESSES.MCD_DAI, swap.address)
        expectToBeEqual(exchangeDaiBalance, 0)
      })

      it('should have collected fee', async () => {
        const beneficiaryDaiBalance = await balanceOf(MAINNET_ADDRESSES.ETH, feeBeneficiary)

        expectToBeEqual(amountFromWei(beneficiaryDaiBalance), amountFromWei(moreThanTheTransferFeeAmount), 6)
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

        initialWethWalletBalance = await balanceOf(MAINNET_ADDRESSES.ETH, address)
        lessThanTheTransferAmount = assetAmountInWeiWithFee.minus(amountToWei(5))

        await WETH.approve(swap.address, lessThanTheTransferAmount.toFixed(0))
      })

      afterEach(async () => {
        await provider.send('evm_revert', [localSnapshotId])
      })

      it('should throw an error and not exchange anything', async () => {
        const tx = swap.swapTokens(
          MAINNET_ADDRESSES.ETH,
          MAINNET_ADDRESSES.MCD_DAI,
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

        const wethBalance = await balanceOf(MAINNET_ADDRESSES.ETH, address)
        const daiBalance = await balanceOf(MAINNET_ADDRESSES.MCD_DAI, address)

        expectToBeEqual(wethBalance, initialWethWalletBalance)
        expectToBeEqual(daiBalance, 0)
      })

      it('should not have Asset amount left in the exchange', async () => {
        const exchangeWethBalance = await balanceOf(MAINNET_ADDRESSES.ETH, swap.address)
        const wethBalance = await balanceOf(MAINNET_ADDRESSES.ETH, address)

        expectToBeEqual(exchangeWethBalance, 0)
        expectToBeEqual(wethBalance, initialWethWalletBalance)
      })

      it('should not have DAI amount left in the exchange', async () => {
        const exchangeDaiBalance = await balanceOf(MAINNET_ADDRESSES.MCD_DAI, swap.address)
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
        const transferredAmount = amountToWei(1)
        const initialWethWalletBalance = await balanceOf(MAINNET_ADDRESSES.ETH, address)

        await WETH.connect(otherWallet).deposit({
          value: amountToWei(1).toFixed(0),
        })
        await WETH.connect(otherWallet).transfer(swap.address, transferredAmount.toFixed(0))
        const exchangeWethBalance = await balanceOf(MAINNET_ADDRESSES.ETH, swap.address)
        expectToBeEqual(exchangeWethBalance, transferredAmount)

        await swap.swapTokens(
          MAINNET_ADDRESSES.ETH,
          MAINNET_ADDRESSES.MCD_DAI,
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

        const walletWethBalance = await balanceOf(MAINNET_ADDRESSES.ETH, address)
        expectToBeEqual(
          walletWethBalance,
          initialWethWalletBalance.minus(assetAmountInWeiWithFee).plus(transferredAmount),
        )
      })

      it('should transfer everything to the caller if there is a surplus of DAI ', async () => {
        const otherWallet = provider.getSigner(1)
        const otherWalletAddress = await otherWallet.getAddress()
        const amount = amountToWei(1)

        await swapTokens(
          MAINNET_ADDRESSES.ETH,
          MAINNET_ADDRESSES.MCD_DAI,
          amount.toFixed(0), // swapping 1 ETH
          amount.toFixed(0), // expecting at least 1 DAI
          otherWalletAddress,
          provider,
          otherWallet,
        )

      

        const otherWalletDaiBalance = await balanceOf(MAINNET_ADDRESSES.MCD_DAI, otherWalletAddress)
        expectToBe(amountFromWei(otherWalletDaiBalance), 'gte', 1)

        await DAI.connect(otherWallet).transfer(swap.address, amount.toFixed(0))
        let exchangeDaiBalance = await balanceOf(MAINNET_ADDRESSES.MCD_DAI, swap.address)
        expectToBeEqual(exchangeDaiBalance, amount, 0)

        await swap.swapTokens(
          MAINNET_ADDRESSES.ETH,
          MAINNET_ADDRESSES.MCD_DAI,
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
        exchangeDaiBalance = await balanceOf(MAINNET_ADDRESSES.MCD_DAI, swap.address)
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
        MAINNET_ADDRESSES.ETH,
        amountInWei.toFixed(0),
        slippage.value.toFixed(),
        swap.address,
        ALLOWED_PROTOCOLS,
      )

      to = response.tx.to
      data = response.tx.data

      const receiveAtLeast = amountFromWei(response.toTokenAmount).times(
        one.minus(slippage.asDecimal),
      )
      receiveAtLeastInWei = amountToWei(receiveAtLeast)
    })

    describe('when transferring an exact amount to the exchange', async () => {
      let localSnapshotId: string

      beforeEach(async () => {
        localSnapshotId = await provider.send('evm_snapshot', [])
        
        await swapTokens(
          MAINNET_ADDRESSES.ETH,
          MAINNET_ADDRESSES.MCD_DAI,
          amountToWei(10).toFixed(0),
          amountWithFeeInWei.toFixed(0),
          address,
          provider,
          signer,
        )

        initialDaiWalletBalance = await balanceOf(MAINNET_ADDRESSES.MCD_DAI, address)
     
        await DAI.approve(swap.address, amountWithFeeInWei.toFixed(0))

        await swap.swapTokens(
          MAINNET_ADDRESSES.MCD_DAI,
          MAINNET_ADDRESSES.ETH,
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
        const wethBalance = await balanceOf(MAINNET_ADDRESSES.ETH, address)
        const daiBalance = await balanceOf(MAINNET_ADDRESSES.MCD_DAI, address)

        expectToBeEqual(daiBalance, initialDaiWalletBalance.minus(amountWithFeeInWei), 0)
        expectToBe(wethBalance, 'gte', receiveAtLeastInWei)
      })

      it('should not have Asset amount left in the exchange', async () => {
        const exchangeWethBalance = await balanceOf(MAINNET_ADDRESSES.ETH, swap.address)
        expectToBeEqual(exchangeWethBalance, 0)
      })

      it('should not have DAI amount left in the exchange', async () => {
        const exchangeDaiBalance = await balanceOf(MAINNET_ADDRESSES.MCD_DAI, swap.address)
        expectToBeEqual(exchangeDaiBalance, 0)
      })

      it('should have collected fee', async () => {
        const beneficiaryDaiBalance = await balanceOf(MAINNET_ADDRESSES.MCD_DAI, feeBeneficiary)
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
          MAINNET_ADDRESSES.ETH,
          MAINNET_ADDRESSES.MCD_DAI,
          amountToWei(10).toFixed(0),
          amountWithFeeInWei.toFixed(0),
          address,
          provider,
          signer,
        )

        initialDaiWalletBalance = await balanceOf(MAINNET_ADDRESSES.MCD_DAI, address)
        surplusAmount = new BigNumber(10)
        moreThanTheTransferAmount = amountInWei.plus(amountToWei(surplusAmount))
        moreThanTheTransferAmountWithFee = calculateFee(moreThanTheTransferAmount).plus(moreThanTheTransferAmount)

        await DAI.approve(swap.address, moreThanTheTransferAmountWithFee.toFixed(0))

        await swap.swapTokens(
          MAINNET_ADDRESSES.MCD_DAI,
          MAINNET_ADDRESSES.ETH,
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
        const wethBalance = await balanceOf(MAINNET_ADDRESSES.ETH, address)
        const daiBalance = await balanceOf(MAINNET_ADDRESSES.MCD_DAI, address)

        const collectedFee = calculateFee(moreThanTheTransferAmount)

        expectToBeEqual(
          daiBalance,
          initialDaiWalletBalance.minus(amountInWei).minus(collectedFee),
          0,
        )
        expectToBe(wethBalance, 'gte', receiveAtLeastInWei)
      })

      it('should not have Asset amount left in the exchange', async () => {
        const exchangeWethBalance = await balanceOf(MAINNET_ADDRESSES.ETH, swap.address)
        expectToBeEqual(exchangeWethBalance, 0)
      })

      it('should not have DAI amount left in the exchange', async () => {
        const exchangeDaiBalance = await balanceOf(MAINNET_ADDRESSES.MCD_DAI, swap.address)
        expectToBeEqual(exchangeDaiBalance, 0)
      })

      it('should have collected fee', async () => {
        const beneficiaryDaiBalance = await balanceOf(MAINNET_ADDRESSES.MCD_DAI, feeBeneficiary)

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
          MAINNET_ADDRESSES.ETH,
          MAINNET_ADDRESSES.MCD_DAI,
          amountToWei(10).toFixed(0),
          amountWithFeeInWei.toFixed(0),
          address,
          provider,
          signer,
        )

        initialDaiWalletBalance = await balanceOf(MAINNET_ADDRESSES.MCD_DAI, address)
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
          MAINNET_ADDRESSES.MCD_DAI,
          MAINNET_ADDRESSES.ETH,
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
        const wethBalance = await balanceOf(MAINNET_ADDRESSES.ETH, address)
        const daiBalance = await balanceOf(MAINNET_ADDRESSES.MCD_DAI, address)

        expectToBeEqual(daiBalance, initialDaiWalletBalance)
        expectToBeEqual(wethBalance, 0)
      })

      it('should not have Asset amount left in the exchange', async () => {
        const exchangeWethBalance = await balanceOf(MAINNET_ADDRESSES.ETH, swap.address)
        expectToBeEqual(exchangeWethBalance, 0)
      })

      it('should not have DAI amount left in the exchange', async () => {
        const exchangeDaiBalance = await balanceOf(MAINNET_ADDRESSES.MCD_DAI, swap.address)
        expectToBeEqual(exchangeDaiBalance, 0)
      })
    })

    describe('when sending some token amount in advance to the exchange', async () => {
      let localSnapshotId: string

      beforeEach(async () => {
        localSnapshotId = await provider.send('evm_snapshot', [])

        await swapTokens(
          MAINNET_ADDRESSES.ETH,
          MAINNET_ADDRESSES.MCD_DAI,
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
        const transferredAmount = amountToWei(1)
        const initialWethWalletBalance = await balanceOf(MAINNET_ADDRESSES.ETH, address)
        const temporarySnapshot = await provider.send('evm_snapshot', [])

        await swap.swapTokens(
          MAINNET_ADDRESSES.MCD_DAI,
          MAINNET_ADDRESSES.ETH,
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

        const currentWethBalance = await balanceOf(MAINNET_ADDRESSES.ETH, address)

        await provider.send('evm_revert', [temporarySnapshot])

        await WETH.connect(otherWallet).deposit({
          value: amountToWei(1).toFixed(0),
        })

        await WETH.connect(otherWallet).transfer(swap.address, transferredAmount.toFixed(0))
        const exchangeWethBalance = await balanceOf(MAINNET_ADDRESSES.ETH, swap.address)
        expectToBeEqual(exchangeWethBalance, transferredAmount)

        await swap.swapTokens(
          MAINNET_ADDRESSES.MCD_DAI,
          MAINNET_ADDRESSES.ETH,
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

        const wethBalance = await balanceOf(MAINNET_ADDRESSES.ETH, address)
        const expectedWethBalance = initialWethWalletBalance
          .plus(currentWethBalance)
          .plus(transferredAmount)
        expectToBeEqual(wethBalance, expectedWethBalance)
      })

      it('should transfer everything to the caller if there is a surplus of DAI ', async () => {
        const otherWallet = provider.getSigner(1)
        const otherWalletAddress = await otherWallet.getAddress()
        const amount = amountToWei(one)

        await swapTokens(
          MAINNET_ADDRESSES.ETH,
          MAINNET_ADDRESSES.MCD_DAI,
          amount.toFixed(0), // swapping 1 ETH
          amount.toFixed(0), // expecting at least 1 DAI
          otherWalletAddress,
          provider,
          otherWallet,
        )

        const walletDaiBalance = await balanceOf(MAINNET_ADDRESSES.MCD_DAI, address)
        const otherWalletDaiBalance = await balanceOf(MAINNET_ADDRESSES.MCD_DAI, otherWalletAddress)
        expectToBe(amountFromWei(otherWalletDaiBalance), 'gte', 1)

        await DAI.connect(otherWallet).transfer(swap.address, amount.toFixed(0))
        const exchangeDaiBalance = await balanceOf(MAINNET_ADDRESSES.MCD_DAI, swap.address)
        expectToBeEqual(exchangeDaiBalance, amount, 0)

        await swap.swapTokens(
          MAINNET_ADDRESSES.MCD_DAI,
          MAINNET_ADDRESSES.ETH,
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

        const currentDaiBalance = await balanceOf(MAINNET_ADDRESSES.MCD_DAI, address)
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
      const wethBalance = await balanceOf(MAINNET_ADDRESSES.ETH, address)
      expectToBeEqual(wethBalance, balance)
      await provider.send('evm_revert', [localSnapshotId])
    })

    it('should not have allowance set', async () => {
      const amountInWei = amountToWei(10)
      const receiveAtLeastInWeiAny = amountToWei(1)
      const data = 0

      const tx = swap.swapTokens(
        MAINNET_ADDRESSES.ETH,
        MAINNET_ADDRESSES.MCD_DAI,
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
        MAINNET_ADDRESSES.ETH,
        MAINNET_ADDRESSES.MCD_DAI,
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
        MAINNET_ADDRESSES.ETH,
        MAINNET_ADDRESSES.MCD_DAI,
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
        MAINNET_ADDRESSES.ETH,
        amountInWei.toFixed(0),
        swap.address,
        slippage.value.toFixed(),
        ALLOWED_PROTOCOLS,
      )

      const tx = swap.swapTokens(
        MAINNET_ADDRESSES.ETH,
        MAINNET_ADDRESSES.MCD_DAI,
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
      amountWithFeeInWei = amountInWei.div(one.minus(fee.asDecimal))

      await swapTokens(
        MAINNET_ADDRESSES.ETH,
        MAINNET_ADDRESSES.MCD_DAI,
        amountToWei(10).toFixed(0),
        amountWithFeeInWei.toFixed(0),
        address,
        provider,
        signer,
      )

      daiBalance = await balanceOf(MAINNET_ADDRESSES.MCD_DAI, address)
    })

    afterEach(async () => {
      const currentDaiBalance = await balanceOf(MAINNET_ADDRESSES.MCD_DAI, address)
      expectToBeEqual(currentDaiBalance, daiBalance)
      await provider.send('evm_revert', [localSnapshotId])
    })

    it('should not have allowance set', async () => {
      const receiveAtLeastInWeiAny = amountToWei(1)
      const data = 0

      const tx = swap.swapTokens(
        MAINNET_ADDRESSES.MCD_DAI,
        MAINNET_ADDRESSES.ETH,
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
        MAINNET_ADDRESSES.MCD_DAI,
        MAINNET_ADDRESSES.ETH,
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
        MAINNET_ADDRESSES.MCD_DAI,
        MAINNET_ADDRESSES.ETH,
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
        MAINNET_ADDRESSES.ETH,
        amountInWei.toFixed(0),
        slippage.value.toFixed(),
        swap.address,
        ALLOWED_PROTOCOLS,
      )

      const tx = swap.swapTokens(
        MAINNET_ADDRESSES.MCD_DAI,
        MAINNET_ADDRESSES.ETH,
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
        MAINNET_ADDRESSES.ETH,
        MAINNET_ADDRESSES.USDT,
        amountToWei(1).toFixed(0),
        amountToWei(100, 6).toFixed(0),
        address,
        provider,
        signer,
      )

      initialUSDTBalanceInWei = await balanceOf(MAINNET_ADDRESSES.USDT, address)
      feeInUSDT = initialUSDTBalanceInWei.times(FEE).div(new BigNumber(FEE_BASE).plus(FEE)).integerValue(BigNumber.ROUND_DOWN)

      const USDT = new ethers.Contract(MAINNET_ADDRESSES.USDT, ERC20ABI, provider).connect(signer)
      await USDT.approve(swap.address, initialUSDTBalanceInWei.toFixed(0))

      const response = await exchangeToDAI(
        MAINNET_ADDRESSES.USDT,
        initialUSDTBalanceInWei.minus(feeInUSDT).toFixed(0),
        swap.address,
        slippage.value.toFixed(),
        ['UNISWAP_V2'],
      )

      to = response.tx.to
      data = response.tx.data

      const receiveAtLeast = amountFromWei(response.toTokenAmount).times(
        one.minus(slippage.asDecimal),
      )
      receiveAtLeastInWei = amountToWei(receiveAtLeast)
    })

    after(async () => {
      await provider.send('evm_revert', [localSnapshotId])
    })

    it(`should exchange to at least amount specified in receiveAtLeast`, async () => {
      await swap.swapTokens(
        MAINNET_ADDRESSES.USDT,
        MAINNET_ADDRESSES.MCD_DAI,
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

      const currentUSDTBalance = await balanceOf(MAINNET_ADDRESSES.USDT, address)
      const currentDaiBalance = await balanceOf(MAINNET_ADDRESSES.MCD_DAI, address)

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
        MAINNET_ADDRESSES.ETH,
        MAINNET_ADDRESSES.MCD_DAI,
        amountToWei(10).toFixed(0),
        amountWithFeeInWei.toFixed(0),
        address,
        provider,
        signer,
      )

      daiBalanceInWei = await balanceOf(MAINNET_ADDRESSES.MCD_DAI, address)

      const response = await exchangeFromDAI(
        MAINNET_ADDRESSES.USDT,
        amountInWei.toFixed(0),
        slippage.value.toFixed(),
        swap.address,
        ['UNISWAP_V2'],
      )

      to = response.tx.to
      data = response.tx.data

      const receiveAtLeast = amountFromWei(response.toTokenAmount, 6).times(
        one.minus(slippage.asDecimal),
      )
      receiveAtLeastInWei = amountToWei(receiveAtLeast, 6)
    })

    after(async () => {
      await provider.send('evm_revert', [localSnapshotId])
    })

    it(`should exchange to at least amount specified in receiveAtLeast`, async () => {
      await DAI.approve(swap.address, amountWithFeeInWei.toFixed(0))
      await swap.swapTokens(
        MAINNET_ADDRESSES.MCD_DAI,
        MAINNET_ADDRESSES.USDT,
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

      const currentUSDTBalance = amountFromWei(await balanceOf(MAINNET_ADDRESSES.USDT, address), 6)
      const currentDaiBalance = await balanceOf(MAINNET_ADDRESSES.MCD_DAI, address)

      expectToBeEqual(currentDaiBalance, daiBalanceInWei.minus(amountWithFeeInWei), 0)
      expectToBe(currentUSDTBalance, 'gte', amountFromWei(receiveAtLeastInWei, 6))
    })
  })

  describe('between two erc20 tokens, (no DAI in the pair)', () => {
    let fromToken = MAINNET_ADDRESSES.ETH
    let toToken = MAINNET_ADDRESSES.WBTC
    let amountInWei = amountToWei(10)
    let amountWithFeeInWei: BigNumber
    let receiveAtLeastInWei: BigNumber
    let to: string
    let data: string
    let localSnapshotId: string
    let wethBalanceBefore: BigNumber

    before(async () => {
      localSnapshotId = await provider.send('evm_snapshot', [])
      amountWithFeeInWei = calculateFee(amountInWei).plus(amountInWei)

      const response = await exchangeAnyTokens(
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
        one.minus(slippage.asDecimal),
      )
      receiveAtLeastInWei = amountToWei(receiveAtLeast, 8)
      await WETH.deposit({
        value: amountToWei(1000).toFixed(0),
      })
      wethBalanceBefore = await balanceOf(WETH.address, address)
      await WETH.approve(swap.address, amountWithFeeInWei.toFixed(0))

      await swap.swapTokens(
        MAINNET_ADDRESSES.ETH,
        MAINNET_ADDRESSES.WBTC,
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
      const currentToTokenBalance = await balanceOf(toToken, address)
      expectToBe(currentToTokenBalance, 'gte', receiveAtLeastInWei)
    })

    it('should exchange exact amount of fromToken + fee', async () => {
      const currentFromTokenBalance = await balanceOf(fromToken, address)
      expectToBeEqual(wethBalanceBefore.minus(amountWithFeeInWei), currentFromTokenBalance.toFixed(0))
    })

    it('should collect fee in fromToken', async () => {
      const feeWalletBalance = await balanceOf(fromToken, feeBeneficiary)

      expectToBeEqual(feeWalletBalance, calculateFee(amountInWei))
    })

    it('should not leave any fromToken in Swap contract', async () => {
      const swapBalance = await balanceOf(fromToken, swap.address)

      expectToBeEqual(swapBalance, 0)
    })

    it('should not leave any toToken in Swap contract', async () => {
      const swapBalance = await balanceOf(toToken, swap.address)

      expectToBeEqual(swapBalance, 0)
    })
  })
})
