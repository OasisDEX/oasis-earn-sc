import { StrategyDependenciesAaveV2 } from '@dma-contracts/test/fixtures/types/strategies-dependencies'
import { addressesByNetwork } from '@oasisdex/dma-common/test-utils/addresses'
import { RuntimeConfig } from '@oasisdex/dma-common/types/common'
import { amountToWei, approve, balanceOf } from '@oasisdex/dma-common/utils/common'
import { executeThroughDPMProxy, executeThroughProxy } from '@oasisdex/dma-common/utils/execute'
import { Network } from '@oasisdex/dma-deployments/types/network'
import { AaveVersion, strategies } from '@oasisdex/dma-library'
import {
  AaveV2OpenDependencies,
  AaveV3OpenDependencies,
} from '@oasisdex/dma-library/src/strategies/aave/open/open'
import { RiskRatio } from '@oasisdex/domain'
import BigNumber from 'bignumber.js'

import { AavePositionStrategy, PositionDetails } from '../types'
import { ETH, MULTIPLE, SLIPPAGE, STETH, UNISWAP_TEST_SLIPPAGE, USDC } from './common'
import { OpenPositionTypes } from './open-position-types'

const mainnetAddresses = addressesByNetwork(Network.MAINNET)

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
}: {
  proxy: string
  isDPM: boolean
  use1inch: boolean
  swapAddress?: string
  dependencies: StrategyDependenciesAaveV2
  config: RuntimeConfig
  getTokens: (symbol: 'USDC', amount: BigNumber) => Promise<boolean>
}): Promise<PositionDetails> {
  const strategy: AavePositionStrategy = 'STETH/USDC Multiply'

  if (use1inch && !swapAddress) throw new Error('swapAddress is required when using 1inch')
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
    },
  )

  await getTokens('USDC', use1inch ? wethToSwapToUSDCTo : usdcToSteal)

  await approve(mainnetAddresses.USDC, proxy, amountInBaseUnit, config)

  const proxyFunction = isDPM ? executeThroughDPMProxy : executeThroughProxy

  const feeWalletBalanceBefore = await balanceOf(
    mainnetAddresses.USDC,
    mainnetAddresses.feeRecipient,
    {
      config,
    },
  )

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

  const feeWalletBalanceAfter = await balanceOf(
    mainnetAddresses.USDC,
    mainnetAddresses.feeRecipient,
    {
      config,
    },
  )

  const addresses = dependencies.addresses
  const getPosition = async () => {
    return await strategies.aave.v2.view(
      {
        collateralToken: STETH,
        debtToken: USDC,
        proxy,
      },
      {
        addresses: {
          ...addresses,
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
    collateralToken: tokens.STETH,
    debtToken: tokens.USDC,
    getSwapData,
    __positionType: 'Multiply',
    __mockPrice: mockPrice,
    __openPositionSimulation: position.simulation,
    __feeWalletBalanceChange: feeWalletBalanceAfter.minus(feeWalletBalanceBefore),
  }
}
