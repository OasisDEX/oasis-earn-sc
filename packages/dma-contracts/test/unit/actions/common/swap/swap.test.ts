import { ADDRESSES } from '@deploy-configurations/addresses'
import { DeployedSystem } from '@deploy-configurations/types/deployed-system'
import { Network } from '@deploy-configurations/types/network'
import { ONE } from '@dma-common/constants'
import { asPercentageValue, expect, swapOneInchTokens } from '@dma-common/test-utils'
import { FakeRequestEnv, RuntimeConfig } from '@dma-common/types/common'
import { balanceOf } from '@dma-common/utils/balances'
import { amountToWei } from '@dma-common/utils/common'
import { calculateFeeOnInputAmount } from '@dma-common/utils/swap'
import { testBlockNumber } from '@dma-contracts/test/config'
import { restoreSnapshot, TestHelpers } from '@dma-contracts/utils'
import { Contract } from '@ethersproject/contracts'
import { JsonRpcProvider } from '@ethersproject/providers'
import { MockExchange } from '@typechain'
import BigNumber from 'bignumber.js'
import { Signer } from 'ethers'
import hre, { ethers } from 'hardhat'

const ALLOWED_PROTOCOLS = ['UNISWAP_V2', 'UNISWAP_V3']

describe('Swap | Unit', async () => {
  let provider: JsonRpcProvider
  let signer: Signer
  let WETH: Contract
  let DAI: Contract
  let feeBeneficiaryAddress: string
  let feeBeneficiarySigner: Signer
  let authorizedAddress: string
  let authorizedSigner: Signer
  let slippage: ReturnType<typeof asPercentageValue>
  let config: RuntimeConfig
  let system: DeployedSystem
  let helpers: TestHelpers
  let fakeRequestEnv: FakeRequestEnv

  before(async () => {
    authorizedAddress = ADDRESSES[Network.TEST].common.AuthorizedCaller
    feeBeneficiaryAddress = ADDRESSES[Network.TEST].common.FeeRecipient
    slippage = asPercentageValue(8, 100)
  })

  beforeEach(async () => {
    const { snapshot } = await restoreSnapshot({
      hre,
      blockNumber: testBlockNumber,
    })

    provider = snapshot.config.provider
    signer = snapshot.config.signer
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

    // Transfer funds to beneficiary and authorized caller
    const toTransferAmount = ethers.utils.parseEther('100')

    const sendToBeneficiaryTx = await signer.populateTransaction({
      to: feeBeneficiaryAddress,
      value: toTransferAmount,
    })
    await signer.sendTransaction(sendToBeneficiaryTx)

    const sendToAuthorizedTx = await signer.populateTransaction({
      to: authorizedAddress,
      value: toTransferAmount,
    })
    await signer.sendTransaction(sendToAuthorizedTx)

    // Impersonate authorized caller and beneficiary
    await provider.send('hardhat_impersonateAccount', [feeBeneficiaryAddress])
    feeBeneficiarySigner = provider.getSigner(feeBeneficiaryAddress)

    await provider.send('hardhat_impersonateAccount', [authorizedAddress])
    authorizedSigner = provider.getSigner(authorizedAddress)
  })

  afterEach(async () => {
    await restoreSnapshot({ hre, blockNumber: testBlockNumber })
  })

  describe('Fee tiers', async () => {
    it('should have fee beneficiary address set', async () => {
      const exchangeFeeBeneficiary = await system.Swap.contract.feeBeneficiaryAddress()
      expect.toBeEqual(exchangeFeeBeneficiary, feeBeneficiaryAddress)
    })

    it('should have a whitelisted caller set', async () => {
      expect(await system.Swap.contract.authorizedAddresses(authorizedAddress)).to.be.true
    })

    it('should not allow unauthorized caller to add the fee tier', async () => {
      const tx = system.Swap.contract.connect(provider.getSigner(1)).addFeeTier('30')
      await expect(tx).to.be.revertedWith('Unauthorized()')
    })

    it('should allow beneficiary to add the fee tier', async () => {
      await system.Swap.contract.connect(feeBeneficiarySigner).addFeeTier('30')
    })

    it('should support adding multiple fee tiers', async () => {
      await system.Swap.contract.connect(authorizedSigner).addFeeTier(30)
      await system.Swap.contract.connect(authorizedSigner).addFeeTier(40)

      expect(await system.Swap.contract.verifyFee(20)).to.equal(true)
      expect(await system.Swap.contract.verifyFee(30)).to.equal(true)
      expect(await system.Swap.contract.verifyFee(40)).to.equal(true)
    })

    it('should support removing fee tiers', async () => {
      await system.Swap.contract.connect(authorizedSigner).addFeeTier(30)
      await system.Swap.contract.connect(authorizedSigner).removeFeeTier(30)
      const isValid = await system.Swap.contract.verifyFee(30)

      expect(isValid).to.be.equal(false)
    })

    it('should verify is fee exists', async () => {
      const isFeeValid = await system.Swap.contract.verifyFee(2)
      expect(isFeeValid).to.equal(false)
    })

    it('should throw on adding feeTier that already exists', async () => {
      const tx = system.Swap.contract.connect(authorizedSigner).addFeeTier(20)
      await expect(tx).to.be.revertedWith('FeeTierAlreadyExists(20)')
    })

    it('should allow to use different tiers', async () => {
      const amountInWei = amountToWei(10)
      const fee = 50
      const feeAmount = calculateFeeOnInputAmount(amountInWei, fee)
      const amountInWeiWithFee = amountInWei.plus(feeAmount)
      await system.Swap.contract.connect(authorizedSigner).addFeeTier(fee)

      const response = await swapOneInchTokens(
        WETH.address,
        DAI.address,
        amountInWei.toFixed(0),
        system.Swap.contract.address,
        slippage.value.toFixed(),
        ALLOWED_PROTOCOLS,
        fakeRequestEnv,
      )

      const feeBeneficiaryBalanceBefore = await balanceOf(WETH.address, feeBeneficiaryAddress, {
        config,
        isFormatted: true,
      })
      const receiveAtLeastInWei = new BigNumber(response.toTokenAmount).times(
        ONE.minus(slippage.asDecimal),
      )
      await WETH.deposit({ value: amountInWeiWithFee.toFixed() })
      await WETH.approve(system.Swap.contract.address, amountInWeiWithFee.toFixed())
      await system.Swap.contract.swapTokens(
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

      const feeBeneficiaryBalanceAfter = await balanceOf(WETH.address, feeBeneficiaryAddress, {
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
      const feeAmount = calculateFeeOnInputAmount(amountInWei, fee)
      const amountInWeiWithFee = amountInWei.plus(feeAmount)

      const response = await swapOneInchTokens(
        WETH.address,
        DAI.address,
        amountInWei.toFixed(0),
        system.Swap.contract.address,
        slippage.value.toFixed(),
        ALLOWED_PROTOCOLS,
        fakeRequestEnv,
      )

      const receiveAtLeastInWei = new BigNumber(response.toTokenAmount).times(
        ONE.minus(slippage.asDecimal),
      )
      await WETH.deposit({ value: amountInWeiWithFee.toFixed() })
      await WETH.approve(system.Swap.contract.address, amountInWeiWithFee.toFixed())
      const tx = system.Swap.contract.swapTokens(
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
})
