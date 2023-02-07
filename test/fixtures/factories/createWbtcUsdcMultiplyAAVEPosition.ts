import { AaveVersion, RiskRatio, strategies } from '@oasisdex/oasis-actions/src'
import {
  AaveV2OpenDependencies,
  AaveV3OpenDependencies,
} from '@oasisdex/oasis-actions/src/strategies/aave/open/open'
import BigNumber from 'bignumber.js'

import { executeThroughDPMProxy, executeThroughProxy } from '../../../helpers/deploy'
import { RuntimeConfig } from '../../../helpers/types/common'
import { amountToWei, approve, balanceOf } from '../../../helpers/utils'
import {
  aaveV2UniqueContractName,
  aaveV3UniqueContractName,
} from '../../../packages/oasis-actions/src/protocols/aave/config'
import { mainnetAddresses } from '../../addresses'
import { AavePositionStrategy, PositionDetails, StrategiesDependencies } from '../types'
import { ETH, MULTIPLE, SLIPPAGE, USDC, WBTC } from './common'
import { OpenPositionTypes } from './openPositionTypes'
const amountInBaseUnit = amountToWei(new BigNumber(1), WBTC.precision)
const wethToSwapToWBTC = amountToWei(new BigNumber(100), ETH.precision)

async function openWbtcUsdcMultiplyAAVEPosition(dependencies: OpenPositionTypes[1]) {
  const args: OpenPositionTypes[0] = {
    collateralToken: WBTC,
    debtToken: USDC,
    slippage: SLIPPAGE,
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

  const getSwapData = use1inch
    ? dependencies.getSwapData(swapAddress)
    : dependencies.getSwapData(new BigNumber(22842.53), {
        from: USDC.precision,
        to: WBTC.precision,
      })

  const position = await openWbtcUsdcMultiplyAAVEPosition({
    ...dependencies,
    getSwapData,
    isDPMProxy: isDPM,
    proxy: proxy,
  })

  await getTokens('WBTC', wethToSwapToWBTC)

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
    const protocolVersion = dependencies.protocol.version

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
          protocolVersion: protocolVersion,
        },
      )
    }
  }
  if (
    dependencies.protocol.version === AaveVersion.v2 &&
    aaveV2UniqueContractName in dependencies.addresses
  ) {
    const addresses = dependencies.addresses
    const protocolVersion = dependencies.protocol.version
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
          protocolVersion,
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
    __openPositionSimulation: position.simulation,
    __feeWalletBalanceChange: feeWalletBalanceAfter.minus(feeWalletBalanceBefore),
  }
}
