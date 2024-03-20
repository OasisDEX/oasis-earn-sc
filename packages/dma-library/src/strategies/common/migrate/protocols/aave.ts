import { DefaultDeployment } from '@deploy-configurations/addresses'
import { getAaveLikeSystemContracts } from '@dma-library/protocols/aave-like/utils'
import { AaveLikePosition, FlashloanProvider } from '@dma-library/types'
import { AaveVersion } from '@dma-library/types/aave/version'
import { WithMigrationStrategyDependencies } from '@dma-library/types/strategy-params'
import { encodeOperation } from '@dma-library/utils/operation'
import { getCurrentPositionAaveV3 } from '@dma-library/views/aave'
import { ethers } from 'ethers'

import { migrate as aaveMigarate } from '../../../../operations/aave/migrate/migrate'
import { getAaveLikeAddresses, getAddresses } from '../helpers/aave-like'
import { MigrationArgs, PositionSource } from '../migrate'

export async function migrateAaveStrategy(
  dependencies: WithMigrationStrategyDependencies,
  args: MigrationArgs,
  sourceAddress: string,
  flashloanTokenAddress: string,
  operationExecutor: string,
) {
  const addresses = getAddresses(dependencies.network)
  const aaveLikeAddresses = getAaveLikeAddresses(dependencies.network, args.protocol)
  const currentPosition = await getCurrentPositionAaveV3(
    {
      collateralToken: args.collateralToken,
      proxy: sourceAddress,
      debtToken: args.debtToken,
    },
    {
      addresses: aaveLikeAddresses,
      provider: dependencies.provider,
      protocolVersion: AaveVersion.v3,
    },
  )

  const { poolDataProvider: aaveLikePoolDataProvider } = await getAaveLikeSystemContracts(
    aaveLikeAddresses,
    dependencies.provider,
    'AAVE_V3',
  )

  const collateralReserveAaveData = await aaveLikePoolDataProvider.getReserveTokensAddresses(
    args.collateralToken.address,
  )
  const debtReserveAaveData = await aaveLikePoolDataProvider.getReserveTokensAddresses(
    args.debtToken.address,
  )

  const aTokenaddress = collateralReserveAaveData.aTokenAddress
  const variableDebtTokenAddress = debtReserveAaveData.variableDebtTokenAddress
  const flashloan = {
    provider: FlashloanProvider.Balancer,
    token: {
      address: flashloanTokenAddress,
      amount: currentPosition.collateral.amount,
    },
    // amount is deprecated
    amount: currentPosition.collateral.amount,
  }

  const operation = await aaveMigarate({
    aToken: { address: aTokenaddress, amount: currentPosition.collateral.amount },
    vdToken: { address: variableDebtTokenAddress },
    flashloan,
    debt: {
      address: args.debtToken.address,
      isEth: false,
    },
    addresses: aaveLikeAddresses,
    network: dependencies.network,
    positionType: 'Borrow',
    sourceAddress: sourceAddress,
    operationExecutor,
  })

  return {
    migration: {
      simulation: {
        swaps: [],
        targetPosition: currentPosition,
        position: currentPosition,
      },
      tx: {
        to: dependencies.proxy,
        data: encodeOperation(operation, {
          provider: dependencies.provider,
          operationExecutor,
        }),
        value: '0x0',
      },
    },
    approval: getAaveLikeApprovalTx(args, currentPosition, addresses, aTokenaddress, dependencies),
  }
}

function getAaveLikeApprovalTx(
  args: MigrationArgs,
  currentPosition: AaveLikePosition,
  addresses: DefaultDeployment,
  aTokenaddress: string,
  dependencies: WithMigrationStrategyDependencies,
) {
  console.log(args.sourceAddress)
  switch (args.positionSource) {
    case PositionSource.DS_PROXY: {
      const ABI = ['function approve(address _token,address _spender, uint _value)']
      const iface = new ethers.utils.Interface(ABI)
      const approvalData = iface.encodeFunctionData('approve', [
        aTokenaddress,
        dependencies.proxy,
        currentPosition.collateral.amount.times(1.01).toFixed(0), // approve 1% more to accoutn for interest accrual
      ])
      return {
        to: addresses.mpa.core.ERC20ProxyActions,
        data: approvalData,
        value: '0',
      }
    }
    case PositionSource.EOA: {
      const ABI = ['function approve(address _spender, uint _value)']
      const iface = new ethers.utils.Interface(ABI)
      const approvalData = iface.encodeFunctionData('approve', [
        dependencies.proxy,
        currentPosition.collateral.amount.times(1.01).toFixed(0), // approve 1% more to accoutn for interest accrual
      ])
      return {
        to: aTokenaddress,
        data: approvalData,
        value: '0',
      }
    }
    default:
      throw new Error('Unsupported position source')
  }
}
