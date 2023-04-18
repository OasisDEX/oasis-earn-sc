import { StrategyDependenciesAaveV2 } from '@dma-contracts/test/fixtures/types/strategies-dependencies'
import { addressesByNetwork } from '@oasisdex/dma-common/test-utils/addresses'
import { Address } from '@oasisdex/dma-common/types/address'
import { RuntimeConfig } from '@oasisdex/dma-common/types/common'
import { amountToWei, balanceOf } from '@oasisdex/dma-common/utils/common'
import { Network } from '@oasisdex/dma-deployments/types/network'
import { AaveVersion, strategies } from '@oasisdex/dma-library'
import {
  AaveV2OpenDependencies,
  AaveV3OpenDependencies,
} from '@oasisdex/dma-library/strategies/aave/open/open'
import { RiskRatio } from '@oasisdex/domain'
import BigNumber from 'bignumber.js'
import { executeThroughDPMProxy, executeThroughProxy } from 'utils/execute'

import { AavePositionStrategy, PositionDetails } from '../types'
import { ETH, MULTIPLE, STETH, UNISWAP_TEST_SLIPPAGE } from './common'
import { OpenPositionTypes } from './open-position-types'

const transactionAmount = amountToWei(new BigNumber(2), ETH.precision)
const mainnetAddresses = addressesByNetwork(Network.MAINNET)

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
  feeRecipient,
}: {
  proxy: string
  isDPM: boolean
  use1inch: boolean
  swapAddress?: string
  dependencies: StrategyDependenciesAaveV2
  config: RuntimeConfig
  feeRecipient: Address
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

  if (!feeRecipient) throw new Error('FeeRecipient is not defined')
  const feeWalletBalanceBefore = await balanceOf(mainnetAddresses.WETH, feeRecipient, {
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

  const feeWalletBalanceAfter = await balanceOf(mainnetAddresses.WETH, feeRecipient, {
    config,
  })

  const addresses = dependencies.addresses
  const getPosition = async () => {
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

  if (!getPosition) throw new Error('getPosition is not defined')

  return {
    proxy: proxy,
    getPosition,
    strategy: 'STETH/ETH Earn',
    collateralToken: new STETH(dependencies.addresses),
    debtToken: new ETH(dependencies.addresses),
    getSwapData,
    __positionType: 'Earn',
    __mockPrice: mockPrice,
    __openPositionSimulation: position.simulation,
    __feeWalletBalanceChange: feeWalletBalanceAfter.minus(feeWalletBalanceBefore),
  }
}
