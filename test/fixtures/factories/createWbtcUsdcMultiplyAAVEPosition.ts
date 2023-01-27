import { strategies } from '@oasisdex/oasis-actions'
import BigNumber from 'bignumber.js'

import { executeThroughDPMProxy, executeThroughProxy } from '../../../helpers/deploy'
import { RuntimeConfig } from '../../../helpers/types/common'
import { amountToWei, approve } from '../../../helpers/utils'
import { AavePositionStrategy, PositionDetails, StrategiesDependencies } from '../types'
import { MULTIPLE, SLIPPAGE, USDC, WBTC } from './common'
import { OpenPositionTypes } from './openPositionTypes'

const amountInBaseUnit = amountToWei(new BigNumber(10), WBTC.precision)

async function getWbtcUsdcMultiplyAAVEPosition(dependencies: OpenPositionTypes[1]) {
  const args: OpenPositionTypes[0] = {
    collateralToken: WBTC,
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

export async function createWbtcUsdcMultiplyAAVEPosition(
  proxy: string,
  isDPM: boolean,
  dependencies: StrategiesDependencies,
  config: RuntimeConfig,
  getTokens: (symbol: 'WBTC', amount: string) => Promise<boolean>,
): Promise<PositionDetails> {
  const strategy: AavePositionStrategy = 'WBTC/USDC Multiply'

  const getSwapData = dependencies.getSwapData(new BigNumber(22842.53), {
    from: USDC.precision,
    to: WBTC.precision,
  })

  const position = await getWbtcUsdcMultiplyAAVEPosition({
    ...dependencies,
    getSwapData,
    isDPMProxy: isDPM,
    proxy: proxy,
  })

  await getTokens('WBTC', amountInBaseUnit.toString())

  await approve(WBTC.address, proxy, amountInBaseUnit, config, false)

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
          collateralToken: WBTC,
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
    collateralToken: WBTC,
    debtToken: USDC,
    getSwapData,
  }
}
