import ERC20_ABI from '@abis/external/tokens/IERC20.json'
import WETH_ABI from '@abis/external/tokens/IWETH.json'
import { ADDRESSES } from '@deploy-configurations/addresses'
import { DeployedSystem } from '@deploy-configurations/types/deployed-system'
import { Network } from '@deploy-configurations/types/network'
import { FEE_BASE, ONE } from '@dma-common/constants'
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
  let WETH: Contract
  let DAI: Contract
  let feeBeneficiaryAddress: string
  let slippage: ReturnType<typeof asPercentageValue>
  let fee: ReturnType<typeof asPercentageValue>
  let config: RuntimeConfig

  let system: DeployedSystem

  before(async () => {
    feeBeneficiaryAddress = ADDRESSES[Network.TEST].common.FeeRecipient
    slippage = asPercentageValue(8, 100)
    fee = asPercentageValue(FEE, FEE_BASE)

    WETH = new ethers.Contract(ADDRESSES[Network.TEST].common.WETH, WETH_ABI, provider).connect(
      signer,
    )
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
    })

    describe('when transferring an exact amount to the exchange', async () => {
      beforeEach(async () => {
        const response = await exchangeFromDAI(
          ADDRESSES[Network.MAINNET].common.WETH,
          amountInWei.toFixed(0),
          slippage.value.toFixed(),
          system.Swap.contract.address,
          ALLOWED_PROTOCOLS,
        )

        data = response.tx.data

        const receiveAtLeast = amountFromWei(response.toTokenAmount).times(
          ONE.minus(slippage.asDecimal),
        )
        receiveAtLeastInWei = amountToWei(receiveAtLeast)

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
          feeBeneficiaryAddress,
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

        await DAI.approve(system.Swap.contract.address, amountWithFeeInWei.toFixed(0))

        await system.Swap.contract.swapTokens(
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
            await balanceOf(ADDRESSES[Network.MAINNET].common.WETH, system.Swap.contract.address, {
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
            await balanceOf(ADDRESSES[Network.MAINNET].common.DAI, system.Swap.contract.address, {
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
          feeBeneficiaryAddress,
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

        await DAI.approve(system.Swap.contract.address, moreThanTheTransferAmountWithFee.toFixed(0))

        await system.Swap.contract.swapTokens(
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
            await balanceOf(ADDRESSES[Network.MAINNET].common.WETH, system.Swap.contract.address, {
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
            await balanceOf(ADDRESSES[Network.MAINNET].common.DAI, system.Swap.contract.address, {
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
          feeBeneficiaryAddress,
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

        await DAI.approve(system.Swap.contract.address, amountWithFeeInWei.toFixed(0))
      })

      afterEach(async () => {
        await provider.send('evm_revert', [localSnapshotId])
      })

      it('should throw an error and not exchange anything', async () => {
        const tx = system.Swap.contract.swapTokens(
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
          system.Swap.contract.address,
          { config, isFormatted: true },
        )
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

        await DAI.approve(system.Swap.contract.address, amountWithFeeInWei.toFixed(0))
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

        await system.Swap.contract.swapTokens(
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

        await DAI.connect(otherWallet).transfer(system.Swap.contract.address, amountWei.toFixed(0))
        const exchangeDaiBalanceWei = amountToWei(
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
})
