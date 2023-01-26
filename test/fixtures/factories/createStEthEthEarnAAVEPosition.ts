import { strategies } from '@oasisdex/oasis-actions'
import BigNumber from 'bignumber.js'

import { executeThroughDPMProxy, executeThroughProxy } from '../../../helpers/deploy'
import { RuntimeConfig } from '../../../helpers/types/common'
import { amountToWei } from '../../../helpers/utils'
import { AavePositionStrategy, PositionDetails, StrategiesDependencies } from '../types'
import { ETH, MULTIPLE, SLIPPAGE, STETH } from './common'
import { OpenPositionTypes } from './openPositionTypes'

const transactionAmount = amountToWei(new BigNumber(2), ETH.precision)

async function getStEthEthEarnAAVEPosition(dependencies: OpenPositionTypes[1]) {
  const args: OpenPositionTypes[0] = {
    collateralToken: STETH,
    debtToken: ETH,
    slippage: SLIPPAGE,
    depositedByUser: {
      debtToken: {
        amountInBaseUnit: transactionAmount,
      },
    },
    multiple: MULTIPLE,
    positionType: 'Earn',
  }

  return await strategies.aave.open(args, dependencies)
}

export async function createStEthEthEarnAAVEPosition(
  proxy: string,
  isDPM: boolean,
  dependencies: StrategiesDependencies,
  config: RuntimeConfig,
): Promise<PositionDetails> {
  const strategy: AavePositionStrategy = 'STETH/ETH Earn'

  const getSwapData = dependencies.getSwapData(new BigNumber(0.979), {
    from: STETH.precision,
    to: ETH.precision,
  })

  const stEthEthEarnAAVEPosition = await getStEthEthEarnAAVEPosition({
    ...dependencies,
    getSwapData,
    isDPMProxy: isDPM,
    proxy: proxy,
  })

  const proxyFunction = isDPM ? executeThroughDPMProxy : executeThroughProxy

  const [status] = await proxyFunction(
    proxy,
    {
      address: dependencies.contracts.operationExecutor.address,
      calldata: dependencies.contracts.operationExecutor.interface.encodeFunctionData('executeOp', [
        stEthEthEarnAAVEPosition.transaction.calls,
        stEthEthEarnAAVEPosition.transaction.operationName,
      ]),
    },
    config.signer,
    transactionAmount.toString(),
  )

  if (!status) {
    throw new Error(`Creating ${strategy} position failed`)
  }

  return {
    proxy: proxy,
    getPosition: async () => {
      return await strategies.aave.view(
        {
          collateralToken: STETH,
          debtToken: ETH,
          proxy,
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
    strategy: 'STETH/ETH Earn',
    collateralToken: STETH,
    debtToken: ETH,
    getSwapData,
  }
}
