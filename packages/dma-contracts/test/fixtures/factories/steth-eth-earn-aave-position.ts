import { ADDRESSES } from '@oasisdex/addresses'
import { RuntimeConfig } from '@oasisdex/dma-common/types/common'
import { amountToWei, balanceOf } from '@oasisdex/dma-common/utils/common'
import { executeThroughDPMProxy, executeThroughProxy } from '@oasisdex/dma-common/utils/execute'
import { Network } from '@oasisdex/dma-deployments/types/network'
import { AaveVersion, strategies } from '@oasisdex/dma-library'
import {
  aaveV2UniqueContractName,
  aaveV3UniqueContractName,
} from '@oasisdex/dma-library/src/protocols/aave'
import {
  AaveV2OpenDependencies,
  AaveV3OpenDependencies,
} from '@oasisdex/dma-library/src/strategies/aave/open/open'
import { RiskRatio } from '@oasisdex/domain'
import BigNumber from 'bignumber.js'

import { AavePositionStrategy, PositionDetails, StrategiesDependencies } from '../types'
import { ETH, MULTIPLE, STETH, UNISWAP_TEST_SLIPPAGE } from './common'
import { OpenPositionTypes } from './open-position-types'

const transactionAmount = amountToWei(new BigNumber(2), ETH.precision)

async function openStEthEthEarnAAVEPosition(
  slippage: BigNumber,
  dependencies: OpenPositionTypes[1],
) {
  const args: OpenPositionTypes[0] = {
    collateralToken: STETH,
    debtToken: ETH,
    slippage,
    depositedByUser: {
      debtToken: {
        amountInBaseUnit: transactionAmount,
      },
    },
    multiple: new RiskRatio(MULTIPLE, RiskRatio.TYPE.MULITPLE),
    positionType: 'Earn',
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

export async function stethEthEarnAavePosition({
  proxy,
  isDPM,
  use1inch,
  swapAddress,
  dependencies,
  config,
}: {
  proxy: string
  isDPM: boolean
  use1inch: boolean
  swapAddress?: string
  dependencies: StrategiesDependencies
  config: RuntimeConfig
}): Promise<PositionDetails> {
  const strategy: AavePositionStrategy = 'STETH/ETH Earn'

  if (use1inch && !swapAddress) throw new Error('swapAddress is required when using 1inch')

  const mockPrice = new BigNumber(0.98634)
  const getSwapData = use1inch
    ? dependencies.getSwapData(swapAddress)
    : dependencies.getSwapData(mockPrice, {
        from: STETH.precision,
        to: ETH.precision,
      })

  // Just using high slippage for this pair on 1inch because seems to have issues otherwise
  const oneInchSlippage = new BigNumber(0.2)
  const position = await openStEthEthEarnAAVEPosition(
    use1inch ? oneInchSlippage : UNISWAP_TEST_SLIPPAGE,
    {
      ...dependencies,
      getSwapData,
      isDPMProxy: isDPM,
      proxy: proxy,
    },
  )

  const proxyFunction = isDPM ? executeThroughDPMProxy : executeThroughProxy

  const feeWalletBalanceBefore = await balanceOf(
    ADDRESSES[Network.MAINNET].common.WETH,
    ADDRESSES[Network.MAINNET].common.FeeRecipient,
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
    transactionAmount.toString(),
  )

  if (!status) {
    throw new Error(`Creating ${strategy} position failed`)
  }

  const feeWalletBalanceAfter = await balanceOf(
    ADDRESSES[Network.MAINNET].common.WETH,
    ADDRESSES[Network.MAINNET].common.FeeRecipient,
    {
      config,
    },
  )

  let getPosition
  if (
    dependencies.protocol.version === AaveVersion.v3 &&
    aaveV3UniqueContractName in dependencies.addresses
  ) {
    const addresses = dependencies.addresses
    getPosition = async () => {
      return await strategies.aave.v3.view(
        {
          collateralToken: STETH,
          debtToken: ETH,
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
          collateralToken: STETH,
          debtToken: ETH,
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
    strategy: 'STETH/ETH Earn',
    collateralToken: STETH,
    debtToken: new ETH(dependencies.addresses),
    getSwapData,
    __positionType: 'Earn',
    __mockPrice: mockPrice,
    __openPositionSimulation: position.simulation,
    __feeWalletBalanceChange: feeWalletBalanceAfter.minus(feeWalletBalanceBefore),
  }
}
