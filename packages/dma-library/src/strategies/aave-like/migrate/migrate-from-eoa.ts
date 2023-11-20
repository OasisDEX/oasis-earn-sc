import { migrateEOA as aaveMigarateEOA } from '@dma-library/operations/aave/migrate/migrateEOA'
import { migrateEOA as sparkMigrateEOA } from '@dma-library/operations/spark/migrate/migrateEOA'
import { FlashloanProvider, Strategy } from '@dma-library/types'
import { WithAToken, WithVDToken } from '@dma-library/types/operations'
import { WithAaveLikeStrategyDependencies } from '@dma-library/types/strategy-params'
import { encodeOperation } from '@dma-library/utils/operation'
import { IPosition } from '@domain'

export type MigrationFromEOAArgs = WithAToken & WithVDToken

export type MigrationFromEOAStrategy = (
  args: MigrationFromEOAArgs,
  dependencies: WithAaveLikeStrategyDependencies,
) => Promise<Strategy<IPosition>>

export const createMigrateFromEOA: (protocol: 'aave' | 'spark') => MigrationFromEOAStrategy = (
  protocol: 'aave' | 'spark',
) => {
  const migrateEOA = protocol === 'aave' ? aaveMigarateEOA : sparkMigrateEOA

  return async (
    args: MigrationFromEOAArgs,
    dependencies: WithAaveLikeStrategyDependencies,
  ): Promise<Strategy<IPosition>> => {
    const flashloan = {
      provider: FlashloanProvider.Balancer,
      token: {
        address: dependencies.addresses.tokens[dependencies.currentPosition.debt.symbol],
        amount: dependencies.currentPosition.debt.amount,
      },
      // amount is depricated
      amount: dependencies.currentPosition.debt.amount,
    }

    const operation = await migrateEOA({
      aToken: args.aToken,
      vdToken: args.vdToken,
      flashloan,
      debt: {
        address: dependencies.addresses.tokens[dependencies.currentPosition.debt.symbol],
        isEth: false,
      },
      proxy: {
        address: dependencies.proxy,
        owner: dependencies.user,
        isDPMProxy: true,
      },
      addresses: dependencies.addresses,
      network: dependencies.network,
      positionType: 'Borrow',
    })

    return {
      simulation: {
        swaps: [],
        targetPosition: dependencies.currentPosition,
        position: dependencies.currentPosition,
      },
      tx: {
        to: dependencies.proxy,
        data: encodeOperation(operation, {
          provider: dependencies.provider,
          operationExecutor: dependencies.addresses.operationExecutor,
        }),
        value: '0x0',
      },
    }
  }
}
