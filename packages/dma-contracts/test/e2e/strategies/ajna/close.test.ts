import { Address } from '@deploy-configurations/types/address'
import { Network } from '@deploy-configurations/types/network'
import { ONE, ZERO } from '@dma-common/constants'
import { expect, oneInchCallMock } from '@dma-common/test-utils'
import { Unbox } from '@dma-common/types/common'
import { balanceOf } from '@dma-common/utils/balances'
import { amountToWei } from '@dma-common/utils/common'
import { executeThroughDPMProxy } from '@dma-common/utils/execute'
import { AjnaPositionDetails, EnvWithAjnaPositions } from '@dma-contracts/test/fixtures'
import {
  envWithAjnaPositions,
  getSupportedAjnaPositions,
} from '@dma-contracts/test/fixtures/system/env-with-ajna-positions'
import { AjnaPosition, strategies, views } from '@dma-library'
import * as SwapUtils from '@dma-library/utils/swap'
import { FLASHLOAN_SAFETY_MARGIN } from '@domain/constants'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import BigNumber from 'bignumber.js'

const networkFork = process.env.NETWORK_FORK as Network
const EXPECT_LARGER_SIMULATED_FEE = 'Expect simulated fee to be more than the user actual pays'
const ETH_STAND_IN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'

describe.skip('Strategy | AJNA | Close To Quote Multiply | E2E', () => {
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

  describe.skip('Close Positions using Close to Quote', function () {
    supportedPositions.forEach(({ name: variant }) => {
      let position: AjnaPosition
      let debtToken: Token
      let collateralToken: Token
      let positionDetails: AjnaPositionDetails
      let act: Unbox<ReturnType<typeof closePositionHelper>>

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

        act = await closePositionHelper({
          env,
          positionDetails,
          position,
          shouldCloseToCollateral: false,
        })
      })

      it(`Should have closed ${variant} position`, async () => {
        expect(act.closeTxStatus).to.be.true
      })
      it(`Should have paid back all debt for ${variant}`, async () => {
        expect.toBe(act.closedPosition.debtAmount.toFixed(0), 'lte', ONE)
      })
      it(`Should have withdrawn all collateral for ${variant}`, async () => {
        expect.toBe(act.closedPosition.collateralAmount.toFixed(0), 'lte', ONE)
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
      it(`Should have passed all remaining funds to the user for ${variant}`, async () => {
        const user = env.config.address
        const userDebtBalance = await balanceOf(debtToken.address, user, {
          config: env.config,
        })

        const amountToFlashloan = amountToWei(
          position.debtAmount.times(ONE.plus(FLASHLOAN_SAFETY_MARGIN)),
          positionDetails.debtToken.precision,
        ).integerValue(BigNumber.ROUND_DOWN)

        const leftoverDebtTokens = act.simulation.swaps[0].minToTokenAmount.minus(amountToFlashloan)
        const estimatedUserDebtBalance = act.userDebtBalanceBefore.plus(leftoverDebtTokens)
        expect.toBe(estimatedUserDebtBalance, 'lte', userDebtBalance)
      })
      it(`Should have collected a fee for ${variant}`, async () => {
        const simulatedFee = act.simulation.swaps[0].fee || ZERO
        expect.toBe(simulatedFee, 'gte', act.feesCollected, EXPECT_LARGER_SIMULATED_FEE)
      })
    })
  })
})

describe.skip('Strategy | AJNA | Close To Collateral Multiply | E2E', () => {
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

  describe.skip('Close Positions using Close to Collateral', function () {
    supportedPositions.forEach(({ name: variant }) => {
      let position: AjnaPosition
      let debtToken: Token
      let collateralToken: Token
      let positionDetails: AjnaPositionDetails
      let act: Unbox<ReturnType<typeof closePositionHelper>>

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

        act = await closePositionHelper({
          env,
          positionDetails,
          position,
          shouldCloseToCollateral: true,
        })
      })

      it(`Should have closed ${variant} position`, async () => {
        expect(act.closeTxStatus).to.be.true
      })
      it(`Should have paid back all debt for ${variant}`, async () => {
        expect.toBe(act.closedPosition.debtAmount.toFixed(0), 'lte', ONE)
      })
      it(`Should have withdrawn all collateral for ${variant}`, async () => {
        expect.toBe(act.closedPosition.collateralAmount.toFixed(0), 'lte', ONE)
      })
      it(`Should not have anything left on the proxy for ${variant}`, async () => {
        const proxyDebtBalance = await balanceOf(debtToken.address, positionDetails.proxy, {
          config: env.config,
          isFormatted: true,
        })

        let collateralAddress = collateralToken.address
        if (collateralToken.symbol === 'ETH') {
          collateralAddress = ETH_STAND_IN_ADDRESS
        }
        const proxyCollateralBalance = await balanceOf(collateralAddress, positionDetails.proxy, {
          config: env.config,
          isFormatted: true,
        })

        expect.toBeEqual(proxyDebtBalance, ZERO)
        expect.toBeEqual(proxyCollateralBalance, ZERO)
      })
      it(`Should have passed all remaining funds to the user for ${variant}`, async () => {
        const user = env.config.address
        const userDebtBalance = await balanceOf(debtToken.address, user, {
          config: env.config,
        })

        let collateralAddress = collateralToken.address
        if (collateralToken.symbol === 'ETH') {
          collateralAddress = ETH_STAND_IN_ADDRESS
        }
        const userCollateralBalance = await balanceOf(collateralAddress, user, {
          config: env.config,
        })
        const userCollateralBalanceDiff = userCollateralBalance.minus(
          act.userCollateralBalanceBefore,
        )

        const positionCollateral = amountToWei(
          position.collateralAmount,
          positionDetails.collateralToken.precision,
        ).integerValue(BigNumber.ROUND_DOWN)

        const amountToFlashloan = amountToWei(
          position.debtAmount.times(ONE.plus(FLASHLOAN_SAFETY_MARGIN)),
          positionDetails.debtToken.precision,
        ).integerValue(BigNumber.ROUND_DOWN)

        const leftoverCollateral = positionCollateral.minus(act.simulation.swaps[0].fromTokenAmount)
        const leftoverDebtTokens = act.simulation.swaps[0].minToTokenAmount.minus(amountToFlashloan)
        const estimatedUserDebtBalance = act.userDebtBalanceBefore.plus(leftoverDebtTokens)

        expect.toBe(leftoverCollateral, 'gte', userCollateralBalanceDiff)
        expect.toBe(estimatedUserDebtBalance, 'lte', userDebtBalance)
        // Confirm dust amount given close to collateral estimation
        expect.toBe(userDebtBalance, 'gt', ZERO)
      })
      it(`Should have collected a fee for ${variant}`, async () => {
        const simulatedFee = act.simulation.swaps[0].fee || ZERO
        expect.toBe(simulatedFee, 'gte', act.feesCollected, EXPECT_LARGER_SIMULATED_FEE)
      })
    })
  })
})

type PositionCloserHelper = {
  env: EnvWithAjnaPositions
  positionDetails: AjnaPositionDetails
  position: AjnaPosition
  shouldCloseToCollateral: boolean
}

async function closePositionHelper({
  env,
  positionDetails,
  position,
  shouldCloseToCollateral,
}: PositionCloserHelper) {
  const { dependencies, dsSystem, config, ajnaSystem } = env
  const { collateralToken, debtToken, proxy } = positionDetails

  const user = env.config.address
  const userDebtBalanceBefore = await balanceOf(debtToken.address, user, {
    config: env.config,
  })
  let collateralAddress = collateralToken.address
  if (collateralToken.symbol === 'ETH') {
    collateralAddress = ETH_STAND_IN_ADDRESS
  }

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
  const userCollateralBalanceBefore = await balanceOf(collateralAddress, user, {
    config: env.config,
  })
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
      slippage: new BigNumber(0.01),
      collateralAmount: ZERO,
      user: dependencies.user,
      position,
      shouldCloseToCollateral,
    },
    {
      provider: config.provider,
      operationExecutor: dsSystem.system.OperationExecutor.contract.address,
      poolInfoAddress: dependencies.poolInfoAddress,
      WETH: dependencies.WETH,
      getPoolData: dependencies.getPoolData,
      addresses: dependencies.addresses,
      getSwapData: oneInchCallMock(ONE.div(positionDetails.__mockPrice), {
        from: collateralToken.precision,
        to: debtToken.precision,
      }),
      network: Network.MAINNET,
    },
  )

  const [closeTxStatus] = await executeThroughDPMProxy(
    proxy,
    {
      address: payload.tx.to,
      calldata: payload.tx.data,
    },
    config.signer,
    payload.tx.value,
  )

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
    userDebtBalanceBefore,
    userCollateralBalanceBefore,
  }
}
