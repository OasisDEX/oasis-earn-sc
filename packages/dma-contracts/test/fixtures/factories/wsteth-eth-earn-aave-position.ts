import { executeThroughDPMProxy, executeThroughProxy } from '@dma-common/utils/execute'
import { RuntimeConfig } from '@oasisdex/dma-common/types/common'
import { amountToWei, balanceOf } from '@oasisdex/dma-common/utils/common'
import { Address } from '@oasisdex/dma-deployments/types/address'
import { Network } from '@oasisdex/dma-deployments/types/network'
import { AaveVersion, strategies } from '@oasisdex/dma-library'
import { aaveV3UniqueContractName } from '@oasisdex/dma-library/src/protocols/aave/config'
import {
  AaveV2OpenDependencies,
  AaveV3OpenDependencies,
} from '@oasisdex/dma-library/src/strategies/aave/open/open'
import { RiskRatio } from '@oasisdex/domain'
import BigNumber from 'bignumber.js'

import { PositionDetails } from '../types'
import { EMODE_MULTIPLE, ETH, MULTIPLE, SLIPPAGE, UNISWAP_TEST_SLIPPAGE, WSTETH } from './common'
import { OpenPositionTypes } from './open-position-types'

const transactionAmount = amountToWei(new BigNumber(2), ETH.precision)

async function openWstEthEthEarnAAVEPosition(
  slippage: BigNumber,
  dependencies: OpenPositionTypes[1],
  multiple: BigNumber,
) {
  const args: OpenPositionTypes[0] = {
    collateralToken: WSTETH,
    debtToken: ETH,
    slippage,
    depositedByUser: {
      debtToken: {
        amountInBaseUnit: transactionAmount,
      },
    },
    multiple: new RiskRatio(multiple, RiskRatio.TYPE.MULITPLE),
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

export async function wstethEthEarnAavePosition({
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
  dependencies: StrategyDependenciesAaveV3
  config: RuntimeConfig & { network?: Network }
  feeRecipient: Address
}): Promise<PositionDetails> {
  const strategy: AaveV3PositionStrategy = 'WSTETH/ETH Earn'
  const isOptimism = config.network === Network.OPTIMISM

  if (use1inch && !swapAddress) throw new Error('swapAddress is required when using 1inch')

  const tokens = {
    WSTETH: new WSTETH(dependencies.addresses),
    ETH: new ETH(dependencies.addresses),
  }

  const mockPrice = new BigNumber(0.9)
  const getSwapData = use1inch
    ? dependencies.getSwapData(swapAddress)
    : dependencies.getSwapData(mockPrice, {
        from: ETH.precision,
        to: WSTETH.precision,
      })

  const position = await openWstEthEthEarnAAVEPosition(
    use1inch ? SLIPPAGE : UNISWAP_TEST_SLIPPAGE,
    {
      ...dependencies,
      getSwapData,
      isDPMProxy: isDPM,
      proxy: proxy,
    },
    // Emode doesn't appear to be working as expected on Optimism
    isOptimism ? MULTIPLE : EMODE_MULTIPLE,
  )

  const proxyFunction = isDPM ? executeThroughDPMProxy : executeThroughProxy

  if (!feeRecipient) throw new Error('feeRecipient is not set')
  const feeWalletBalanceBefore = await balanceOf(dependencies.addresses.ETH, feeRecipient, {
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
    transactionAmount.toString(),
  )

  if (!status) {
    throw new Error(`Creating ${strategy} position failed`)
  }

  const feeWalletBalanceAfter = await balanceOf(dependencies.addresses.ETH, feeRecipient, {
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
          collateralToken: WSTETH,
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
    proxy,
    getPosition,
    strategy: 'WSTETH/ETH Earn',
    collateralToken: tokens.WSTETH,
    debtToken: tokens.ETH,
    getSwapData,
    __positionType: 'Earn',
    __mockPrice: mockPrice,
    __openPositionSimulation: position.simulation,
    __feeWalletBalanceChange: feeWalletBalanceAfter.minus(feeWalletBalanceBefore),
  }
}
