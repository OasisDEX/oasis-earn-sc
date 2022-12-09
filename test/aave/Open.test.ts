import { JsonRpcProvider } from '@ethersproject/providers'
import {
  ADDRESSES,
  IPosition,
  IPositionTransition,
  Position,
  strategies,
} from '@oasisdex/oasis-actions'
import aavePriceOracleABI from '@oasisdex/oasis-actions/lib/src/abi/aavePriceOracle.json'
import { amountFromWei } from '@oasisdex/oasis-actions/lib/src/helpers'
import { PositionType } from '@oasisdex/oasis-actions/lib/src/strategies/types/PositionType'
import { ONE, ZERO } from '@oasisdex/oasis-actions/src'
import { AAVETokens } from '@oasisdex/oasis-actions/src/operations/aave/tokens'
import { Address } from '@oasisdex/oasis-actions/src/strategies/types/IPositionRepository'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { loadFixture } from 'ethereum-waffle'
import { Contract, ContractReceipt, ethers, Signer } from 'ethers'

import AAVEDataProviderABI from '../../abi/aaveDataProvider.json'
import AAVELendigPoolABI from '../../abi/aaveLendingPool.json'
import ERC20ABI from '../../abi/IERC20.json'
import { AAVEAccountData, AAVEReserveData } from '../../helpers/aave'
import { executeThroughProxy } from '../../helpers/deploy'
import { GasEstimateHelper, gasEstimateHelper } from '../../helpers/gasEstimation'
import { resetNodeToLatestBlock } from '../../helpers/init'
import { restoreSnapshot } from '../../helpers/restoreSnapshot'
import { getOneInchCall } from '../../helpers/swap/OneInchCall'
import { oneInchCallMock } from '../../helpers/swap/OneInchCallMock'
import { swapUniswapTokens } from '../../helpers/swap/uniswap'
import { RuntimeConfig } from '../../helpers/types/common'
import { amountToWei, balanceOf } from '../../helpers/utils'
import { mainnetAddresses } from '../addresses'
import { testBlockNumber } from '../config'
import { tokens } from '../constants'
import { DeployedSystemInfo, deploySystem } from '../deploySystem'
import { initialiseConfig } from '../fixtures/setup'
import { expectToBe, expectToBeEqual } from '../utils'

describe(`Strategy | AAVE | Open Position`, async function () {
  let aaveLendingPool: Contract
  let aaveDataProvider: Contract
  let provider: JsonRpcProvider
  let config: RuntimeConfig
  let signer: Signer
  let userAddress: Address

  before(async function () {
    ;({ config, provider, signer, address: userAddress } = await loadFixture(initialiseConfig))

    aaveLendingPool = new Contract(
      ADDRESSES.main.aave.MainnetLendingPool,
      AAVELendigPoolABI,
      provider,
    )
    aaveDataProvider = new Contract(ADDRESSES.main.aave.DataProvider, AAVEDataProviderABI, provider)
  })

  describe('On forked chain', function () {
    const multiple = new BigNumber(2)
    const slippage = new BigNumber(0.1)

    let positionTransition: IPositionTransition
    let txStatus: boolean
    let gasEstimates: GasEstimateHelper

    async function setupOpenPositionTest(
      collateralToken: {
        depositAmountInBaseUnit: BigNumber
        symbol: AAVETokens
        address: string
        precision: number
        isEth: boolean
      },
      debtToken: {
        depositAmountInBaseUnit: BigNumber
        symbol: AAVETokens
        address: string
        precision: number
        isEth: boolean
      },
      positionType: PositionType,
      mockMarketPrice: BigNumber | undefined,
      isFeeFromDebtToken: boolean,
      userAddress: Address,
      isDPMProxy: boolean,
    ) {
      const { snapshot } = await restoreSnapshot({
        config,
        provider,
        blockNumber: testBlockNumber,
        useFallbackSwap: true,
      })
      const system = snapshot.deployed.system

      /**
       * Need to have correct tokens in hand before
       * to marry up with what user is depositing
       */
      const swapETHtoDepositTokens = amountToWei(new BigNumber(100))
      !debtToken.isEth &&
        debtToken.depositAmountInBaseUnit.gt(ZERO) &&
        (await swapUniswapTokens(
          ADDRESSES.main.WETH,
          debtToken.address,
          swapETHtoDepositTokens.toFixed(0),
          ONE.toFixed(0),
          config.address,
          config,
        ))

      !collateralToken.isEth &&
        collateralToken.depositAmountInBaseUnit.gt(ZERO) &&
        (await swapUniswapTokens(
          ADDRESSES.main.WETH,
          collateralToken.address,
          swapETHtoDepositTokens.toFixed(0),
          ONE.toFixed(0),
          config.address,
          config,
        ))

      if (!collateralToken.isEth) {
        const COLL_TOKEN = new ethers.Contract(collateralToken.address, ERC20ABI, provider).connect(
          signer,
        )
        await COLL_TOKEN.connect(signer).approve(
          system.common.userProxyAddress,
          collateralToken.depositAmountInBaseUnit.toFixed(0),
        )
      }
      if (!debtToken.isEth) {
        const DEBT_TOKEN = new ethers.Contract(debtToken.address, ERC20ABI, provider).connect(
          signer,
        )
        await DEBT_TOKEN.connect(signer).approve(
          system.common.userProxyAddress,
          debtToken.depositAmountInBaseUnit.toFixed(0),
        )
      }

      const addresses = {
        ...mainnetAddresses,
        operationExecutor: system.common.operationExecutor.address,
      }

      const proxy = system.common.dsProxy.address
      const positionTransition = await strategies.aave.open(
        {
          depositedByUser: {
            debtToken: { amountInBaseUnit: debtToken.depositAmountInBaseUnit },
            collateralToken: { amountInBaseUnit: collateralToken.depositAmountInBaseUnit },
          },
          // TODO: Integrate properly with DPM and execute t/x through that
          positionArgs: {
            positionId: 123,
            positionType: positionType,
            protocol: 'AAVE' as const,
          },
          slippage,
          multiple,
          debtToken: { symbol: debtToken.symbol, precision: debtToken.precision },
          collateralToken: { symbol: collateralToken.symbol, precision: collateralToken.precision },
          collectSwapFeeFrom: isFeeFromDebtToken ? 'sourceToken' : 'targetToken',
        },
        {
          addresses,
          provider,
          getSwapData: oneInchCallMock(mockMarketPrice, {
            from: debtToken.precision,
            to: collateralToken.precision,
          }),
          proxy,
          user: userAddress,
          isDPMProxy,
        },
      )

      const feeRecipientBalanceBefore = await balanceOf(
        isFeeFromDebtToken ? debtToken.address : collateralToken.address,
        ADDRESSES.main.feeRecipient,
        { config },
      )

      const ethDepositAmt = (debtToken.isEth ? debtToken.depositAmountInBaseUnit : ZERO).plus(
        collateralToken.isEth ? collateralToken.depositAmountInBaseUnit : ZERO,
      )

      const [txStatus, tx] = await executeThroughProxy(
        system.common.dsProxy.address,
        {
          address: system.common.operationExecutor.address,
          calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
            positionTransition.transaction.calls,
            positionTransition.transaction.operationName,
          ]),
        },
        signer,
        ethDepositAmt.toFixed(0),
      )

      const userCollateralReserveData = await aaveDataProvider.getUserReserveData(
        collateralToken.address,
        system.common.dsProxy.address,
      )

      const userDebtReserveData = await aaveDataProvider.getUserReserveData(
        debtToken.address,
        system.common.dsProxy.address,
      )

      const aavePriceOracle = new ethers.Contract(
        addresses.aavePriceOracle,
        aavePriceOracleABI,
        provider,
      )

      const aaveCollateralTokenPriceInEth = collateralToken.isEth
        ? ONE
        : await aavePriceOracle
            .getAssetPrice(collateralToken.address)
            .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString())))

      const aaveDebtTokenPriceInEth = debtToken.isEth
        ? ONE
        : await aavePriceOracle
            .getAssetPrice(debtToken.address)
            .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString())))

      const oracle = aaveCollateralTokenPriceInEth.div(aaveDebtTokenPriceInEth)

      const actualPosition = new Position(
        {
          amount: new BigNumber(userDebtReserveData.currentVariableDebt.toString()),
          precision: debtToken.precision,
          symbol: debtToken.symbol,
        },
        {
          amount: new BigNumber(userCollateralReserveData.currentATokenBalance.toString()),
          precision: collateralToken.precision,
          symbol: collateralToken.symbol,
        },
        oracle,
        positionTransition.simulation.position.category,
      )

      return {
        system,
        positionTransition,
        feeRecipientBalanceBefore,
        txStatus,
        tx,
        oracle,
        actualPosition,
        userCollateralReserveData,
        userDebtReserveData,
      }
    }

    describe(`With ${tokens.STETH} collateral & ${tokens.ETH} debt`, function () {
      const depositEthAmount = amountToWei(new BigNumber(1))
      gasEstimates = gasEstimateHelper()
      let userStEthReserveData: AAVEReserveData
      let userWethReserveData: AAVEReserveData
      let feeRecipientWethBalanceBefore: BigNumber
      let actualPosition: IPosition
      let tx: ContractReceipt

      before(async function () {
        const setup = await setupOpenPositionTest(
          {
            depositAmountInBaseUnit: ZERO,
            symbol: tokens.STETH,
            address: ADDRESSES.main.stETH,
            precision: 18,
            isEth: false,
          },
          {
            depositAmountInBaseUnit: depositEthAmount,
            symbol: tokens.ETH,
            address: ADDRESSES.main.WETH,
            precision: 18,
            isEth: true,
          },
          'Earn',
          new BigNumber(0.9759),
          true,
          userAddress,
          false,
        )
        txStatus = setup.txStatus
        tx = setup.tx
        positionTransition = setup.positionTransition
        actualPosition = setup.actualPosition
        userStEthReserveData = setup.userCollateralReserveData
        userWethReserveData = setup.userDebtReserveData
        feeRecipientWethBalanceBefore = setup.feeRecipientBalanceBefore

        gasEstimates.save(tx)
      })

      it('Tx should pass', function () {
        expect(txStatus).to.be.true
      })

      it('Should draw debt according to multiple', function () {
        expectToBeEqual(
          positionTransition.simulation.position.debt.amount.toFixed(0),
          new BigNumber(userWethReserveData.currentVariableDebt.toString()).toFixed(0),
        )
      })

      it(`Should deposit all ${tokens.STETH} tokens to aave`, function () {
        expectToBe(
          new BigNumber(userStEthReserveData.currentATokenBalance.toString()).toFixed(0),
          'gte',
          positionTransition.simulation.position.collateral.amount,
        )
      })

      it('Should achieve target multiple', function () {
        expectToBe(
          positionTransition.simulation.position.riskRatio.multiple,
          'gte',
          actualPosition.riskRatio.multiple,
        )
      })

      it('Should collect fee', async function () {
        const feeRecipientWethBalanceAfter = await balanceOf(
          ADDRESSES.main.WETH,
          ADDRESSES.main.feeRecipient,
          { config },
        )

        expectToBeEqual(
          new BigNumber(positionTransition.simulation.swap.tokenFee),
          feeRecipientWethBalanceAfter.minus(feeRecipientWethBalanceBefore),
        )
      })

      after(() => {
        gasEstimates.print()
      })
    })

    describe(`With ${tokens.ETH} collateral (+dep) & ${tokens.USDC} debt`, function () {
      const depositEthAmount = new BigNumber(600)

      let userEthReserveData: AAVEReserveData
      let userUSDCReserveData: AAVEReserveData
      let feeRecipientUSDCBalanceBefore: BigNumber
      let actualPosition: IPosition

      before(async function () {
        const setup = await setupOpenPositionTest(
          {
            depositAmountInBaseUnit: amountToWei(depositEthAmount),
            symbol: tokens.ETH,
            address: ADDRESSES.main.WETH,
            precision: 18,
            isEth: true,
          },
          {
            depositAmountInBaseUnit: ZERO,
            symbol: tokens.USDC,
            address: ADDRESSES.main.USDC,
            precision: 6,
            isEth: false,
          },
          'Multiply',
          new BigNumber(1300),
          true,
          userAddress,
          false,
        )
        txStatus = setup.txStatus
        positionTransition = setup.positionTransition
        actualPosition = setup.actualPosition
        userEthReserveData = setup.userCollateralReserveData
        userUSDCReserveData = setup.userDebtReserveData
        feeRecipientUSDCBalanceBefore = setup.feeRecipientBalanceBefore
      })

      it('Tx should pass', function () {
        expect(txStatus).to.be.true
      })

      it('Should draw debt according to multiple', function () {
        expect(
          new BigNumber(positionTransition.simulation.position.debt.amount.toString()).toString(),
        ).to.be.oneOf([
          new BigNumber(userUSDCReserveData.currentVariableDebt.toString()).toFixed(0),
          new BigNumber(userUSDCReserveData.currentVariableDebt.toString()).minus(ONE).toFixed(0),
        ])
      })

      it(`Should deposit all ${tokens.ETH} tokens to aave`, function () {
        expectToBe(
          new BigNumber(userEthReserveData.currentATokenBalance.toString()).toFixed(0),
          'gte',
          positionTransition.simulation.position.collateral.amount,
        )
      })

      it('Should achieve target multiple', function () {
        expectToBe(
          positionTransition.simulation.position.riskRatio.multiple,
          'gte',
          actualPosition.riskRatio.multiple,
        )
      })

      it('Should collect fee', async function () {
        const feeRecipientUSDCBalanceAfter = await balanceOf(
          ADDRESSES.main.USDC,
          ADDRESSES.main.feeRecipient,
          { config },
        )

        expectToBeEqual(
          new BigNumber(positionTransition.simulation.swap.tokenFee),
          feeRecipientUSDCBalanceAfter.minus(feeRecipientUSDCBalanceBefore),
        )
      })
    })

    describe(`With ${tokens.WBTC} collateral & ${tokens.USDC} debt`, function () {
      const depositWBTCAmount = new BigNumber(6)

      let userWBTCReserveData: AAVEReserveData
      let feeRecipientUSDCBalanceBefore: BigNumber
      let actualPosition: IPosition

      before(async function () {
        const setup = await setupOpenPositionTest(
          {
            depositAmountInBaseUnit: amountToWei(depositWBTCAmount, 8),
            symbol: tokens.WBTC,
            address: ADDRESSES.main.WBTC,
            precision: 8,
            isEth: false,
          },
          {
            depositAmountInBaseUnit: ZERO,
            symbol: tokens.USDC,
            address: ADDRESSES.main.USDC,
            precision: 6,
            isEth: false,
          },
          'Multiply',
          new BigNumber(20032),
          true,
          userAddress,
          false,
        )
        txStatus = setup.txStatus
        positionTransition = setup.positionTransition
        actualPosition = setup.actualPosition
        userWBTCReserveData = setup.userCollateralReserveData
        feeRecipientUSDCBalanceBefore = setup.feeRecipientBalanceBefore
      })

      it('Tx should pass', function () {
        expect(txStatus).to.be.true
      })

      it('Should draw debt according to multiple', function () {
        expect(new BigNumber(actualPosition.debt.amount.toString()).toString()).to.be.oneOf([
          positionTransition.simulation.position.debt.amount.toFixed(0),
          positionTransition.simulation.position.debt.amount.minus(ONE).toFixed(0),
        ])
      })

      it(`Should deposit all ${tokens.WBTC} tokens to aave`, function () {
        expectToBe(
          new BigNumber(userWBTCReserveData.currentATokenBalance.toString()).toFixed(0),
          'gte',
          positionTransition.simulation.position.collateral.amount,
        )
      })

      it('Should achieve target multiple', function () {
        expectToBe(
          positionTransition.simulation.position.riskRatio.multiple,
          'gte',
          actualPosition.riskRatio.multiple,
        )
      })

      it('Should collect fee', async function () {
        const feeRecipientUSDCBalanceAfter = await balanceOf(
          ADDRESSES.main.USDC,
          ADDRESSES.main.feeRecipient,
          { config },
        )

        expectToBeEqual(
          new BigNumber(positionTransition.simulation.swap.tokenFee),
          feeRecipientUSDCBalanceAfter.minus(feeRecipientUSDCBalanceBefore),
        )
      })
    })

    describe(`With ${tokens.WBTC} collateral (take fee from coll) & ${tokens.USDC} debt`, function () {
      const depositWBTCAmount = new BigNumber(6)

      let userWBTCReserveData: AAVEReserveData
      let feeRecipientWBTCBalanceBefore: BigNumber
      let actualPosition: IPosition

      before(async function () {
        const setup = await setupOpenPositionTest(
          {
            depositAmountInBaseUnit: amountToWei(depositWBTCAmount, 8),
            symbol: tokens.WBTC,
            address: ADDRESSES.main.WBTC,
            precision: 8,
            isEth: false,
          },
          {
            depositAmountInBaseUnit: ZERO,
            symbol: tokens.USDC,
            address: ADDRESSES.main.USDC,
            precision: 6,
            isEth: false,
          },
          'Multiply',
          new BigNumber(20032),
          false,
          userAddress,
          false,
        )
        txStatus = setup.txStatus
        positionTransition = setup.positionTransition
        actualPosition = setup.actualPosition
        userWBTCReserveData = setup.userCollateralReserveData
        feeRecipientWBTCBalanceBefore = setup.feeRecipientBalanceBefore
      })

      it('Tx should pass', function () {
        expect(txStatus).to.be.true
      })

      it('Should draw debt according to multiple', function () {
        expect(new BigNumber(actualPosition.debt.amount.toString()).toString()).to.be.oneOf([
          positionTransition.simulation.position.debt.amount.toFixed(0),
          positionTransition.simulation.position.debt.amount.minus(ONE).toFixed(0),
        ])
      })

      it(`Should deposit all ${tokens.WBTC} tokens to aave`, function () {
        expectToBe(
          new BigNumber(userWBTCReserveData.currentATokenBalance.toString()).toFixed(0),
          'gte',
          positionTransition.simulation.position.collateral.amount,
        )
      })

      it('Should achieve target multiple', function () {
        expectToBe(
          positionTransition.simulation.position.riskRatio.multiple,
          'gte',
          actualPosition.riskRatio.multiple,
        )
      })

      it('Should collect fee', async function () {
        const feeRecipientWBTCBalanceAfter = await balanceOf(
          ADDRESSES.main.WBTC,
          ADDRESSES.main.feeRecipient,
          { config },
        )

        // Test for equivalence within slippage adjusted range when taking fee from target token
        expectToBe(
          new BigNumber(
            positionTransition.simulation.swap.tokenFee.div(ONE.minus(slippage)).toString(),
          ).toFixed(0),
          'gte',
          feeRecipientWBTCBalanceAfter.minus(feeRecipientWBTCBalanceBefore),
        )

        expectToBe(
          positionTransition.simulation.swap.tokenFee,
          'lte',
          feeRecipientWBTCBalanceAfter.minus(feeRecipientWBTCBalanceBefore),
        )
      })
    })
  })

  describe('On latest block using one inch exchange and api', function () {
    const depositEthAmount = amountToWei(new BigNumber(1))
    const multiple = new BigNumber(2)
    const slippage = new BigNumber(0.1)

    let system: DeployedSystemInfo

    let positionTransition: IPositionTransition
    let txStatus: boolean

    let userAccountData: AAVEAccountData
    let userStEthReserveData: AAVEReserveData

    let feeRecipientWethBalanceBefore: BigNumber

    before(async function () {
      const shouldRun1InchTests = process.env.RUN_1INCH_TESTS === '1'
      if (shouldRun1InchTests) {
        //Reset to the latest block
        await resetNodeToLatestBlock(provider)
        const { system: _system } = await deploySystem(config, false, false)
        system = _system

        const addresses = {
          ...mainnetAddresses,
          operationExecutor: system.common.operationExecutor.address,
        }

        feeRecipientWethBalanceBefore = await balanceOf(
          ADDRESSES.main.WETH,
          ADDRESSES.main.feeRecipient,
          { config },
        )

        const proxy = system.common.dsProxy.address
        const debtToken = { symbol: 'ETH' as const }
        const collateralToken = { symbol: 'STETH' as const }

        positionTransition = await strategies.aave.open(
          {
            depositedByUser: { debtToken: { amountInBaseUnit: depositEthAmount } },
            slippage,
            positionArgs: {
              positionId: 123,
              positionType: 'Earn',
              protocol: 'AAVE',
            },
            multiple,
            debtToken,
            collateralToken,
          },
          {
            addresses,
            provider,
            getSwapData: getOneInchCall(system.common.swap.address),
            proxy,
            user: config.address,
            isDPMProxy: false,
          },
        )

        const [_txStatus] = await executeThroughProxy(
          system.common.dsProxy.address,
          {
            address: system.common.operationExecutor.address,
            calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
              positionTransition.transaction.calls,
              positionTransition.transaction.operationName,
            ]),
          },
          signer,
          depositEthAmount.toFixed(0),
        )
        txStatus = _txStatus

        userAccountData = await aaveLendingPool.getUserAccountData(system.common.dsProxy.address)
        userStEthReserveData = await aaveDataProvider.getUserReserveData(
          ADDRESSES.main.stETH,
          system.common.dsProxy.address,
        )
      } else {
        this.skip()
      }
    })

    it('Tx should pass', function () {
      expect(txStatus).to.be.true
    })

    it('Should draw debt according to multiple', function () {
      expectToBeEqual(
        positionTransition.simulation.position.debt.amount.toFixed(0),
        new BigNumber(userAccountData.totalDebtETH.toString()),
      )
    })

    it('Should deposit all stEth tokens to aave', function () {
      expectToBe(
        new BigNumber(userStEthReserveData.currentATokenBalance.toString()).toFixed(0),
        'gte',
        positionTransition.simulation.position.collateral.amount,
      )
    })

    it('Should collect fee', async function () {
      const feeRecipientWethBalanceAfter = await balanceOf(
        ADDRESSES.main.WETH,
        ADDRESSES.main.feeRecipient,
        { config },
      )

      // Test for equivalence within slippage adjusted range when taking fee from target token
      const actualFees = feeRecipientWethBalanceAfter.minus(feeRecipientWethBalanceBefore)
      expectToBe(
        new BigNumber(
          positionTransition.simulation.swap.tokenFee.div(ONE.minus(slippage)).toString(),
        ).toFixed(0),
        'gte',
        actualFees,
      )

      expectToBe(positionTransition.simulation.swap.tokenFee, 'lte', actualFees)
    })
  })
})
