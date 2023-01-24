import { strategies } from '@oasisdex/oasis-actions'
import BigNumber from 'bignumber.js'

import { executeThroughDPMProxy, executeThroughProxy } from '../../../helpers/deploy'
import { RuntimeConfig } from '../../../helpers/types/common'
import { amountToWei } from '../../../helpers/utils'
import { AavePositionStrategy, PositionDetails, StrategiesDependencies } from '../types'
import { OpenPositionTypes } from './openPositionTypes'

async function getEthUsdcMultiplyAAVEPosition(dependencies: OpenPositionTypes[1]) {
  const debtToken = { symbol: 'USDC' as const, precision: 6 }
  const collateralToken = { symbol: 'ETH' as const, precision: 18 }

  const args: OpenPositionTypes[0] = {
    collateralToken: collateralToken,
    debtToken: debtToken,
    slippage: new BigNumber(0.1),
    depositedByUser: {
      collateralToken: {
        amountInBaseUnit: amountToWei(new BigNumber(10), collateralToken.precision),
      },
    },
    multiple: new BigNumber(1.5),
    positionType: 'Multiply',
  }

  return await strategies.aave.open(args, dependencies)
}

export async function createEthUsdcMultiplyAAVEPosition(
  proxy: string,
  isDPM: boolean,
  dependencies: StrategiesDependencies,
  config: RuntimeConfig,
): Promise<PositionDetails> {
  const strategy: AavePositionStrategy = 'ETH/USDC Multiply'

  const position = await getEthUsdcMultiplyAAVEPosition({
    ...dependencies,
    isDPMProxy: isDPM,
    proxy: proxy,
  })

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
    amountToWei(new BigNumber(10), position.simulation.position.collateral.precision).toString(),
  )

  if (!status) {
    throw new Error(`Creating ${strategy} position failed`)
  }

  return {
    proxy: proxy,
    getPosition: async () => {
      return await strategies.aave.view(
        {
          collateralToken: { symbol: 'ETH' as const, precision: 18 },
          debtToken: { symbol: 'USDC' as const, precision: 6 },
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
