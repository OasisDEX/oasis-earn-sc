import { strategies } from '@oasisdex/oasis-actions'
import BigNumber from 'bignumber.js'

import { executeThroughDPMProxy, executeThroughProxy } from '../../../helpers/deploy'
import { RuntimeConfig } from '../../../helpers/types/common'
import { amountToWei, approve } from '../../../helpers/utils'
import { mainnetAddresses } from '../../addresses'
import { AavePositionStrategy, PositionDetails, StrategiesDependencies } from '../types'
import { MULTIPLE, SLIPPAGE, STETH, USDC } from './common'
import { OpenPositionTypes } from './openPositionTypes'

const amountInBaseUnit = amountToWei(new BigNumber(100), STETH.precision)

async function getStEthUsdcMultiplyAAVEPosition(dependencies: OpenPositionTypes[1]) {
  const args: OpenPositionTypes[0] = {
    collateralToken: STETH,
    debtToken: USDC,
    slippage: SLIPPAGE,
    depositedByUser: {
      collateralToken: {
        amountInBaseUnit,
      },
    },
    multiple: MULTIPLE,
    positionType: 'Multiply',
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

  const getSwapData = dependencies.getSwapData(new BigNumber(1217.85), {
    from: USDC.precision,
    to: STETH.precision,
  })

  const position = await getStEthUsdcMultiplyAAVEPosition({
    ...dependencies,
    getSwapData,
    isDPMProxy: isDPM,
    proxy: proxy,
  })

  await getTokens('STETH', amountInBaseUnit.toString())

  await approve(mainnetAddresses.STETH, proxy, amountInBaseUnit, config)

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
          collateralToken: STETH,
          debtToken: USDC,
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
    collateralToken: STETH,
    debtToken: USDC,
    getSwapData,
  }
}
