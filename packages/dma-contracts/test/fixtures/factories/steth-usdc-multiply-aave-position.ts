import { Network } from '@deploy-configurations/types/network'
import { addressesByNetwork } from '@dma-common/test-utils'
import { RuntimeConfig } from '@dma-common/types/common'
import { balanceOf } from '@dma-common/utils/balances'
import { amountToWei } from '@dma-common/utils/common'
import { executeThroughDPMProxy, executeThroughProxy } from '@dma-common/utils/execute'
import { approve } from '@dma-common/utils/tx'
import { AavePositionDetails, AavePositionStrategy } from '@dma-contracts/test/fixtures/types'
import { StrategyDependenciesAaveV2 } from '@dma-contracts/test/fixtures/types/strategies-dependencies'
import { AaveVersion, strategies } from '@dma-library'
import {
  AaveV2OpenDependencies,
  AaveV3OpenDependencies,
} from '@dma-library/strategies/aave/open/open'
import { RiskRatio } from '@domain'
import BigNumber from 'bignumber.js'

import { OpenPositionTypes } from './aave/open-position-types'
import { ETH, MULTIPLE, SLIPPAGE, STETH, UNISWAP_TEST_SLIPPAGE, USDC } from './common'

const amountInBaseUnit = amountToWei(new BigNumber(100), USDC.precision)
const wethToSwapToUSDCTo = amountToWei(new BigNumber(1), ETH.precision)
const usdcToSteal = amountToWei(new BigNumber(10000), USDC.precision)

async function getStEthUsdcMultiplyAAVEPosition(
  slippage: BigNumber,
  dependencies: OpenPositionTypes[1],
) {
  const args: OpenPositionTypes[0] = {
    collateralToken: STETH,
    debtToken: USDC,
    slippage,
    depositedByUser: {
      debtToken: {
        amountInBaseUnit,
      },
    },
    multiple: new RiskRatio(MULTIPLE, RiskRatio.TYPE.MULITPLE),
    positionType: 'Multiply',
  }

  if (isV2(dependencies)) {
    return await strategies.aave.v2.open(args, dependencies)
  }
  if (isV3(dependencies)) {
    return await strategies.aave.v3.open(args, dependencies)
  }

  throw new Error('Unsupported protocol version')
}

function isV2(dependencies: OpenPositionTypes[1]): dependencies is AaveV2OpenDependencies {
  return dependencies.protocol.version === AaveVersion.v2
}

function isV3(dependencies: OpenPositionTypes[1]): dependencies is AaveV3OpenDependencies {
  return dependencies.protocol.version === AaveVersion.v3
}

export async function stethUsdcMultiplyAavePosition({
  proxy,
  isDPM,
  use1inch,
  swapAddress,
  dependencies,
  config,
  getTokens,
  network,
}: {
  proxy: string
  isDPM: boolean
  use1inch: boolean
  swapAddress?: string
  dependencies: StrategyDependenciesAaveV2
  config: RuntimeConfig
  getTokens: (symbol: 'USDC', amount: BigNumber) => Promise<boolean>
  network: Network
}): Promise<AavePositionDetails> {
  const strategy: AavePositionStrategy = 'STETH/USDC Multiply'

  if (use1inch && !swapAddress) throw new Error('swapAddress is required when using 1inch')

  const addresses = addressesByNetwork(network)

  const tokens = {
    STETH: new STETH(dependencies.addresses),
    USDC: new USDC(dependencies.addresses),
  }
  const mockPrice = new BigNumber(1217.85)
  const getSwapData = use1inch
    ? dependencies.getSwapData(swapAddress)
    : dependencies.getSwapData(mockPrice, {
        from: USDC.precision,
        to: STETH.precision,
      })

  const position = await getStEthUsdcMultiplyAAVEPosition(
    use1inch ? SLIPPAGE : UNISWAP_TEST_SLIPPAGE,
    {
      ...dependencies,
      getSwapData,
      isDPMProxy: isDPM,
      proxy: proxy,
      network,
    },
  )

  await getTokens('USDC', use1inch ? wethToSwapToUSDCTo : usdcToSteal)

  await approve(addresses.USDC, proxy, amountInBaseUnit, config)

  const proxyFunction = isDPM ? executeThroughDPMProxy : executeThroughProxy

  const feeWalletBalanceBefore = await balanceOf(addresses.USDC, addresses.feeRecipient, {
    config,
  })

  const [status] = await proxyFunction(
    proxy,
    {
      address: dependencies.contracts.operationExecutor.address,
      calldata: dependencies.contracts.operationExecutor.interface.encodeFunctionData('executeOp', [
        position.transaction.calls,
        position.transaction.operationName,
      ]),
    },
    config.signer,
    '0',
  )

  if (!status) {
    throw new Error(`Creating ${strategy} position failed`)
  }

  const feeWalletBalanceAfter = await balanceOf(addresses.USDC, addresses.feeRecipient, {
    config,
  })

  const getPosition = async () => {
    return await strategies.aave.v2.view(
      {
        collateralToken: STETH,
        debtToken: USDC,
        proxy,
      },
      {
        addresses: {
          ...dependencies.addresses,
          operationExecutor: dependencies.contracts.operationExecutor.address,
        },
        provider: config.provider,
      },
    )
  }

  if (!getPosition) throw new Error('getPosition is not defined')

  return {
    proxy: proxy,
    getPosition,
    strategy,
    variant: strategy,
    collateralToken: tokens.STETH,
    debtToken: tokens.USDC,
    getSwapData,
    __positionType: 'Multiply',
    __mockPrice: mockPrice,
    __mockMarketPrice: mockPrice,
    __openPositionSimulation: position.simulation,
    __feeWalletBalanceChange: feeWalletBalanceAfter.minus(feeWalletBalanceBefore),
    __feesCollected: feeWalletBalanceAfter.minus(feeWalletBalanceBefore),
  }
}
