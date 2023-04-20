import { addressesByNetwork } from '@oasisdex/dma-common/test-utils'
import { RuntimeConfig } from '@oasisdex/dma-common/types/common'
import { amountToWei, approve, balanceOf } from '@oasisdex/dma-common/utils/common'
import { executeThroughDPMProxy, executeThroughProxy } from '@oasisdex/dma-common/utils/execute'
import { Network } from '@oasisdex/dma-deployments/types/network'
import { AaveVersion, strategies } from '@oasisdex/dma-library'
import {
  aaveV2UniqueContractName,
  aaveV3UniqueContractName,
} from '@oasisdex/dma-library/protocols/aave'
import {
  AaveV2OpenDependencies,
  AaveV3OpenDependencies,
} from '@oasisdex/dma-library/src/strategies/aave/open/open'
import { RiskRatio } from '@oasisdex/domain'
import BigNumber from 'bignumber.js'

import { AavePositionStrategy, PositionDetails, StrategiesDependencies } from '../types'
import { ETH, MULTIPLE, SLIPPAGE, UNISWAP_TEST_SLIPPAGE, USDC, WBTC } from './common'
import { OpenPositionTypes } from './open-position-types'

const mainnetAddresses = addressesByNetwork(Network.MAINNET)
const amountInBaseUnit = amountToWei(new BigNumber(0.1), WBTC.precision)
const wBTCtoSteal = amountToWei(new BigNumber(2), WBTC.precision)
const WETHtoSwap = amountToWei(new BigNumber(2), ETH.precision)

async function openWbtcUsdcMultiplyAAVEPosition(
  slippage: BigNumber,
  dependencies: OpenPositionTypes[1],
) {
  const args: OpenPositionTypes[0] = {
    collateralToken: WBTC,
    debtToken: USDC,
    slippage,
    depositedByUser: {
      collateralToken: {
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

export async function wbtcUsdcMultiplyAavePosition({
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
  dependencies: StrategiesDependencies
  config: RuntimeConfig
  getTokens: (symbol: 'WBTC', amount: BigNumber) => Promise<boolean>
}): Promise<PositionDetails | null> {
  const strategy: AavePositionStrategy = 'WBTC/USDC Multiply'

  if (use1inch && !swapAddress) throw new Error('swapAddress is required when using 1inch')

  const mockPrice = new BigNumber(22842.53)
  const getSwapData = use1inch
    ? dependencies.getSwapData(swapAddress)
    : dependencies.getSwapData(mockPrice, {
        from: USDC.precision,
        to: WBTC.precision,
      })

  const position = await openWbtcUsdcMultiplyAAVEPosition(
    use1inch ? SLIPPAGE : UNISWAP_TEST_SLIPPAGE,
    {
      ...dependencies,
      getSwapData,
      isDPMProxy: isDPM,
      proxy: proxy,
    },
  )

  // We're using uniswap to acquire tokens on recent blocks
  // And impersonation on fixed test blocks
  const amountToGet = use1inch ? WETHtoSwap : wBTCtoSteal
  await getTokens('WBTC', amountToGet)

  await approve(WBTC.address, proxy, amountInBaseUnit, config, false)

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

  let getPosition
  if (
    dependencies.protocol.version === AaveVersion.v3 &&
    aaveV3UniqueContractName in dependencies.addresses
  ) {
    const addresses = dependencies.addresses

    getPosition = async () => {
      return await strategies.aave.v3.view(
        {
          collateralToken: WBTC,
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
  }
  if (
    dependencies.protocol.version === AaveVersion.v2 &&
    aaveV2UniqueContractName in dependencies.addresses
  ) {
    const addresses = dependencies.addresses
    getPosition = async () => {
      return await strategies.aave.v2.view(
        {
          collateralToken: WBTC,
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
  }

  if (!getPosition) throw new Error('getPosition is not defined')

  return {
    proxy: proxy,
    getPosition,
    strategy,
    collateralToken: WBTC,
    debtToken: new USDC(dependencies.addresses),
    getSwapData,
    __positionType: 'Multiply',
    __mockPrice: mockPrice,
    __openPositionSimulation: position.simulation,
    __feeWalletBalanceChange: feeWalletBalanceAfter.minus(feeWalletBalanceBefore),
  }
}
