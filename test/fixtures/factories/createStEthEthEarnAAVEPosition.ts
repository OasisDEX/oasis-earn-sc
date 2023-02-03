import { AaveVersion, ADDRESSES, RiskRatio, strategies } from '@oasisdex/oasis-actions/src'
import BigNumber from 'bignumber.js'

import { executeThroughDPMProxy, executeThroughProxy } from '../../../helpers/deploy'
import { RuntimeConfig } from '../../../helpers/types/common'
import { amountToWei, balanceOf } from '../../../helpers/utils'
import {
  aaveV2UniqueContractName,
  aaveV3UniqueContractName,
} from '../../../packages/oasis-actions/src/protocols/aave/config'
import { AavePositionStrategy, PositionDetails, StrategiesDependencies } from '../types'
import { ETH, MULTIPLE, SLIPPAGE, STETH } from './common'
import { OpenPositionTypes } from './openPositionTypes'

const transactionAmount = amountToWei(new BigNumber(2), ETH.precision)

async function openStEthEthEarnAAVEPosition(dependencies: OpenPositionTypes[1]) {
  const args: OpenPositionTypes[0] = {
    collateralToken: STETH,
    debtToken: ETH,
    slippage: SLIPPAGE,
    depositedByUser: {
      debtToken: {
        amountInBaseUnit: transactionAmount,
      },
    },
    multiple: new RiskRatio(MULTIPLE, RiskRatio.TYPE.MULITPLE),
    positionType: 'Earn',
  }

  return await strategies.aave.open(args, dependencies)
}

export async function createStEthEthEarnAAVEPosition({
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
  const strategy: AavePositionStrategy = 'STETH/ETH Earn'

  if (use1inch && !swapAddress) throw new Error('swapAddress is required when using 1inch')

  const getSwapData = use1inch
    ? dependencies.getSwapData(swapAddress)
    : dependencies.getSwapData(new BigNumber(0.979), {
        from: STETH.precision,
        to: ETH.precision,
      })

  const position = await openStEthEthEarnAAVEPosition({
    ...dependencies,
    getSwapData,
    isDPMProxy: isDPM,
    proxy: proxy,
  })

  const proxyFunction = isDPM ? executeThroughDPMProxy : executeThroughProxy

  const feeWalletBalanceBefore = await balanceOf(ADDRESSES.main.WETH, ADDRESSES.main.feeRecipient, {
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
    transactionAmount.toString(),
  )

  if (!status) {
    throw new Error(`Creating ${strategy} position failed`)
  }

  const feeWalletBalanceAfter = await balanceOf(ADDRESSES.main.WETH, ADDRESSES.main.feeRecipient, {
    config,
  })

  let getPosition
  if (
    dependencies.protocol.version === AaveVersion.v3 &&
    aaveV3UniqueContractName in dependencies.addresses
  ) {
    const addresses = dependencies.addresses
    const protocolVersion = dependencies.protocol.version
    getPosition = async () => {
      return await strategies.aave.view(
        {
          collateralToken: STETH,
          debtToken: ETH,
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
      return await strategies.aave.view(
        {
          collateralToken: STETH,
          debtToken: ETH,
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
    strategy: 'STETH/ETH Earn',
    collateralToken: STETH,
    debtToken: ETH,
    getSwapData,
    __openPositionSimulation: position.simulation,
    __feeWalletBalanceChange: feeWalletBalanceAfter.minus(feeWalletBalanceBefore),
  }
}
