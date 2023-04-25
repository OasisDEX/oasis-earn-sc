import { balanceOf } from '@dma-common/utils/balances'
import { executeThroughDPMProxy, executeThroughProxy } from '@dma-common/utils/execute'
import { ONE } from '@oasisdex/dma-common/constants'
import { RuntimeConfig } from '@oasisdex/dma-common/types/common'
import { amountToWei } from '@oasisdex/dma-common/utils/common'
import { AaveVersion, strategies } from '@oasisdex/dma-library'
import {
  aaveV2UniqueContractName,
  aaveV3UniqueContractName,
} from '@oasisdex/dma-library/lib/cjs/protocols/aave'
import {
  AaveV2OpenDependencies,
  AaveV3OpenDependencies,
} from '@oasisdex/dma-library/lib/cjs/strategies/aave/open/open'
import { RiskRatio } from '@oasisdex/domain'
import BigNumber from 'bignumber.js'

import { AavePositionStrategy, PositionDetails, StrategiesDependencies } from '../types'
import { ETH, MULTIPLE, SLIPPAGE, UNISWAP_TEST_SLIPPAGE, USDC } from './common'
import { OpenPositionTypes } from './open-position-types'

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
}: {
  proxy: string
  isDPM: boolean
  use1inch: boolean
  swapAddress?: string
  dependencies: StrategiesDependencies
  config: RuntimeConfig
  feeRecipient: string
}): Promise<PositionDetails> {
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
  if (
    dependencies.protocol.version === AaveVersion.v3 &&
    aaveV3UniqueContractName in dependencies.addresses
  ) {
    const addresses = dependencies.addresses

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
  if (
    dependencies.protocol.version === AaveVersion.v2 &&
    aaveV2UniqueContractName in dependencies.addresses
  ) {
    const addresses = dependencies.addresses
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
    strategy,
    collateralToken: tokens.ETH,
    debtToken: tokens.USDC,
    getSwapData,
    __positionType: 'Multiply',
    __mockPrice: mockPrice,
    __openPositionSimulation: position.simulation,
    __feeWalletBalanceChange: feeWalletBalanceAfter.minus(feeWalletBalanceBefore),
  }
}
