import { ONE, ZERO } from '@dma-common/constants'
import { RuntimeConfig } from '@dma-common/types/common'
import { balanceOf } from '@dma-common/utils/balances'
import { amountToWei } from '@dma-common/utils/common'
import { executeThroughDPMProxy } from '@dma-common/utils/execute'
import {
  AjnaPositionDetails,
  PositionVariants,
  StrategyDependenciesAjna,
} from '@dma-contracts/test/fixtures'
import {
  ETH,
  MULTIPLE,
  UNISWAP_TEST_SLIPPAGE,
  USDC,
} from '@dma-contracts/test/fixtures/factories/common'
import { AjnaPosition, RiskRatio, strategies } from '@dma-library'
import { AjnaPool } from '@dma-library/types/ajna/ajna-pool'
import { AjnaStrategy } from '@dma-library/types/common'
import BigNumber from 'bignumber.js'

import { OpenMultiplyPositionTypes } from './open-position-types'

interface EthUsdcMultiplyAjnaPosition {
  positionVariant: PositionVariants

  ({
    proxy,
    pool,
    swapAddress,
    dependencies,
    config,
    feeRecipient,
  }: {
    proxy: string
    pool: AjnaPool
    swapAddress?: string
    dependencies: StrategyDependenciesAjna
    config: RuntimeConfig
    feeRecipient: string
  }): Promise<AjnaPositionDetails>
}

const ethUsdcMultiplyAjnaPosition: EthUsdcMultiplyAjnaPosition = async ({
  proxy,
  pool,
  dependencies,
  config,
  feeRecipient,
}) => {
  if (!feeRecipient) throw new Error('feeRecipient is not set')
  const mockMarketPrice = new BigNumber(1543)

  const tokens = configureTokens(dependencies)
  const getSwapDataFn = configureSwapDataFn(dependencies)
  const payload = await getEthUsdcMultiplyAjnaPositionPayload(pool, tokens, proxy, {
    ...dependencies,
    getSwapData: getSwapDataFn,
  })
  const { feesCollected } = await executeTx(
    payload,
    dependencies,
    feeRecipient,
    config,
    proxy,
    ethUsdcMultiplyAjnaPosition.positionVariant,
  )

  return buildPositionDetails(
    proxy,
    dependencies,
    tokens,
    getSwapDataFn,
    payload,
    feesCollected,
    mockMarketPrice,
  )
}

ethUsdcMultiplyAjnaPosition.positionVariant = 'ETH/USDC Multiply'

function configureTokens(dependencies: StrategyDependenciesAjna) {
  const addresses = {
    ...dependencies.addresses,
    WETH: dependencies.WETH,
  }
  return {
    ETH: new ETH(addresses),
    USDC: new USDC(addresses),
  }
}

function configureSwapDataFn(dependencies: StrategyDependenciesAjna) {
  const mockPrice = new BigNumber(1543)
  // TODO: update to for position
  return dependencies.getSwapData(mockPrice, {
    from: USDC.precision,
    to: ETH.precision,
  })
}

async function getEthUsdcMultiplyAjnaPositionPayload(
  pool: AjnaPool,
  tokens: ReturnType<typeof configureTokens>,
  proxy: string,
  dependencies: Omit<StrategyDependenciesAjna, 'getSwapData'> & {
    getSwapData: AjnaPositionDetails['getSwapData']
  },
) {
  const collateralAmount = amountToWei(ONE, ETH.precision)
  const slippage = UNISWAP_TEST_SLIPPAGE
  const riskRatio = new RiskRatio(MULTIPLE, RiskRatio.TYPE.MULITPLE)

  const args: OpenMultiplyPositionTypes[0] = {
    user: dependencies.user,
    poolAddress: pool.poolAddress,
    dpmProxyAddress: proxy,
    collateralPrice: ZERO,
    quotePrice: ZERO,
    quoteTokenSymbol: tokens.USDC.symbol,
    collateralTokenSymbol: tokens.ETH.symbol,
    quoteTokenPrecision: tokens.USDC.precision,
    collateralTokenPrecision: tokens.ETH.precision,

    // TODO: Confirm expected form (18 decimals or not?)
    collateralAmount,
    slippage,
    riskRatio,
  }

  return await strategies.ajna.multiply.open(args, dependencies)
}

async function executeTx(
  payload: AjnaStrategy<AjnaPosition>,
  dependencies: StrategyDependenciesAjna,
  feeRecipient: string,
  config: RuntimeConfig,
  proxy: string,
  positionVariant: PositionVariants,
) {
  const feeBalanceBefore = await balanceOf(dependencies.addresses.USDC, feeRecipient, {
    config,
  })

  const [status] = await executeThroughDPMProxy(
    proxy,
    {
      address: payload.tx.to,
      calldata: payload.tx.data,
    },
    config.signer,
    payload.tx.value,
  )

  if (!status) {
    throw new Error(`Creating ${positionVariant} position failed`)
  }

  const feeBalanceAfter = await balanceOf(dependencies.addresses.USDC, feeRecipient, {
    config,
  })
  const feesCollected = feeBalanceAfter.minus(feeBalanceBefore)

  return { feesCollected }
}

function buildPositionDetails(
  proxy: string,
  dependencies: StrategyDependenciesAjna,
  tokens: ReturnType<typeof configureTokens>,
  getSwapDataFn: AjnaPositionDetails['getSwapData'],
  payload: AjnaStrategy<AjnaPosition>,
  feesCollected: BigNumber,
  mockMarketPrice: BigNumber,
) {
  return {
    proxy: proxy,
    getPosition: dependencies.getPosition,
    variant: ethUsdcMultiplyAjnaPosition.positionVariant,
    strategy: ethUsdcMultiplyAjnaPosition.positionVariant,
    collateralToken: tokens.ETH,
    debtToken: tokens.USDC,
    getSwapData: getSwapDataFn,
    __positionType: 'Multiply' as const,
    __mockPrice: mockMarketPrice,
    __mockMarketPrice: mockMarketPrice,
    __openPositionSimulation: payload.simulation,
    __feeWalletBalanceChange: feesCollected,
    __feesCollected: feesCollected,
  }
}

export { ethUsdcMultiplyAjnaPosition }
