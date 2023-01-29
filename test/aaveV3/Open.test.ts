import { JsonRpcProvider } from '@ethersproject/providers'
import {
  AAVETokens,
  ADDRESSES,
  IPosition,
  IPositionTransition,
  Position,
  strategies,
  TYPICAL_PRECISION,
} from '@oasisdex/oasis-actions'
import aavePriceOracleABI from '@oasisdex/oasis-actions/lib/src/abi/aavePriceOracle.json'
import { amountFromWei } from '@oasisdex/oasis-actions/lib/src/helpers'
import { PositionType } from '@oasisdex/oasis-actions/lib/src/strategies/types/PositionType'
import { ONE, ZERO } from '@oasisdex/oasis-actions/src'
import { Address } from '@oasisdex/oasis-actions/src/strategies/types/IPositionRepository'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { loadFixture } from 'ethereum-waffle'
import { Contract, ContractReceipt, ethers, Signer } from 'ethers'

import AAVEDataProviderABI from '../../abi/aaveDataProvider.json'
import AAVELendigPoolABI from '../../abi/aaveLendingPool.json'
import PoolProxyAaveABI from '../../abi/PoolProxyAave.json'
import ProtocolDataProviderABI from '../../abi/aaveProtocolDataProvider.json'
import ERC20ABI from '../../abi/IERC20.json'
import { AAVEAccountData, AAVEReserveData } from '../../helpers/aave'
import { executeThroughProxy } from '../../helpers/deploy'
import { GasEstimateHelper, gasEstimateHelper } from '../../helpers/gasEstimation'
import { getForkedNetworkName, resetNodeToLatestBlock } from '../../helpers/init'
import { restoreSnapshot } from '../../helpers/restoreSnapshot'
import { getOneInchCall } from '../../helpers/swap/OneInchCall'
import { oneInchCallMock } from '../../helpers/swap/OneInchCallMock'
import { swapUniswapTokens } from '../../helpers/swap/uniswap'
import { RuntimeConfig } from '../../helpers/types/common'
import { amountToWei, balanceOf } from '../../helpers/utils'
import { acceptedFeeToken } from '../../packages/oasis-actions/src/helpers/acceptedFeeToken'
import { getNetworkFromChainId, Network } from '../../scripts/common'
import { mainnetAddresses } from '../addresses'
import { testBlockNumber } from '../config'
import { tokens } from '../constants'
import { DeployedSystemInfo, deploySystem } from '../deploySystem'
import { initialiseConfig } from '../fixtures'
import { expectToBe, expectToBeEqual } from '../utils'

describe(`Strategy | AAVE | Open Position`, async function () {
  let poolProxyAave: Contract
  let aaveProtocolDataProvider: Contract
  let provider: JsonRpcProvider
  let config: RuntimeConfig
  let signer: Signer
  let userAddress: Address
  let forkedChainId: number
  let forkedNetwork: Network

  before(async function () {
    ;({ config, provider, signer, address: userAddress } = await initialiseConfig() )

    forkedChainId = await getForkedNetworkName(provider)
    forkedNetwork = getNetworkFromChainId(forkedChainId)
    console.log('forkedNetwork', forkedNetwork );
    
    console.log('ADDRESSES.goerli.aaveV3',ADDRESSES.goerli );
    
    poolProxyAave = new Contract(
      ADDRESSES.goerli.aaveV3.PoolProxyAave,
      PoolProxyAaveABI,
      provider,
    )
    aaveProtocolDataProvider = new Contract(ADDRESSES.goerli.aaveV3.ProtocolDataProvider, ProtocolDataProviderABI, provider)
  })

  describe('[Uniswap] Open:', function () {
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
      userAddress: Address,
      isDPMProxy: boolean,
    ) {

      const { snapshot } = await restoreSnapshot({
        config,
        provider,
        forkedNetwork,
        blockNumber: testBlockNumber,
        useFallbackSwap: true,
        debug: true
      })
      const system = snapshot.deployed.system

      /**
       * Need to have correct tokens in hand before
       * to marry up with what user is depositing
       */

      console.log('11111', );
      
      const swapETHtoDepositTokens = amountToWei(new BigNumber(100))
      !debtToken.isEth &&
        debtToken.depositAmountInBaseUnit.gt(ZERO) &&
        (await swapUniswapTokens(
          ADDRESSES.goerli.WETH,
          debtToken.address,
          swapETHtoDepositTokens.toFixed(0),
          ONE.toFixed(0),
          config.address,
          config,
        ))

        console.log('2222', );

      !collateralToken.isEth &&
        collateralToken.depositAmountInBaseUnit.gt(ZERO) &&
        (await swapUniswapTokens(
          ADDRESSES.goerli.WETH,
          collateralToken.address,
          swapETHtoDepositTokens.toFixed(0),
          ONE.toFixed(0),
          config.address,
          config,
        ))
        
        console.log('33333', );

      if (!collateralToken.isEth) {
        const COLL_TOKEN = new ethers.Contract(collateralToken.address, ERC20ABI, provider).connect(
          signer,
        )
        await COLL_TOKEN.connect(signer).approve(
          system.common.userProxyAddress,
          collateralToken.depositAmountInBaseUnit.toFixed(0),
        )
      }

      console.log('44444', );

      if (!debtToken.isEth) {
        const DEBT_TOKEN = new ethers.Contract(debtToken.address, ERC20ABI, provider).connect(
          signer,
        )
        await DEBT_TOKEN.connect(signer).approve(
          system.common.userProxyAddress,
          debtToken.depositAmountInBaseUnit.toFixed(0),
        )
      }


      console.log('55555', );

      // todo: remove another source of addresses: mainnetAddresses
      // const addresses = {
      //   ...mainnetAddresses,
      //   operationExecutor: system.common.operationExecutor.address,
      // }

      const addresses = {
        DAI: ADDRESSES[forkedNetwork].DAI,
        ETH: ADDRESSES[forkedNetwork].ETH,
        WETH: ADDRESSES[forkedNetwork].WETH,
        STETH: ADDRESSES[forkedNetwork].STETH,
        WBTC: ADDRESSES[forkedNetwork].WBTC,
        USDC: ADDRESSES[forkedNetwork].USDC,
        chainlinkEthUsdPriceFeed: ADDRESSES[forkedNetwork].chainlinkEthUsdPriceFeed,
        aaveProtocolDataProvider: ADDRESSES[forkedNetwork].aaveV3.ProtocolDataProvider,
        aavePriceOracle: ADDRESSES[forkedNetwork].aaveV3.AaveOracle,
        aavePool: ADDRESSES[forkedNetwork].aaveV3.PoolProxyAave,
      }
      

      console.log('66666', );

      // "PoolProxyAave": "0x7b5C526B7F8dfdff278b4a3e045083FBA4028790",
      // "ProtocolDataProvider": "0xa41E284482F9923E265832bE59627d91432da76C",
      // "AaveOracle": "0x9F616c6
      // operationExecutor: string
      // chainlinkEthUsdPriceFeed: string
      // aavePriceOracle: string
      // aavePool: string
      // aaveProtocolDataProvider: string
      // aaveLendingPool: string

      const isFeeFromDebtToken =
        acceptedFeeToken({
          fromToken: debtToken.symbol,
          toToken: collateralToken.symbol,
        }) === 'sourceToken'
      const proxy = system.common.dsProxy.address
      
      console.log('777777', );
      
      const positionTransition = await strategies.aaveV3.open(
        {
          depositedByUser: {
            debtToken: { amountInBaseUnit: debtToken.depositAmountInBaseUnit },
            collateralToken: { amountInBaseUnit: collateralToken.depositAmountInBaseUnit },
          },
          // TODO: Integrate properly with DPM and execute t/x through that
          slippage,
          multiple,
          debtToken: { symbol: debtToken.symbol, precision: debtToken.precision },
          collateralToken: { symbol: collateralToken.symbol, precision: collateralToken.precision },
          collectSwapFeeFrom: isFeeFromDebtToken ? 'sourceToken' : 'targetToken',
          positionType: 'Earn',
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
          debug: true
        },
      )      
      const feeRecipientBalanceBefore = await balanceOf(
        isFeeFromDebtToken ? debtToken.address : collateralToken.address,
        ADDRESSES.goerli.feeRecipient,
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

      const userCollateralReserveData = await poolProxyAave.getUserReserveData(
        collateralToken.address,
        system.common.dsProxy.address,
      )

      const userDebtReserveData = await poolProxyAave.getUserReserveData(
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

    // describe(`With ${tokens.STETH} collateral & ${tokens.ETH} debt`, function () {
    //   const depositEthAmount = amountToWei(new BigNumber(1))
    //   gasEstimates = gasEstimateHelper()
    //   let userStEthReserveData: AAVEReserveData
    //   let userWethReserveData: AAVEReserveData
    //   let feeRecipientWethBalanceBefore: BigNumber
    //   let actualPosition: IPosition
    //   let tx: ContractReceipt

    //   before(async function () {
    //     const setup = await setupOpenPositionTest(
    //       {
    //         depositAmountInBaseUnit: ZERO,
    //         symbol: tokens.STETH,
    //         address: ADDRESSES.mainnet.STETH,
    //         precision: 18,
    //         isEth: false,
    //       },
    //       {
    //         depositAmountInBaseUnit: depositEthAmount,
    //         symbol: tokens.ETH,
    //         address: ADDRESSES.mainnet.WETH,
    //         precision: 18,
    //         isEth: true,
    //       },
    //       'Earn',
    //       new BigNumber(0.9759),
    //       userAddress,
    //       false,
    //     )
    //     txStatus = setup.txStatus
    //     tx = setup.tx
    //     positionTransition = setup.positionTransition
    //     actualPosition = setup.actualPosition
    //     userStEthReserveData = setup.userCollateralReserveData
    //     userWethReserveData = setup.userDebtReserveData
    //     feeRecipientWethBalanceBefore = setup.feeRecipientBalanceBefore

    //     gasEstimates.save(tx)
    //   })

    //   it('Tx should pass', function () {
    //     expect(txStatus).to.be.true
    //   })

    //   it('Should draw debt according to multiple', function () {
    //     expectToBeEqual(
    //       positionTransition.simulation.position.debt.amount.toFixed(0),
    //       new BigNumber(userWethReserveData.currentVariableDebt.toString()).toFixed(0),
    //     )
    //   })

    //   it(`Should deposit all ${tokens.STETH} tokens to aave`, function () {
    //     expectToBe(
    //       new BigNumber(userStEthReserveData.currentATokenBalance.toString()).toFixed(0),
    //       'gte',
    //       positionTransition.simulation.position.collateral.amount,
    //     )
    //   })

    //   it('Should achieve target multiple', function () {
    //     expectToBe(
    //       positionTransition.simulation.position.riskRatio.multiple,
    //       'gte',
    //       actualPosition.riskRatio.multiple,
    //     )
    //   })

    //   it('Should collect fee', async function () {
    //     const feeRecipientWethBalanceAfter = await balanceOf(
    //       ADDRESSES.mainnet.WETH,
    //       ADDRESSES.mainnet.feeRecipient,
    //       { config },
    //     )

    //     expectToBeEqual(
    //       new BigNumber(positionTransition.simulation.swap.tokenFee),
    //       feeRecipientWethBalanceAfter.minus(feeRecipientWethBalanceBefore),
    //     )
    //   })

    //   after(() => {
    //     gasEstimates.print()
    //   })
    // })

    describe.only(`With ${tokens.ETH} collateral (+dep) & ${tokens.USDC} debt`, function () {
      const depositEthAmount = new BigNumber(600)

      let userEthReserveData: AAVEReserveData
      let userUSDCReserveData: AAVEReserveData
      let feeRecipientUSDCBalanceBefore: BigNumber
      let actualPosition: IPosition

      before(async function () {

        console.log('ADDRESSES.goerli.WETH',ADDRESSES.goerli.WETH );
        console.log('ADDRESSES.goerli.USDC',ADDRESSES.goerli.USDC);
        
        const setup = await setupOpenPositionTest(
          {
            depositAmountInBaseUnit: amountToWei(depositEthAmount),
            symbol: tokens.ETH,
            address: ADDRESSES.goerli.WETH,
            precision: 18,
            isEth: true,
          },
          {
            depositAmountInBaseUnit: ZERO,
            symbol: tokens.USDC,
            address: ADDRESSES.goerli.USDC,
            precision: 6,
            isEth: false,
          },
          'Multiply',
          new BigNumber(1300),
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
          ADDRESSES.mainnet.USDC,
          ADDRESSES.mainnet.feeRecipient,
          { config },
        )

        expectToBeEqual(
          new BigNumber(positionTransition.simulation.swap.tokenFee),
          feeRecipientUSDCBalanceAfter.minus(feeRecipientUSDCBalanceBefore),
        )
      })
    })

    // describe(`With ${tokens.WBTC} collateral & ${tokens.USDC} debt`, function () {
    //   const depositWBTCAmount = new BigNumber(6)

    //   let userWBTCReserveData: AAVEReserveData
    //   let feeRecipientUSDCBalanceBefore: BigNumber
    //   let actualPosition: IPosition

    //   before(async function () {
    //     const setup = await setupOpenPositionTest(
    //       {
    //         depositAmountInBaseUnit: amountToWei(depositWBTCAmount, 8),
    //         symbol: tokens.WBTC,
    //         address: ADDRESSES.mainnet.WBTC,
    //         precision: 8,
    //         isEth: false,
    //       },
    //       {
    //         depositAmountInBaseUnit: ZERO,
    //         symbol: tokens.USDC,
    //         address: ADDRESSES.mainnet.USDC,
    //         precision: 6,
    //         isEth: false,
    //       },
    //       'Multiply',
    //       new BigNumber(20032),
    //       userAddress,
    //       false,
    //     )
    //     txStatus = setup.txStatus
    //     positionTransition = setup.positionTransition
    //     actualPosition = setup.actualPosition
    //     userWBTCReserveData = setup.userCollateralReserveData
    //     feeRecipientUSDCBalanceBefore = setup.feeRecipientBalanceBefore
    //   })

    //   it('Tx should pass', function () {
    //     expect(txStatus).to.be.true
    //   })

    //   it('Should draw debt according to multiple', function () {
    //     expect(new BigNumber(actualPosition.debt.amount.toString()).toString()).to.be.oneOf([
    //       positionTransition.simulation.position.debt.amount.toFixed(0),
    //       positionTransition.simulation.position.debt.amount.minus(ONE).toFixed(0),
    //     ])
    //   })

    //   it(`Should deposit all ${tokens.WBTC} tokens to aave`, function () {
    //     expectToBe(
    //       new BigNumber(userWBTCReserveData.currentATokenBalance.toString()).toFixed(0),
    //       'gte',
    //       positionTransition.simulation.position.collateral.amount,
    //     )
    //   })

    //   it('Should achieve target multiple', function () {
    //     expectToBe(
    //       positionTransition.simulation.position.riskRatio.multiple,
    //       'gte',
    //       actualPosition.riskRatio.multiple,
    //     )
    //   })

    //   it('Should collect fee', async function () {
    //     const feeRecipientUSDCBalanceAfter = await balanceOf(
    //       ADDRESSES.mainnet.USDC,
    //       ADDRESSES.mainnet.feeRecipient,
    //       { config },
    //     )

    //     expectToBeEqual(
    //       new BigNumber(positionTransition.simulation.swap.tokenFee),
    //       feeRecipientUSDCBalanceAfter.minus(feeRecipientUSDCBalanceBefore),
    //     )
    //   })
    // })
  })
})
