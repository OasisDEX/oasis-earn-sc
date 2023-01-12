import { strategies } from '@oasisdex/oasis-actions'
import BigNumber from 'bignumber.js'

import { executeThroughDPMProxy, executeThroughProxy } from '../../../helpers/deploy'
import { RuntimeConfig } from '../../../helpers/types/common'
import { amountToWei, approve } from '../../../helpers/utils'
import { AavePositionStrategy, PositionDetails, StrategiesDependencies } from '../types'
import { OpenPositionTypes } from './openPositionTypes'

const debtToken = { symbol: 'USDC' as const, precision: 6 }
const collateralToken = { symbol: 'WBTC' as const, precision: 8 }
const amountInBaseUnit = amountToWei(new BigNumber(2), collateralToken.precision)

async function getWbtcUsdcMultiplyAAVEPosition(dependencies: OpenPositionTypes[1]) {
  const args: OpenPositionTypes[0] = {
    collateralToken: collateralToken,
    debtToken: debtToken,
    slippage: new BigNumber(0.1),
    depositedByUser: {
      collateralToken: {
        amountInBaseUnit,
      },
    },
    multiple: new BigNumber(1.5),
    positionType: 'Multiply',
    collectSwapFeeFrom: 'sourceToken',
  }

  return await strategies.aave.open(args, dependencies)
}

export async function createWbtcUsdcMultiplyAAVEPosition(
  proxy: string,
  isDPM: boolean,
  dependencies: StrategiesDependencies,
  config: RuntimeConfig,
  getTokens: (symbol: 'WBTC', amount: string) => Promise<boolean>,
): Promise<PositionDetails> {
  const strategy: AavePositionStrategy = 'WBTC/USDC Multiply'

  const position = await getWbtcUsdcMultiplyAAVEPosition({
    ...dependencies,
    isDPMProxy: isDPM,
    proxy: proxy,
  })

  await getTokens('WBTC', amountInBaseUnit.toString())

  await approve(dependencies.addresses.WBTC, proxy, amountInBaseUnit, config, false)

  const proxyFunction = isDPM ? executeThroughDPMProxy : executeThroughProxy

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

  return {
    proxy: proxy,
    getPosition: async () => {
      return await strategies.aave.view(
        {
          collateralToken,
          debtToken,
          proxy: proxy,
        },
        {
          addresses: {
            ...dependencies.addresses,
            operationExecutor: dependencies.contracts.operationExecutor.address,
          },
          provider: config.provider,
        },
      )
    },
    strategy,
  }
}
