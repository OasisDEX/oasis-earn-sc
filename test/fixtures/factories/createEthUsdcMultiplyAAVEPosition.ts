import { ADDRESSES, strategies } from '@oasisdex/oasis-actions/src'
import BigNumber from 'bignumber.js'

import { executeThroughDPMProxy, executeThroughProxy } from '../../../helpers/deploy'
import { RuntimeConfig } from '../../../helpers/types/common'
import { amountToWei, balanceOf } from '../../../helpers/utils'
import { AavePositionStrategy, PositionDetails, StrategiesDependencies } from '../types'
import { ETH, MULTIPLE, SLIPPAGE, USDC } from './common'
import { OpenPositionTypes } from './openPositionTypes'

const depositCollateralAmount = amountToWei(new BigNumber(10), ETH.precision)

async function getEthUsdcMultiplyAAVEPosition(dependencies: OpenPositionTypes[1]) {
  const args: OpenPositionTypes[0] = {
    collateralToken: ETH,
    debtToken: USDC,
    slippage: SLIPPAGE,
    depositedByUser: {
      collateralToken: {
        amountInBaseUnit: depositCollateralAmount,
      },
    },
    multiple: MULTIPLE,
    positionType: 'Multiply',
  }

  return await strategies.aave.open(args, dependencies)
}

export async function createEthUsdcMultiplyAAVEPosition({
  proxy,
  isDPM,
  use1inch,
  swapAddress,
  dependencies,
  config,
}: {
  proxy: string
  isDPM: boolean
  use1inch: boolean
  swapAddress?: string
  dependencies: StrategiesDependencies
  config: RuntimeConfig
}): Promise<PositionDetails> {
  const strategy: AavePositionStrategy = 'ETH/USDC Multiply'

  if (use1inch && !swapAddress) throw new Error('swapAddress is required when using 1inch')

  const getSwapData = use1inch
    ? dependencies.getSwapData(swapAddress)
    : dependencies.getSwapData(new BigNumber(1617.85), {
        from: USDC.precision,
        to: ETH.precision,
      })

  const position = await getEthUsdcMultiplyAAVEPosition({
    ...dependencies,
    getSwapData,
    isDPMProxy: isDPM,
    proxy: proxy,
  })

  const proxyFunction = isDPM ? executeThroughDPMProxy : executeThroughProxy

  const feeWalletBalanceBefore = await balanceOf(ADDRESSES.main.USDC, ADDRESSES.main.feeRecipient, {
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
    depositCollateralAmount.toString(),
  )

  if (!status) {
    throw new Error(`Creating ${strategy} position failed`)
  }

  const feeWalletBalanceAfter = await balanceOf(ADDRESSES.main.USDC, ADDRESSES.main.feeRecipient, {
    config,
  })

  return {
    proxy: proxy,
    getPosition: async () => {
      return await strategies.aave.view(
        {
          collateralToken: ETH,
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
    collateralToken: ETH,
    debtToken: USDC,
    getSwapData,
    __openPositionSimulation: position.simulation,
    __feeWalletBalanceChange: feeWalletBalanceAfter.minus(feeWalletBalanceBefore),
  }
}
