import { AaveVersion, strategies } from '@dma-library'
import { aaveV3UniqueContractName } from '@dma-library/protocols/aave/config'
import {
  AaveV2OpenDependencies,
  AaveV3OpenDependencies,
} from '@dma-library/strategies/aave/open/open'
import { amountToWei, balanceOf } from '@oasisdex/dma-common/utils/common'
import { executeThroughDPMProxy, executeThroughProxy } from '@oasisdex/dma-common/utils/execute'
import { Network } from '@oasisdex/dma-common/utils/network'
import { RuntimeConfig } from '@oasisdex/dma-common/utils/types/common'
import { DeploymentSystem } from '@oasisdex/dma-contracts/scripts/deployment20/deploy'
import { RiskRatio } from '@oasisdex/domain/src'
import BigNumber from 'bignumber.js'

import { PositionDetails } from '../types'
import { AaveV3PositionStrategy } from '../types/positionDetails'
import { StrategyDependenciesAaveV3 } from '../types/strategiesDependencies'
import {
  EMODE_MULTIPLE,
  ETH,
  MULTIPLE,
  SLIPPAGE,
  UNISWAP_TEST_SLIPPAGE,
  USDC,
  WSTETH,
} from './common'
import { OpenPositionTypes } from './openPositionTypes'

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

export async function createWstEthEthEarnAAVEPosition({
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
  dependencies: StrategyDependenciesAaveV3
  config: RuntimeConfig & { ds: DeploymentSystem; network: Network }
}): Promise<PositionDetails> {
  const strategy: AaveV3PositionStrategy = 'WSTETH/ETH Earn'
  const isOptimism = config.network === Network.OPT_MAINNET

  if (use1inch && !swapAddress) throw new Error('swapAddress is required when using 1inch')

  const tokens = {
    WSTETH: new WSTETH(dependencies.addresses),
    ETH: new USDC(dependencies.addresses),
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

  const feeRecipient = config.ds.config?.common.FeeRecipient.address
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
