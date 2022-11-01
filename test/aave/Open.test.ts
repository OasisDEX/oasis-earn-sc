import { JsonRpcProvider } from '@ethersproject/providers'
import {
  ADDRESSES,
  IPosition,
  IPositionMutation,
  OPERATION_NAMES,
  Position,
  strategies,
} from '@oasisdex/oasis-actions'
import aavePriceOracleABI from '@oasisdex/oasis-actions/lib/src/abi/aavePriceOracle.json'
import { amountFromWei } from '@oasisdex/oasis-actions/lib/src/helpers'
import { PositionBalance } from '@oasisdex/oasis-actions/lib/src/helpers/calculations/Position'
import { ONE, ZERO } from '@oasisdex/oasis-actions/src'
import { AAVETokens } from '@oasisdex/oasis-actions/src/operations/aave/tokens'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { loadFixture } from 'ethereum-waffle'
import { Contract, ethers, Signer } from 'ethers'

import AAVEDataProviderABI from '../../abi/aaveDataProvider.json'
import AAVELendigPoolABI from '../../abi/aaveLendingPool.json'
import ERC20ABI from '../../abi/IERC20.json'
import { AAVEAccountData, AAVEReserveData } from '../../helpers/aave'
import { executeThroughProxy } from '../../helpers/deploy'
import { resetNodeToLatestBlock } from '../../helpers/init'
import { restoreSnapshot } from '../../helpers/restoreSnapshot'
import { getOneInchCall } from '../../helpers/swap/OneIchCall'
import { oneInchCallMock } from '../../helpers/swap/OneInchCallMock'
import { RuntimeConfig } from '../../helpers/types/common'
import { amountToWei, balanceOf } from '../../helpers/utils'
import { testBlockNumber } from '../config'
import { DeployedSystemInfo, deploySystem } from '../deploySystem'
import { initialiseConfig } from '../fixtures/setup'
import { expectToBe, expectToBeEqual, MULTIPLE_TESTING_OFFSET } from '../utils'

const tokens = {
  ETH: 'ETH',
  WBTC: 'WBTC',
  STETH: 'STETH',
  USDC: 'USDC',
} as const

describe(`Strategy | AAVE | Open Position`, async () => {
  let aaveLendingPool: Contract
  let aaveDataProvider: Contract
  let provider: JsonRpcProvider
  let config: RuntimeConfig
  let signer: Signer

  const mainnetAddresses = {
    DAI: ADDRESSES.main.DAI,
    ETH: ADDRESSES.main.ETH,
    WETH: ADDRESSES.main.WETH,
    stETH: ADDRESSES.main.stETH,
    wBTC: ADDRESSES.main.WBTC,
    USDC: ADDRESSES.main.USDC,
    chainlinkEthUsdPriceFeed: ADDRESSES.main.chainlinkEthUsdPriceFeed,
    aaveProtocolDataProvider: ADDRESSES.main.aave.DataProvider,
    aavePriceOracle: ADDRESSES.main.aavePriceOracle,
    aaveLendingPool: ADDRESSES.main.aave.MainnetLendingPool,
  }

  before(async () => {
    ;({ config, provider, signer } = await loadFixture(initialiseConfig))

    aaveLendingPool = new Contract(
      ADDRESSES.main.aave.MainnetLendingPool,
      AAVELendigPoolABI,
      provider,
    )
    aaveDataProvider = new Contract(ADDRESSES.main.aave.DataProvider, AAVEDataProviderABI, provider)
  })

  describe('On forked chain', () => {
    const multiple = new BigNumber(2)
    const slippage = new BigNumber(0.1)

    let positionMutation: IPositionMutation
    let txStatus: boolean

    async function setupOpenPositionTest(
      collateralToken: {
        depositAmountInWei: BigNumber
        symbol: AAVETokens
        address: string
        precision: number
        isEth: boolean
      },
      debtToken: {
        depositAmountInWei: BigNumber
        symbol: AAVETokens
        address: string
        precision: number
        isEth: boolean
      },
      mockMarketPrice: BigNumber | undefined,
      isFeeFromDebtToken: boolean,
    ) {
      const { snapshot, config: newConfig } = await restoreSnapshot(
        config,
        provider,
        testBlockNumber,
      )
      config = newConfig
      signer = newConfig.signer
      const system = snapshot.deployed.system

      if (!collateralToken.isEth) {
        const COLL_TOKEN = new ethers.Contract(collateralToken.address, ERC20ABI, provider).connect(
          signer,
        )
        await COLL_TOKEN.connect(signer).approve(
          system.common.userProxyAddress,
          collateralToken.depositAmountInWei.toFixed(0),
        )
      }
      if (!debtToken.isEth) {
        const DEBT_TOKEN = new ethers.Contract(debtToken.address, ERC20ABI, provider).connect(
          signer,
        )
        await DEBT_TOKEN.connect(signer).approve(
          system.common.userProxyAddress,
          debtToken.depositAmountInWei.toFixed(0),
        )
      }

      const addresses = {
        ...mainnetAddresses,
        operationExecutor: system.common.operationExecutor.address,
      }

      const positionMutation = await strategies.aave.open(
        {
          depositedByUser: {
            debtInWei: debtToken.depositAmountInWei,
            collateralInWei: collateralToken.depositAmountInWei,
          },
          slippage,
          multiple,
          debtToken: { symbol: debtToken.symbol, precision: debtToken.precision },
          collateralToken: { symbol: collateralToken.symbol, precision: collateralToken.precision },
        },
        {
          addresses,
          provider,
          getSwapData: oneInchCallMock(mockMarketPrice),
          proxy: system.common.dsProxy.address,
        },
      )

      const feeRecipientBalanceBefore = await balanceOf(
        isFeeFromDebtToken ? debtToken.address : collateralToken.address,
        ADDRESSES.main.feeRecipient,
        { config },
      )

      const ethDepositAmt = (debtToken.isEth ? debtToken.depositAmountInWei : ZERO).plus(
        collateralToken.isEth ? collateralToken.depositAmountInWei : ZERO,
      )

      const [txStatus] = await executeThroughProxy(
        system.common.dsProxy.address,
        {
          address: system.common.operationExecutor.address,
          calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
            positionMutation.transaction.calls,
            OPERATION_NAMES.common.CUSTOM_OPERATION,
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
        new PositionBalance({
          amount: new BigNumber(userDebtReserveData.currentVariableDebt.toString()),
          precision: debtToken.precision,
          symbol: debtToken.symbol,
        }),
        new PositionBalance({
          amount: new BigNumber(userCollateralReserveData.currentATokenBalance.toString()),
          precision: collateralToken.precision,
          symbol: collateralToken.symbol,
        }),
        oracle,
        positionMutation.simulation.position.category,
      )

      return {
        system,
        positionMutation,
        feeRecipientBalanceBefore,
        txStatus,
        oracle,
        actualPosition,
        userCollateralReserveData,
        userDebtReserveData,
      }
    }

    describe(`With ${tokens.STETH} collateral & ${tokens.ETH} debt`, () => {
      const depositEthAmount = amountToWei(new BigNumber(60 / 1e15))

      let userStEthReserveData: AAVEReserveData
      let userWethReserveData: AAVEReserveData
      let feeRecipientWethBalanceBefore: BigNumber
      let actualPosition: IPosition

      before(async () => {
        const setup = await setupOpenPositionTest(
          {
            depositAmountInWei: ZERO,
            symbol: tokens.STETH,
            address: ADDRESSES.main.stETH,
            precision: 18,
            isEth: false,
          },
          {
            depositAmountInWei: depositEthAmount,
            symbol: tokens.ETH,
            address: ADDRESSES.main.WETH,
            precision: 18,
            isEth: true,
          },
          new BigNumber(0.9759),
          true,
        )
        txStatus = setup.txStatus
        positionMutation = setup.positionMutation
        actualPosition = setup.actualPosition
        userStEthReserveData = setup.userCollateralReserveData
        userWethReserveData = setup.userDebtReserveData
        feeRecipientWethBalanceBefore = setup.feeRecipientBalanceBefore
      })

      it('Tx should pass', () => {
        expect(txStatus).to.be.true
      })

      it('Should draw debt according to multiple', () => {
        expectToBeEqual(
          positionMutation.simulation.position.debt.amount.toFixed(0),
          new BigNumber(userWethReserveData.currentVariableDebt.toString()).toFixed(0),
        )
      })

      it(`Should deposit all ${tokens.STETH} tokens to aave`, () => {
        expectToBe(
          positionMutation.simulation.position.collateral.amount,
          'lte',
          new BigNumber(userStEthReserveData.currentATokenBalance.toString()).toFixed(0),
        )
      })

      it('Should achieve target multiple', () => {
        expectToBe(
          positionMutation.simulation.position.riskRatio.multiple.times(
            ONE.minus(MULTIPLE_TESTING_OFFSET),
          ),
          'lte',
          actualPosition.riskRatio.multiple,
        )

        expectToBe(
          positionMutation.simulation.position.riskRatio.multiple,
          'gte',
          actualPosition.riskRatio.multiple,
        )
      })

      it('Should collect fee', async () => {
        const feeRecipientWethBalanceAfter = await balanceOf(
          ADDRESSES.main.WETH,
          ADDRESSES.main.feeRecipient,
          { config },
        )

        expectToBeEqual(
          amountToWei(new BigNumber(positionMutation.simulation.swap.sourceTokenFee), 18).toFixed(
            0,
          ),
          feeRecipientWethBalanceAfter.minus(feeRecipientWethBalanceBefore),
        )
      })

      // it('Should draw debt according to multiple', () => {
      //   expectToBeEqual(
      //     positionMutation.simulation.position.debt.amount.toFixed(0),
      //     new BigNumber(userAccountData.totalDebtETH.toString()),
      //   )
      // })

      // it(`Should deposit all ${tokens.STETH} tokens to aave`, () => {
      //   expectToBe(
      //     positionMutation.simulation.swap.minToTokenAmount,
      //     'lte',
      //     new BigNumber(userCollateralReserveData.currentATokenBalance.toString()),
      //   )
      // })

      // it('Should achieve target multiple', () => {
      //   expectToBe(
      //     positionMutation.simulation.position.riskRatio.multiple,
      //     'gte',
      //     actualPosition.riskRatio.multiple,
      //   )
      // })

      // it('Should collect fee', async () => {
      //   const feeRecipientWethBalanceAfter = await balanceOf(
      //     ADDRESSES.main.WETH,
      //     ADDRESSES.main.feeRecipient,
      //     { config, isFormatted: true },
      //   )

      //   expectToBeEqual(
      //     new BigNumber(positionMutation.simulation.swap.sourceTokenFee),
      //     feeRecipientWethBalanceAfter.minus(feeRecipientWethBalanceBefore),
      //   )
      // })
    })

    describe(`With ${tokens.ETH} collateral (+dep) & ${tokens.USDC} debt`, () => {
      const depositEthAmount = new BigNumber(600)

      let userEthReserveData: AAVEReserveData
      let userUSDCReserveData: AAVEReserveData
      let feeRecipientUSDCBalanceBefore: BigNumber
      let actualPosition: IPosition

      before(async () => {
        const setup = await setupOpenPositionTest(
          {
            depositAmountInWei: amountToWei(depositEthAmount),
            symbol: tokens.ETH,
            address: ADDRESSES.main.WETH,
            precision: 18,
            isEth: true,
          },
          {
            depositAmountInWei: ZERO,
            symbol: tokens.USDC,
            address: ADDRESSES.main.USDC,
            precision: 6,
            isEth: false,
          },
          new BigNumber(1300),
          true,
        )
        txStatus = setup.txStatus
        positionMutation = setup.positionMutation
        actualPosition = setup.actualPosition
        userEthReserveData = setup.userCollateralReserveData
        userUSDCReserveData = setup.userDebtReserveData
        feeRecipientUSDCBalanceBefore = setup.feeRecipientBalanceBefore
      })

      it('Tx should pass', () => {
        expect(txStatus).to.be.true
      })

      it('Should draw debt according to multiple', () => {
        expectToBeEqual(
          positionMutation.simulation.position.debt.amount.toFixed(0),
          new BigNumber(userUSDCReserveData.currentVariableDebt.toString()).toFixed(0),
        )
      })

      it(`Should deposit all ${tokens.ETH} tokens to aave`, () => {
        expectToBe(
          positionMutation.simulation.position.collateral.amount,
          'lte',
          new BigNumber(userEthReserveData.currentATokenBalance.toString()).toFixed(0),
        )
      })

      it('Should achieve target multiple', () => {
        expectToBe(
          positionMutation.simulation.position.riskRatio.multiple.times(
            ONE.minus(MULTIPLE_TESTING_OFFSET),
          ),
          'lte',
          actualPosition.riskRatio.multiple,
        )

        expectToBe(
          positionMutation.simulation.position.riskRatio.multiple,
          'gte',
          actualPosition.riskRatio.multiple,
        )
      })

      it('Should collect fee', async () => {
        const feeRecipientUSDCBalanceAfter = await balanceOf(
          ADDRESSES.main.USDC,
          ADDRESSES.main.feeRecipient,
          { config },
        )

        expectToBeEqual(
          amountToWei(new BigNumber(positionMutation.simulation.swap.sourceTokenFee), 6).toFixed(0),
          feeRecipientUSDCBalanceAfter.minus(feeRecipientUSDCBalanceBefore),
        )
      })
    })

    describe(`With ${tokens.WBTC} collateral & ${tokens.USDC} debt`, () => {
      const depositWBTCAmount = new BigNumber(6)

      let userWBTCReserveData: AAVEReserveData
      let userUSDCReserveData: AAVEReserveData
      let feeRecipientUSDCBalanceBefore: BigNumber
      let actualPosition: IPosition

      before(async () => {
        const setup = await setupOpenPositionTest(
          {
            depositAmountInWei: amountToWei(depositWBTCAmount, 8),
            symbol: tokens.WBTC,
            address: ADDRESSES.main.WBTC,
            precision: 8,
            isEth: false,
          },
          {
            depositAmountInWei: ZERO,
            symbol: tokens.USDC,
            address: ADDRESSES.main.USDC,
            precision: 6,
            isEth: false,
          },
          new BigNumber(20032),
          true,
        )
        txStatus = setup.txStatus
        positionMutation = setup.positionMutation
        actualPosition = setup.actualPosition
        userWBTCReserveData = setup.userCollateralReserveData
        userUSDCReserveData = setup.userDebtReserveData
        feeRecipientUSDCBalanceBefore = setup.feeRecipientBalanceBefore
      })

      it('Tx should pass', () => {
        expect(txStatus).to.be.true
      })

      it('Should draw debt according to multiple', () => {
        expectToBeEqual(
          positionMutation.simulation.position.debt.amount.toFixed(0),
          new BigNumber(userUSDCReserveData.currentVariableDebt.toString()).toFixed(0),
        )
      })

      it(`Should deposit all ${tokens.WBTC} tokens to aave`, () => {
        expectToBe(
          positionMutation.simulation.position.collateral.amount,
          'lte',
          new BigNumber(userWBTCReserveData.currentATokenBalance.toString()).toFixed(0),
        )
      })

      it('Should achieve target multiple', () => {
        expectToBe(
          positionMutation.simulation.position.riskRatio.multiple.times(
            ONE.minus(MULTIPLE_TESTING_OFFSET),
          ),
          'lte',
          actualPosition.riskRatio.multiple,
        )

        expectToBe(
          positionMutation.simulation.position.riskRatio.multiple,
          'gte',
          actualPosition.riskRatio.multiple,
        )
      })

      it('Should collect fee', async () => {
        const feeRecipientUSDCBalanceAfter = await balanceOf(
          ADDRESSES.main.USDC,
          ADDRESSES.main.feeRecipient,
          { config },
        )

        expectToBeEqual(
          amountToWei(new BigNumber(positionMutation.simulation.swap.sourceTokenFee), 6).toFixed(0),
          feeRecipientUSDCBalanceAfter.minus(feeRecipientUSDCBalanceBefore),
        )
      })
    })
  })

  describe.skip('On latest block using one inch exchange and api', () => {
    const depositEthAmount = amountToWei(new BigNumber(60 / 1e15))
    const multiple = new BigNumber(2)
    const slippage = new BigNumber(0.1)

    let system: DeployedSystemInfo

    let positionMutation: IPositionMutation
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
          { config, isFormatted: true },
        )

        positionMutation = await strategies.aave.open(
          {
            depositedByUser: { debtInWei: depositEthAmount },
            slippage,
            multiple,
            debtToken: { symbol: 'ETH' },
            collateralToken: { symbol: 'STETH' },
          },
          {
            addresses,
            provider,
            getSwapData: getOneInchCall(system.common.swap.address),
            proxy: system.common.dsProxy.address,
          },
        )

        const [_txStatus] = await executeThroughProxy(
          system.common.dsProxy.address,
          {
            address: system.common.operationExecutor.address,
            calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
              positionMutation.transaction.calls,
              OPERATION_NAMES.common.CUSTOM_OPERATION,
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

    it('Tx should pass', () => {
      expect(txStatus).to.be.true
    })

    it('Should draw debt according to multiple', () => {
      expectToBeEqual(
        positionMutation.simulation.position.debt.amount.toFixed(0),
        new BigNumber(userAccountData.totalDebtETH.toString()),
      )
    })

    it('Should deposit all stEth tokens to aave', () => {
      expectToBe(
        positionMutation.simulation.swap.minToTokenAmount,
        'lte',
        new BigNumber(userStEthReserveData.currentATokenBalance.toString()),
      )
    })

    it('Should collect fee', async () => {
      const feeRecipientWethBalanceAfter = await balanceOf(
        ADDRESSES.main.WETH,
        ADDRESSES.main.feeRecipient,
        { config, isFormatted: true },
      )

      expectToBeEqual(
        new BigNumber(positionMutation.simulation.swap.sourceTokenFee),
        feeRecipientWethBalanceAfter.minus(feeRecipientWethBalanceBefore),
      )
    })
  })
})
