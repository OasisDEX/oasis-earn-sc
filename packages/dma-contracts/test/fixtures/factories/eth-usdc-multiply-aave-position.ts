import { ONE } from '@dma-common/constants'
import { RuntimeConfig } from '@dma-common/types/common'
import { balanceOf } from '@dma-common/utils/balances'
import { amountToWei } from '@dma-common/utils/common'
import { executeThroughDPMProxy, executeThroughProxy } from '@dma-common/utils/execute'
import { Network } from '@dma-contracts/../deploy-configurations/types/network'
import {
  AavePositionDetails,
  AavePositionStrategy,
  StrategyDependenciesAave,
} from '@dma-contracts/test/fixtures/types'
import {
  AAVEStrategyAddresses,
  AAVEV3StrategyAddresses,
  AaveVersion,
  strategies,
} from '@dma-library'
import {
  AaveV2OpenDependencies,
  AaveV3OpenDependencies,
} from '@dma-library/strategies/aave/multiply/open'
import { RiskRatio } from '@domain'
import BigNumber from 'bignumber.js'

import { OpenPositionTypes } from './aave/open-position-types'
import { ETH, MULTIPLE, SLIPPAGE, UNISWAP_TEST_SLIPPAGE, USDC } from './common'

const depositCollateralAmount = amountToWei(ONE, ETH.precision)

async function getEthUsdcMultiplyAAVEPosition(
  slippage: BigNumber,
  dependencies: OpenPositionTypes[1],
) {
  const args: OpenPositionTypes[0] = {
    collateralToken: new ETH(dependencies.addresses),
    debtToken: new USDC(dependencies.addresses),
    slippage,
    depositedByUser: {
      collateralToken: {
        amountInBaseUnit: depositCollateralAmount,
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

export async function ethUsdcMultiplyAavePosition({
  proxy,
  isDPM,
  use1inch,
  swapAddress,
  dependencies,
  config,
  feeRecipient,
  network,
}: {
  proxy: string
  isDPM: boolean
  use1inch: boolean
  swapAddress?: string
  dependencies: StrategyDependenciesAave
  config: RuntimeConfig
  feeRecipient: string
  network: Network
}): Promise<AavePositionDetails> {
  const strategy: AavePositionStrategy = 'ETH/USDC Multiply'

  if (use1inch && !swapAddress) throw new Error('swapAddress is required when using 1inch')

  const tokens = {
    ETH: new ETH(dependencies.addresses),
    USDC: new USDC(dependencies.addresses),
  }

  const mockPrice = new BigNumber(1543)
  const getSwapData = use1inch
    ? dependencies.getSwapData(swapAddress)
    : dependencies.getSwapData(mockPrice, {
        from: USDC.precision,
        to: ETH.precision,
      })

  const position = await getEthUsdcMultiplyAAVEPosition(
    use1inch ? SLIPPAGE : UNISWAP_TEST_SLIPPAGE,
    {
      ...dependencies,
      getSwapData,
      isDPMProxy: isDPM,
      proxy: proxy,
      network,
    },
  )

  const proxyFunction = isDPM ? executeThroughDPMProxy : executeThroughProxy

  if (!feeRecipient) throw new Error('feeRecipient is not set')
  const feeWalletBalanceBefore = await balanceOf(dependencies.addresses.USDC, feeRecipient, {
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
    depositCollateralAmount.toString(),
  )

  if (!status) {
    throw new Error(`Creating ${strategy} position failed`)
  }

  const feeWalletBalanceAfter = await balanceOf(dependencies.addresses.USDC, feeRecipient, {
    config,
  })

  let getPosition
  type AccountFactory = { accountFactory?: string | undefined }
  if (dependencies.protocol.version === AaveVersion.v3) {
    const addresses = dependencies.addresses as AAVEV3StrategyAddresses & AccountFactory
    getPosition = async () => {
      return await strategies.aave.v3.view(
        {
          collateralToken: tokens.ETH,
          debtToken: tokens.USDC,
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
  }
  if (dependencies.protocol.version === AaveVersion.v2) {
    const addresses = dependencies.addresses as AAVEStrategyAddresses & AccountFactory
    getPosition = async () => {
      return await strategies.aave.v2.view(
        {
          collateralToken: tokens.ETH,
          debtToken: tokens.USDC,
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
  }

  if (!getPosition) throw new Error('getPosition is not defined')

  return {
    proxy: proxy,
    getPosition,
    variant: strategy,
    strategy,
    collateralToken: tokens.ETH,
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
