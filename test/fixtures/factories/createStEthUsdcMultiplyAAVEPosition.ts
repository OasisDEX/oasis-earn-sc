import { strategies } from '@oasisdex/oasis-actions'
import BigNumber from 'bignumber.js'

import { executeThroughDPMProxy, executeThroughProxy } from '../../../helpers/deploy'
import { RuntimeConfig } from '../../../helpers/types/common'
import { amountToWei, approve } from '../../../helpers/utils'
import { AavePositionStrategy, PositionDetails, StrategiesDependencies } from '../types'
import { OpenPositionTypes } from './openPositionTypes'

const debtToken = { symbol: 'USDC' as const, precision: 6 }
const collateralToken = { symbol: 'STETH' as const, precision: 18 }
const amountInBaseUnit = amountToWei(new BigNumber(10), collateralToken.precision)

async function getStEthUsdcMultiplyAAVEPosition(dependencies: OpenPositionTypes[1]) {
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

export async function createStEthUsdcMultiplyAAVEPosition(
  proxy: string,
  isDPM: boolean,
  dependencies: StrategiesDependencies,
  config: RuntimeConfig,
  getTokens: (symbol: 'STETH', amount: string) => Promise<boolean>,
): Promise<PositionDetails> {
  const strategy: AavePositionStrategy = 'STETH/USDC Multiply'

  const position = await getStEthUsdcMultiplyAAVEPosition({
    ...dependencies,
    isDPMProxy: isDPM,
    proxy: proxy,
  })

  await getTokens('STETH', amountInBaseUnit.toString())

  await approve(dependencies.addresses.STETH, proxy, amountInBaseUnit, config, false)

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
