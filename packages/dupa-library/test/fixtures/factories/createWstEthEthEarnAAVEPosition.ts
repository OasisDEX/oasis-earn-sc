import { AaveVersion, ADDRESSES, RiskRatio, strategies } from '@dupa-library'
import {
  AaveV2OpenDependencies,
  AaveV3OpenDependencies,
} from '@dupa-library/strategies/aave/open/open'
import { executeThroughDPMProxy, executeThroughProxy } from '@oasisdex/dupa-common/utils/deploy'
import { RuntimeConfig } from '@oasisdex/dupa-common/utils/types/common'
import { amountToWei, balanceOf } from '@oasisdex/dupa-common/utils/utils'
import BigNumber from 'bignumber.js'

import {
  aaveV2UniqueContractName,
  aaveV3UniqueContractName,
} from '../../../src/protocols/aave/config'
import { PositionDetails, StrategiesDependencies } from '../types'
import { AaveV3PositionStrategy } from '../types/positionDetails'
import { EMODE_MULTIPLE, ETH, SLIPPAGE, UNISWAP_TEST_SLIPPAGE, WSTETH } from './common'
import { OpenPositionTypes } from './openPositionTypes'

const transactionAmount = amountToWei(new BigNumber(2), ETH.precision)

async function openWstEthEthEarnAAVEPosition(
  slippage: BigNumber,
  dependencies: OpenPositionTypes[1],
) {
  const args: OpenPositionTypes[0] = {
    collateralToken: WSTETH,
    debtToken: ETH,
    slippage,
    depositedByUser: {
      debtToken: {
        amountInBaseUnit: transactionAmount,
      },
    },
    multiple: new RiskRatio(EMODE_MULTIPLE, RiskRatio.TYPE.MULITPLE),
    positionType: 'Earn',
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

export async function createWstEthEthEarnAAVEPosition({
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
  const strategy: AaveV3PositionStrategy = 'WSTETH/ETH Earn'

  if (use1inch && !swapAddress) throw new Error('swapAddress is required when using 1inch')

  const mockPrice = new BigNumber(0.9)
  const getSwapData = use1inch
    ? dependencies.getSwapData(swapAddress)
    : dependencies.getSwapData(mockPrice, {
        from: ETH.precision,
        to: WSTETH.precision,
      })

  const position = await openWstEthEthEarnAAVEPosition(
    use1inch ? SLIPPAGE : UNISWAP_TEST_SLIPPAGE,
    {
      ...dependencies,
      getSwapData,
      isDPMProxy: isDPM,
      proxy: proxy,
    },
  )

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
    getPosition = async () => {
      return await strategies.aave.v3.view(
        {
          collateralToken: WSTETH,
          debtToken: ETH,
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
          collateralToken: WSTETH,
          debtToken: ETH,
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
    proxy,
    getPosition,
    strategy: 'WSTETH/ETH Earn',
    collateralToken: WSTETH,
    debtToken: ETH,
    getSwapData,
    __positionType: 'Earn',
    __mockPrice: mockPrice,
    __openPositionSimulation: position.simulation,
    __feeWalletBalanceChange: feeWalletBalanceAfter.minus(feeWalletBalanceBefore),
  }
}
