import { AaveVersion, RiskRatio, strategies } from '@dupa-library'
import {
  AaveV2OpenDependencies,
  AaveV3OpenDependencies,
} from '@dupa-library/strategies/aave/open/open'
import { executeThroughDPMProxy, executeThroughProxy } from '@oasisdex/dupa-common/utils/execute'
import { RuntimeConfig } from '@oasisdex/dupa-common/utils/types/common'
import { amountToWei, approve, balanceOf } from '@oasisdex/dupa-common/utils/common'
import BigNumber from 'bignumber.js'

import {
  aaveV2UniqueContractName,
  aaveV3UniqueContractName,
} from '@dupa-library/protocols/aave/config'
import { mainnetAddresses } from '../../addresses'
import { AavePositionStrategy, PositionDetails, StrategiesDependencies } from '../types'
import { ETH, MULTIPLE, SLIPPAGE, UNISWAP_TEST_SLIPPAGE, USDC, WBTC } from './common'
import { OpenPositionTypes } from './openPositionTypes'

const amountInBaseUnit = amountToWei(new BigNumber(0.5), WBTC.precision)
const wBTCtoSteal = amountToWei(new BigNumber(2), WBTC.precision)
const WETHtoSwap = amountToWei(new BigNumber(20), ETH.precision)

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

export async function createWbtcUsdcMultiplyAAVEPosition({
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
}): Promise<PositionDetails> {
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
    debtToken: USDC,
    getSwapData,
    __positionType: 'Multiply',
    __mockPrice: mockPrice,
    __openPositionSimulation: position.simulation,
    __feeWalletBalanceChange: feeWalletBalanceAfter.minus(feeWalletBalanceBefore),
  }
}
