import { Address } from '@deploy-configurations/types/address'
import { Network } from '@deploy-configurations/types/network'
import { RuntimeConfig } from '@dma-common/types/common'
import { balanceOf } from '@dma-common/utils/balances'
import { amountToWei } from '@dma-common/utils/common'
import { executeThroughDPMProxy, executeThroughProxy } from '@dma-common/utils/execute'
import {
  AavePositionDetails,
  AaveV3PositionStrategy,
  StrategyDependenciesAaveV3,
} from '@dma-contracts/test/fixtures'
import { AaveVersion, strategies } from '@dma-library'
import { aaveV3UniqueContractName } from '@dma-library/protocols/aave'
import {
  AaveV2OpenDependencies,
  AaveV3OpenDependencies,
} from '@dma-library/strategies/aave/open/open'
import { RiskRatio } from '@domain'
import BigNumber from 'bignumber.js'

import { OpenPositionTypes } from './aave/open-position-types'
import { EMODE_MULTIPLE, ETH, MULTIPLE, SLIPPAGE, UNISWAP_TEST_SLIPPAGE, WSTETH } from './common'

const transactionAmount = amountToWei(new BigNumber(1), ETH.precision)

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
}): Promise<AavePositionDetails> {
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
    variant: strategy,
    collateralToken: tokens.WSTETH,
    debtToken: tokens.ETH,
    getSwapData,
    __positionType: 'Earn',
    __mockPrice: mockPrice,
    __mockMarketPrice: mockPrice,
    __openPositionSimulation: position.simulation,
    __feeWalletBalanceChange: feeWalletBalanceAfter.minus(feeWalletBalanceBefore),
    __feesCollected: feeWalletBalanceAfter.minus(feeWalletBalanceBefore),
  }
}
