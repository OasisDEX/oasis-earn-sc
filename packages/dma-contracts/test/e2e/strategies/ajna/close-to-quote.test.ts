import { Address } from '@deploy-configurations/types/address'
import { Network } from '@deploy-configurations/types/network'
import { expect } from '@dma-common/test-utils'
import { Unbox } from '@dma-common/types/common'
import { balanceOf } from '@dma-common/utils/balances'
import { executeThroughDPMProxy } from '@dma-common/utils/execute'
import { AjnaPositionDetails, EnvWithAjnaPositions } from '@dma-contracts/test/fixtures'
import { UNISWAP_TEST_SLIPPAGE } from '@dma-contracts/test/fixtures/factories/common'
import {
  envWithAjnaPositions,
  getSupportedAjnaPositions,
} from '@dma-contracts/test/fixtures/system/env-with-ajna-positions'
import { AjnaPosition, strategies, views } from '@dma-library'
import * as SwapUtils from '@dma-library/utils/swap'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'

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
    position: AjnaPosition
  }

  async function closePositionHelper({ env, positionDetails, position }: PositionCloserHelper) {
    const { dependencies, dsSystem, config, ajnaSystem } = env
    const { collateralToken, debtToken, proxy, getSwapData } = positionDetails

    console.log('CLOSING')

    const isFeeFromDebtToken =
      SwapUtils.acceptedFeeTokenBySymbol({
        fromTokenSymbol: collateralToken.symbol,
        toTokenSymbol: debtToken.symbol,
      }) === 'targetToken'

    const feeRecipient = dsSystem.config.common.FeeRecipient.address
    if (!feeRecipient) throw new Error('Fee recipient is not set')
    const feeBalanceBeforeClosing = await balanceOf(
      isFeeFromDebtToken ? debtToken.address : collateralToken.address,
      feeRecipient,
      { config },
    )
    const pool = ajnaSystem.pools.wethUsdcPool
    const ajnaPool = await dependencies.getPoolData(pool.address)

    const payload = await strategies.ajna.multiply.close(
      {
        dpmProxyAddress: proxy,
        poolAddress: ajnaPool.poolAddress,
        collateralPrice: positionDetails.__collateralPrice,
        collateralTokenPrecision: collateralToken.precision,
        collateralTokenSymbol: collateralToken.symbol,
        quotePrice: positionDetails.__quotePrice,
        quoteTokenPrecision: debtToken.precision,
        quoteTokenSymbol: debtToken.symbol,
        slippage: UNISWAP_TEST_SLIPPAGE,
        user: dependencies.user,
        position,
        shouldCloseToCollateral: false,
      },
      {
        provider: config.provider,
        operationExecutor: dsSystem.system.OperationExecutor.contract.address,
        poolInfoAddress: dependencies.poolInfoAddress,
        WETH: dependencies.WETH,
        getPoolData: dependencies.getPoolData,
        addresses: dependencies.addresses,
        getSwapData,
      },
    )

    console.log('EXECUTING')
    const [closeTxStatus] = await executeThroughDPMProxy(
      proxy,
      {
        address: payload.tx.to,
        calldata: payload.tx.data,
      },
      config.signer,
      payload.tx.value,
    )

    console.log('EXECUTED', closeTxStatus)
    if (!closeTxStatus) throw new Error('Close position failed')

    const feeBalanceAfterClosing = await balanceOf(
      isFeeFromDebtToken ? debtToken.address : collateralToken.address,
      feeRecipient,
      { config },
    )

    const closedPosition = await views.ajna.getPosition(
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

    const feesCollected = feeBalanceAfterClosing.minus(feeBalanceBeforeClosing)

    return {
      closedPosition,
      simulation: payload.simulation,
      closeTxStatus,
      feesCollected,
    }
  }

  describe('Open multiply positions', function () {
    supportedPositions.forEach(({ name: variant }) => {
      let position: AjnaPosition
      let debtToken: Token
      let collateralToken: Token
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
        debtToken = positionDetails.debtToken
        collateralToken = positionDetails.collateralToken

        act = await closePositionHelper({
          env,
          positionDetails,
          position,
        })
      })

      it(`Should have closed ${variant} position`, async () => {
        expect(act.closeTxStatus).to.be.true
      })
      // it(`Should have paid back all debt for ${variant}`, async () => {
      //   expect.toBe(
      //     simulatedPosition.collateralAmount.toFixed(0),
      //     'lte',
      //     position.collateralAmount.toFixed(0),
      //   )
      // })
      // it(`Should have withdrawn all collateral for ${variant}`, async () => {
      //   expect.toBe(position.riskRatio.multiple, 'lte', simulatedPosition.riskRatio.multiple)
      // })
      // it(`Should not have anything left on the proxy for ${variant}`, async () => {
      //   expect.toBeEqual(false, true)
      // })
      // it(`Should have collected a fee for ${variant}`, async () => {
      //   // const simulatedFee = simulation.swaps[0].tokenFee || ZERO
      //   expect.toBe(ZERO, 'gte', feesCollected, EXPECT_LARGER_SIMULATED_FEE)
      // })
    })
  })
})
