import { SystemKeys, Tokens } from '@deploy-configurations/types/deployment-config'
import { Address, Tx } from '@dma-common/types'
import { Strategy } from '@dma-library/types'
import { WithMigrationStrategyDependencies } from '@dma-library/types/strategy-params'
import { IPosition } from '@domain'

import { getAddresses } from './helpers/aave-like'
import { migrateAaveStrategy } from './protocols/aave'
import { migrateSparkStrategy } from './protocols/spark'

export enum PositionSource {
  DS_PROXY = 'dsProxy',
  LITTLE_FROGGY = 'littleFroggy',
  EOA = 'eoa',
}
export type MigrationArgs = {
  collateralToken: { symbol: Tokens; precision: number; address: Address }
  debtToken: { symbol: Tokens; precision: number; address: Address }
  protocol: SystemKeys
  positionSource: PositionSource
  sourceAddress: Address
}

export type MigrationStrategy = (
  args: MigrationArgs,
  dependencies: WithMigrationStrategyDependencies,
) => Promise<{ migration: Strategy<IPosition>; approval: Tx }>

/**
 * Migrates a position from source to target destination.
 *
 * @param args - The migration arguments.
 *   - collateralToken: The token used as collateral in the position. It includes the symbol (a value from the Tokens enum), precision (a number), and address (a string representing the Ethereum address of the token).
 *   - debtToken: The token used as debt in the position. It includes the symbol (a value from the Tokens enum), precision (a number), and address (a string representing the Ethereum address of the token).
 *   - protocol: The protocol of the migrated position (a value from the SystemKeys enum).
 *   - positionSource: The source of the position, indicating if the position is owned by an EOA directly or through a proxy (a value from the PositionSource enum).
 *   - sourceAddress: The address of the position source, either a proxy or an EOA (a string representing the Ethereum address).
 * @param dependencies - The dependencies required for the migration.
 *   - provider: An ethers provider.
 *   - operationExecutor: An optional string representing the Ethereum address of the OperationExecutor to override.
 *   - proxy: A string representing the Ethereum address of the dpm account, which is the target of the migration.
 *   - user: A string representing the Ethereum address of the user, who is the owner of the position.
 *   - network: A string representing the network (e.g., 'mainnet').
 * @returns A promise that resolves to the migrated position strategy.
 * @throws An error if the protocol is unsupported.
 */
export const migrate: MigrationStrategy = async (
  args: MigrationArgs,
  dependencies: WithMigrationStrategyDependencies,
): Promise<{ migration: Strategy<IPosition>; approval: Tx }> => {
  // common fields
  const addresses = getAddresses(dependencies.network)
  const sourceAddress = args.positionSource === 'dsProxy' ? args.sourceAddress : dependencies.user
  const flashloanTokenAddress =
    args.collateralToken.address === addresses.common.ETH
      ? addresses.common.WETH
      : args.collateralToken.address
  const operationExecutor = dependencies.operationExecutor
    ? dependencies.operationExecutor
    : addresses.mpa.core.OperationExecutor

  switch (args.protocol) {
    case 'aave': {
      return await migrateAaveStrategy(
        dependencies,
        args,
        sourceAddress,
        flashloanTokenAddress,
        operationExecutor,
      )
    }
    // case 'spark': {
    //   return await migrateSparkStrategy(
    //     dependencies,
    //     args,
    //     sourceAddress,
    //     flashloanTokenAddress,
    //     operationExecutor,
    //   )
    // }
    default:
      throw new Error('Unsupported protocol')
  }
}
