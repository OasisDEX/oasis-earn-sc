import AAVEProtocolDataProviderABI from '@abis/external/protocols/aave/v3/aaveProtocolDataProvider.json'
import AAVEPoolABI from '@abis/external/protocols/aave/v3/pool.json'
import { Address } from '@deploy-configurations/types/address'
import { Network } from '@deploy-configurations/types/network'
import { ZERO } from '@dma-common/constants'
import { expect } from '@dma-common/test-utils'
import { Unbox } from '@dma-common/types/common'
import { balanceOf } from '@dma-common/utils/balances'
import { amountFromWei } from '@dma-common/utils/common'
import { executeThroughProxy } from '@dma-common/utils/execute'
import { AjnaPositionDetails, EnvWithAjnaPositions } from '@dma-contracts/test/fixtures'
import {
  envWithAjnaPositions,
  getSupportedAjnaPositions,
} from '@dma-contracts/test/fixtures/system/env-with-ajna-positions'
import { AjnaPosition, strategies, views } from '@dma-library'
import { Strategy } from '@dma-library/types'
import * as SwapUtils from '@dma-library/utils/swap'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import BigNumber from 'bignumber.js'
import { Contract, ethers } from 'ethers'

const networkFork = process.env.NETWORK_FORK as Network
const EXPECT_LARGER_SIMULATED_FEE = 'Expect simulated fee to be more than the user actual pays'

describe('Strategy | AJNA | Close-to-Quote Multiply | E2E', () => {
  const supportedPositions = getSupportedAjnaPositions(networkFork)
  let env: EnvWithAjnaPositions
  const fixture = envWithAjnaPositions({
    network: networkFork,
    systemConfigPath: `test/${networkFork}.conf.ts`,
    configExtensionPaths: [`test/uSwap.conf.ts`],
  })
  before(async function () {
    env = await loadFixture(fixture)
    if (!env) throw new Error('Env not setup')
  })

  type Token = {
    symbol: string
    precision: number
    address: Address
  }

  type PositionCloserHelper = {
    env: EnvWithAjnaPositions
    positionDetails: AjnaPositionDetails
  }

  async function closePositionHelper({ env, positionDetails }: PositionCloserHelper) {
    const { dependencies, dsSystem, config } = env
    const {
      // isDPMProxy,
      // position,
      collateralToken,
      debtToken,
      proxy,
      // userAddress,
      getSwapData,
      // slippage,
      // config,
      // dependencies,
      // dsSystem,
      // positionType,
    } = positionDetails
    const { addresses } = dependencies

    const isFeeFromDebtToken =
      SwapUtils.acceptedFeeTokenBySymbol({
        fromTokenSymbol: collateralToken.symbol,
        toTokenSymbol: debtToken.symbol,
      }) === 'targetToken'

    const feeRecipient = dsSystem.config.common.FeeRecipient.address
    if (!feeRecipient) throw new Error('Fee recipient is not set')
    const feeWalletBalanceBeforeClosing = await balanceOf(
      isFeeFromDebtToken ? debtToken.address : collateralToken.address,
      feeRecipient,
      { config },
    )

    const pool = new Contract(dependencies.poolInfoAddress, AAVEPoolABI, config.provider)

    const protocolDataProvider = new Contract(
      dependencies.poolInfoAddress,
      AAVEProtocolDataProviderABI,
      config.provider,
    )

    // const priceOracle = new ethers.Contract(addresses.aaveOracle, aaveOracleABI, provider)

    const closePosition = await strategies.ajna.multiply.close(
      {
        dpmProxyAddress,
        poolAddress,
        collateralPrice,
        collateralTokenPrecision,
        quotePrice,
        quoteTokenPrecision,
        quoteTokenSymbol,
        collateralTokenSymbol,
        riskRatio,
        user,
        shouldCloseToCollateral,
        slippage,
        position,
      },
      {
        isDPMProxy,
        addresses,
        provider,
        currentPosition: position,
        getSwapData,
        proxy,
        user: userAddress,
      },
    )

    const [closeTxStatus, closeTx] = await executeThroughProxy(
      proxy,
      {
        address: dsSystem.system.OperationExecutor.contract.address,
        calldata: dsSystem.system.OperationExecutor.contract.interface.encodeFunctionData(
          'executeOp',
          [closePosition.transaction.calls, closePosition.transaction.operationName],
        ),
      },
      signer,
      '0',
    )

    if (!closeTxStatus) throw new Error('Close position failed')

    // Get data from AAVE V3
    const protocolDataPromises = [
      protocolDataProvider.getUserReserveData(collateralTokenAddress, proxy),
      protocolDataProvider.getUserReserveData(debtTokenAddress, proxy),
      priceOracle
        .getAssetPrice(collateralTokenAddress)
        .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString()))),
      priceOracle
        .getAssetPrice(debtTokenAddress)
        .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString()))),
      pool.getUserAccountData(proxy),
    ]
    const protocolData = await Promise.all(protocolDataPromises)

    const feeWalletBalanceAfterClosing = await balanceOf(
      isFeeFromDebtToken ? debtToken.address : collateralToken.address,
      feeRecipient,
      { config },
    )

    const closedPosition = strategies.aave.v3.view(
      {
        proxy,
        collateralToken,
        debtToken,
      },
      {
        addresses,
        provider,
      },
    )

    return {
      closedPosition,
      simulation: closePosition.simulation,
      closeTxStatus,
      closeTx,
      protocolData: {
        collateral: protocolData[0],
        debt: protocolData[1],
        collateralPrice: protocolData[2],
        debtPrice: protocolData[3],
        userAccountData: protocolData[4],
      },
      debtTokenAddress,
      collateralTokenAddress,
      feeWalletBalanceBeforeClosing,
      feeWalletBalanceAfterClosing,
    }
  }

  describe('Open multiply positions', function () {
    supportedPositions.forEach(({ name: variant }) => {
      let position: AjnaPosition
      let simulatedPosition: AjnaPosition
      let simulation: Strategy<AjnaPosition>['simulation']
      let debtToken: Token
      let collateralToken: Token
      let feesCollected: BigNumber
      let act: Unbox<ReturnType<typeof closePositionHelper>>

      before(async function () {
        const { positions, ajnaSystem, config, dsSystem, dependencies } = env
        const positionDetails = positions[variant]
        if (!positionDetails) {
          throw new Error('Position not found')
        }
        position = await views.ajna.getPosition(
          {
            proxyAddress: positionDetails.proxy,
            poolAddress: positionDetails.pool.poolAddress,
            collateralPrice: positionDetails.__collateralPrice,
            quotePrice: positionDetails.__quotePrice,
          },
          {
            poolInfoAddress: ajnaSystem.poolInfo.address,
            provider: env.config.provider,
            getPoolData: env.dependencies.getPoolData,
          },
        )
        simulation = positionDetails.__openPositionSimulation
        simulatedPosition = simulation.position
        feesCollected = positionDetails.__feesCollected
        debtToken = positionDetails.debtToken
        collateralToken = positionDetails.collateralToken

        act = await closePositionHelper({
          env,
          positionDetails,
        })
      })

      it(`Should have closed ${variant} position`, async () => {
        expect(act.closeTxStatus).to.be.true
      })
      it(`Should have paid back all debt for ${variant}`, async () => {
        expect.toBe(
          simulatedPosition.collateralAmount.toFixed(0),
          'lte',
          position.collateralAmount.toFixed(0),
        )
      })
      it(`Should have withdrawn all collateral for ${variant}`, async () => {
        expect.toBe(position.riskRatio.multiple, 'lte', simulatedPosition.riskRatio.multiple)
      })
      it(`Should not have anything left on the proxy for ${variant}`, async () => {
        expect.toBeEqual(false, true)
      })
      it(`Should have collected a fee for ${variant}`, async () => {
        // const simulatedFee = simulation.swaps[0].tokenFee || ZERO
        expect.toBe(ZERO, 'gte', feesCollected, EXPECT_LARGER_SIMULATED_FEE)
      })
    })
  })
})
