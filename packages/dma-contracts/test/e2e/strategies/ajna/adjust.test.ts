import { Address } from '@deploy-configurations/types/address'
import { Network } from '@deploy-configurations/types/network'
import { ONE, ZERO } from '@dma-common/constants'
import { expect, oneInchCallMock } from '@dma-common/test-utils'
import { Unbox } from '@dma-common/types/common'
import { balanceOf } from '@dma-common/utils/balances'
import { executeThroughDPMProxy } from '@dma-common/utils/execute'
import { AjnaPositionDetails, EnvWithAjnaPositions } from '@dma-contracts/test/fixtures'
import {
  envWithAjnaPositions,
  getSupportedAjnaPositions,
} from '@dma-contracts/test/fixtures/system/env-with-ajna-positions'
import { AjnaPosition, IRiskRatio, RiskRatio, strategies, views } from '@dma-library'
import { GetSwapData } from '@dma-library/types/common'
import * as SwapUtils from '@dma-library/utils/swap'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import BigNumber from 'bignumber.js'

const networkFork = process.env.NETWORK_FORK as Network
const EXPECT_LARGER_SIMULATED_FEE = 'Expect simulated fee to be more than the user actual pays'

describe.skip('Strategy | AJNA | Adjust Risk Up Multiply | E2E', () => {
  const supportedPositions = getSupportedAjnaPositions(networkFork)
  let env: EnvWithAjnaPositions
  const fixture = envWithAjnaPositions({
    network: networkFork,
    systemConfigPath: `test/${networkFork}.conf.ts`,
    configExtensionPaths: [`test/uSwap.conf.ts`],
    hideLogging: true,
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

  describe.skip('Adjust Risk Up', function () {
    supportedPositions.forEach(({ name: variant }) => {
      let position: AjnaPosition
      let debtToken: Token
      let collateralToken: Token
      let positionDetails: AjnaPositionDetails
      let act: Unbox<ReturnType<typeof adjustPositionHelper>>

      before(async function () {
        const { positions, ajnaSystem } = env
        positionDetails = positions[variant]
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

        act = await adjustPositionHelper({
          env,
          positionDetails,
          position,
          targetMultiple: new RiskRatio(new BigNumber(3.5), RiskRatio.TYPE.MULITPLE),
          // Can use same swap data mock given increasing risk is same as opening
          getSwapData: positionDetails.getSwapData,
        })
      })

      it(`Should have adjusted risk up on ${variant} position`, async () => {
        expect(act.adjustTxStatus).to.be.true
      })
      it(`Should have drawn debt according to multiple for ${variant}`, async () => {
        expect.toBe(
          act.simulation.position.debtAmount.toFixed(0),
          'lte',
          act.adjustPosition.debtAmount.toFixed(0),
        )
      })
      it(`Should have increased collateral according to multiple for ${variant}`, async () => {
        expect.toBe(
          act.simulation.position.collateralAmount.toFixed(0),
          'lte',
          act.adjustPosition.collateralAmount.toFixed(0),
        )
      })
      it(`Should not have anything left on the proxy for ${variant}`, async () => {
        const proxyDebtBalance = await balanceOf(debtToken.address, positionDetails.proxy, {
          config: env.config,
          isFormatted: true,
        })
        const proxyCollateralBalance = await balanceOf(
          collateralToken.address,
          positionDetails.proxy,
          {
            config: env.config,
            isFormatted: true,
          },
        )

        expect.toBeEqual(proxyDebtBalance, ZERO)
        expect.toBeEqual(proxyCollateralBalance, ZERO)
      })
      it(`Should have collected a fee for ${variant}`, async () => {
        const simulatedFee = act.simulation.swaps[0].fee || ZERO
        expect.toBe(simulatedFee, 'gte', act.feesCollected, EXPECT_LARGER_SIMULATED_FEE)
      })
    })
  })
})

describe.skip('Strategy | AJNA | Adjust Risk Down Multiply | E2E', () => {
  const supportedPositions = getSupportedAjnaPositions(networkFork)
  let env: EnvWithAjnaPositions
  const fixture = envWithAjnaPositions({
    network: networkFork,
    systemConfigPath: `test/${networkFork}.conf.ts`,
    configExtensionPaths: [`test/uSwap.conf.ts`],
    hideLogging: true,
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

  describe.skip('Adjust Risk Down', function () {
    supportedPositions.forEach(({ name: variant }) => {
      let position: AjnaPosition
      let debtToken: Token
      let collateralToken: Token
      let positionDetails: AjnaPositionDetails
      let act: Unbox<ReturnType<typeof adjustPositionHelper>>

      before(async function () {
        const { positions, ajnaSystem } = env
        positionDetails = positions[variant]
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

        act = await adjustPositionHelper({
          env,
          positionDetails,
          position,
          targetMultiple: new RiskRatio(new BigNumber(1.3), RiskRatio.TYPE.MULITPLE),
          getSwapData: oneInchCallMock(ONE.div(positionDetails.__mockPrice), {
            from: collateralToken.precision,
            to: debtToken.precision,
          }),
        })
      })

      it(`Should have adjusted risk down on ${variant} position`, async () => {
        expect(act.adjustTxStatus).to.be.true
      })
      it(`Should have paid back debt according to multiple for ${variant}`, async () => {
        expect.toBe(
          act.simulation.position.debtAmount.toString(),
          'gte',
          act.adjustPosition.debtAmount.toString(),
        )
      })
      it(`Should have decreased collateral according to multiple for ${variant}`, async () => {
        expect.toBe(
          act.simulation.position.collateralAmount.toFixed(0),
          'lte',
          act.adjustPosition.collateralAmount.toFixed(0),
        )
      })
      it(`Should not have anything left on the proxy for ${variant}`, async () => {
        const proxyDebtBalance = await balanceOf(debtToken.address, positionDetails.proxy, {
          config: env.config,
          isFormatted: true,
        })
        const proxyCollateralBalance = await balanceOf(
          collateralToken.address,
          positionDetails.proxy,
          {
            config: env.config,
            isFormatted: true,
          },
        )

        expect.toBeEqual(proxyDebtBalance, ZERO)
        expect.toBeEqual(proxyCollateralBalance, ZERO)
      })
      it(`Should have collected a fee for ${variant}`, async () => {
        const simulatedFee = act.simulation.swaps[0].fee || ZERO
        expect.toBe(simulatedFee, 'gte', act.feesCollected, EXPECT_LARGER_SIMULATED_FEE)
      })
    })
  })
})

type AdjustPositionHelper = {
  env: EnvWithAjnaPositions
  positionDetails: AjnaPositionDetails
  position: AjnaPosition
  targetMultiple: IRiskRatio
  getSwapData: GetSwapData
}

async function adjustPositionHelper({
  env,
  positionDetails,
  position,
  targetMultiple,
  getSwapData,
}: AdjustPositionHelper) {
  const { dependencies, dsSystem, config, ajnaSystem } = env
  const { collateralToken, debtToken, proxy } = positionDetails

  const isFeeFromDebtToken =
    SwapUtils.acceptedFeeTokenBySymbol({
      fromTokenSymbol: collateralToken.symbol,
      toTokenSymbol: debtToken.symbol,
    }) === 'targetToken'

  const feeRecipient = dsSystem.config.common.FeeRecipient.address
  if (!feeRecipient) throw new Error('Fee recipient is not set')
  const feeBalanceBeforeAdjust = await balanceOf(
    isFeeFromDebtToken ? debtToken.address : collateralToken.address,
    feeRecipient,
    { config },
  )
  const pool = ajnaSystem.pools.wethUsdcPool
  const ajnaPool = await dependencies.getPoolData(pool.address)

  const payload = await strategies.ajna.multiply.adjust(
    {
      dpmProxyAddress: proxy,
      poolAddress: ajnaPool.poolAddress,
      collateralPrice: positionDetails.__collateralPrice,
      collateralTokenPrecision: collateralToken.precision,
      collateralTokenSymbol: collateralToken.symbol,
      quotePrice: positionDetails.__quotePrice,
      quoteTokenPrecision: debtToken.precision,
      quoteTokenSymbol: debtToken.symbol,
      slippage: new BigNumber(0.02),
      user: dependencies.user,
      position,
      collateralAmount: ZERO,
      riskRatio: targetMultiple,
    },
    {
      provider: config.provider,
      operationExecutor: dsSystem.system.OperationExecutor.contract.address,
      poolInfoAddress: dependencies.poolInfoAddress,
      WETH: dependencies.WETH,
      getPoolData: dependencies.getPoolData,
      addresses: dependencies.addresses,
      getSwapData,
      network: Network.MAINNET,
    },
  )

  const [adjustTxStatus] = await executeThroughDPMProxy(
    proxy,
    {
      address: payload.tx.to,
      calldata: payload.tx.data,
    },
    config.signer,
    payload.tx.value,
  )

  if (!adjustTxStatus) throw new Error('Adjusting position failed')

  const feeBalanceAfterAdjust = await balanceOf(
    isFeeFromDebtToken ? debtToken.address : collateralToken.address,
    feeRecipient,
    { config },
  )

  const adjustPosition = await views.ajna.getPosition(
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

  const feesCollected = feeBalanceAfterAdjust.minus(feeBalanceBeforeAdjust)

  return {
    adjustPosition,
    simulation: payload.simulation,
    adjustTxStatus,
    feesCollected,
  }
}
