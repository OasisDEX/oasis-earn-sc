import { ONE } from '@dma-common/constants'
import { RuntimeConfig } from '@dma-common/types/common'
import { balanceOf } from '@dma-common/utils/balances'
import { amountToWei } from '@dma-common/utils/common'
import { executeThroughDPMProxy } from '@dma-common/utils/execute'
import {
  AjnaPositionDetails,
  AjnaSystem,
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

export interface EthUsdcMultiplyAjnaPosition {
  positionVariant: 'ETH/USDC Multiply'

  ({
    proxy,
    dependencies,
    ajnaSystem,
    config,
    feeRecipient,
  }: {
    proxy: string
    dependencies: StrategyDependenciesAjna
    ajnaSystem: AjnaSystem
    config: RuntimeConfig
    feeRecipient: string
  }): Promise<AjnaPositionDetails>
}

const ethUsdcMultiplyAjnaPosition: EthUsdcMultiplyAjnaPosition = async ({
  proxy,
  dependencies,
  ajnaSystem,
  config,
  feeRecipient,
}) => {
  if (!feeRecipient) throw new Error('feeRecipient is not set')
  const pool = ajnaSystem.pools.wethUsdcPool
  if (!pool) throw new Error('wethUsdcPool is not set')

  // Find some way to supplyQuote
  // Precision: ONE = 1 ETH
  // await ajnaSystem.provideLiquidity(
  //   pool,
  //   new EBigNumber(ONE.toString()),
  //   new EBigNumber(ONE.toString()),
  // )
  // await ajnaSystem.ajnaProxyActionsContract.supplyQuote(pool.address, bn.eighteen.ONE, 2000000, {
  //   gasLimit: 5000000,
  // })
  // const index = await ajnaProxyActionsContract.convertPriceToIndex(price)
  // await wbtc.approve(poolContract.address, bn.eighteen.ONE)
  // // add one BTC to the pool
  // await poolContract.addCollateral(bn.eighteen.ONE, index, Date.now() + 100)

  const ajnaPool = await dependencies.getPoolData(pool.address)

  // Mocked price info
  const mockMarketPrice = new BigNumber(1543)
  const collateralPrice = new BigNumber(1543)
  const quotePrice = new BigNumber(1)

  await addLiquidityToPool(ajnaPool)
  const tokens = configureTokens(dependencies)
  const getSwapDataFn = configureSwapDataFn(dependencies, tokens, mockMarketPrice)
  const payload = await getEthUsdcMultiplyAjnaPositionPayload(
    collateralPrice,
    quotePrice,
    ajnaPool,
    tokens,
    proxy,
    {
      ...dependencies,
      getSwapData: getSwapDataFn,
    },
  )
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
    ajnaPool,
    feesCollected,
    mockMarketPrice,
    collateralPrice,
    quotePrice,
  )
}

ethUsdcMultiplyAjnaPosition.positionVariant = 'ETH/USDC Multiply' as const

async function addLiquidityToPool(pool: AjnaPool) {
  // const amount = amountToWei(ONE, ETH.precision)
  // const tx = await pool.addLiquidity(amount, { value: amount })
  // await tx.wait()
  // Perform pool setup
}

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

function configureSwapDataFn(
  dependencies: StrategyDependenciesAjna,
  tokens: ReturnType<typeof configureTokens>,
  mockMarketPrice: BigNumber,
) {
  return dependencies.getSwapData(mockMarketPrice, {
    from: tokens.USDC.precision,
    to: tokens.ETH.precision,
  })
}

async function getEthUsdcMultiplyAjnaPositionPayload(
  collateralPrice: BigNumber,
  quotePrice: BigNumber,
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
    collateralPrice,
    quotePrice,
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
  pool: AjnaPool,
  feesCollected: BigNumber,
  mockMarketPrice: BigNumber,
  collateralPrice: BigNumber,
  quotePrice: BigNumber,
) {
  return {
    proxy: proxy,
    getPosition: dependencies.getPosition,
    variant: ethUsdcMultiplyAjnaPosition.positionVariant,
    strategy: ethUsdcMultiplyAjnaPosition.positionVariant,
    collateralToken: tokens.ETH,
    debtToken: tokens.USDC,
    getSwapData: getSwapDataFn,
    pool,
    __positionType: 'Multiply' as const,
    __mockPrice: mockMarketPrice,
    __mockMarketPrice: mockMarketPrice,
    __collateralPrice: collateralPrice,
    __quotePrice: quotePrice,
    __openPositionSimulation: payload.simulation,
    __feeWalletBalanceChange: feesCollected,
    __feesCollected: feesCollected,
  }
}

export { ethUsdcMultiplyAjnaPosition }
