import { migrateEOA as aaveMigarateEOA } from '@dma-library/operations/aave/migrate/migrateEOA'
import { migrateEOA as sparkMigrateEOA } from '@dma-library/operations/spark/migrate/migrateEOA'
import { AaveLikePosition, FlashloanProvider, Strategy, WithPositionType } from '@dma-library/types'
import { WithAToken, WithAaveLikePosition, WithAaveLikeStrategyAddresses, WithNetwork, WithProxy, WithVDToken } from '@dma-library/types/operations'
import { encodeOperation } from '@dma-library/utils/operation'
import { ethers } from 'ethers'

type Args = & 
    WithPositionType & 
    WithAaveLikePosition &
    WithNetwork &
    WithAToken &
    WithVDToken &
    WithAaveLikeStrategyAddresses &
    WithProxy

type Dependencies = {
    provider: ethers.providers.Provider
}

export const createMigrateFromEOA = (protocol: 'aave' | 'spark') => {
    const migrateEOA = protocol === 'aave' ? aaveMigarateEOA : sparkMigrateEOA
    
    return async (args: Args, dependencies: Dependencies): Promise<Strategy<AaveLikePosition>> => {
        const flashloan = {
            provider: FlashloanProvider.Balancer,
            token: {
                address: args.position.debt.address,
                amount: args.position.debt.amount,
            },
            // amount is depricated
            amount: args.position.debt.amount,
        }
    
        const operation = await migrateEOA({
            aToken: args.aToken,
            vdToken: args.vdToken,
            flashloan,
            debt: {
                address: args.position.debt.address,
                isEth: false,
            },
            proxy: args.proxy,
            addresses: args.addresses,
            network: args.network,
            positionType: args.positionType,
        })
    
        return {
            simulation: {
                swaps: [],
                targetPosition: args.position,
                position: args.position,
            },
            tx: {
                to: args.proxy.address,
                data: encodeOperation(operation, {
                    provider: dependencies.provider,
                    operationExecutor: args.addresses.operationExecutor,
                }),
                value: '0x0'
            }
        }
    }   
}
