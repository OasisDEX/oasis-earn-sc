import { getNetwork } from '@deploy-configurations/utils/network/index'
import { ONE, TEN, ZERO } from '@dma-common/constants'
import { operations } from '@dma-library/operations'
import {
    FlashloanProvider,
    IOperation,
    MorphoBluePosition,
    PositionType,
    SwapData,
} from '@dma-library/types'
import * as SwapUtils from '@dma-library/utils/swap'
import * as Domain from '@domain'
import { isRiskIncreasing } from '@domain/utils'
import BigNumber from 'bignumber.js'
import { MorphoMultiplyDependencies, getSwapData, getTokenSymbol, prepareMorphoMultiplyDMAPayload, simulateAdjustment } from './open'
import { MorphoBlueAdjustRiskUpArgs } from '@dma-library/operations/morphoblue/multiply/adjust-risk-up'
import { MorphoBlueAdjustRiskDownArgs } from '@dma-library/operations/morphoblue/multiply/adjust-risk-down'
import { areAddressesEqual } from '@dma-common/utils/addresses'
import { SummerStrategy } from '@dma-library/types/ajna/ajna-strategy'

interface MorphoAdjustMultiplyPayload {
    riskRatio: Domain.IRiskRatio
    collateralAmount: BigNumber
    slippage: BigNumber
    position: MorphoBluePosition
    quoteTokenPrecision: number
    collateralTokenPrecision: number
    user: string
    dpmProxyAddress: string
}

export type MorphoAdjustRiskStrategy = (
    args: MorphoAdjustMultiplyPayload,
    dependencies: MorphoMultiplyDependencies,
) => Promise<SummerStrategy<MorphoBluePosition>>

const positionType: PositionType = 'Multiply'

export const adjustMultiply: MorphoAdjustRiskStrategy = (
    args: MorphoAdjustMultiplyPayload,
    dependencies: MorphoMultiplyDependencies,
) => {
    if (isRiskIncreasing(args.riskRatio.loanToValue, args.position.riskRatio.loanToValue)) {
        console.log("Risk is increasing")
        return adjustRiskUp(args, dependencies)
    } else {
        console.log("Risk is decreasing")
        return adjustRiskDown(args, dependencies)
    }
}

const adjustRiskUp: MorphoAdjustRiskStrategy = async (args, dependencies) => {
    const oraclePrice = ONE.div(args.position.marketPrice)
    const collateralTokenSymbol = await getTokenSymbol(args.position.marketParams.collateralToken, dependencies.provider)
    const debtTokenSymbol = await getTokenSymbol(args.position.marketParams.loanToken, dependencies.provider)

    const mappedArgs = {
        ...args,
        collateralTokenSymbol,
        quoteTokenSymbol: debtTokenSymbol,
        collateralAmount: args.collateralAmount.shiftedBy(args.collateralTokenPrecision),
    }

    // Simulate adjust
    const riskIsIncreasing = true
    const simulatedAdjustment = await simulateAdjustment(
        mappedArgs,
        dependencies,
        args.position,
        riskIsIncreasing,
        oraclePrice,
        collateralTokenSymbol,
        debtTokenSymbol
    )

    console.log("Simulated adjustment: ", `
    delta collateral: ${simulatedAdjustment.delta.collateral.toString()}
    delta: ${simulatedAdjustment.delta.debt.toString()}
    swap: ${simulatedAdjustment.swap.fromTokenAmount.toString()}
    `)

    // Get swap data
    const { swapData, collectFeeFrom, preSwapFee } = await getSwapData(
        mappedArgs,
        args.position,
        dependencies,
        simulatedAdjustment,
        riskIsIncreasing,
        positionType,
        collateralTokenSymbol,
        debtTokenSymbol,
    )

    // Build operation
    const operation = await buildOperation(
        args,
        dependencies,
        simulatedAdjustment,
        swapData,
        riskIsIncreasing,
    )

    // Prepare payload
    return prepareMorphoMultiplyDMAPayload(
        args,
        dependencies,
        simulatedAdjustment,
        operation,
        swapData,
        collectFeeFrom,
        preSwapFee,
        riskIsIncreasing,
        args.position,
        collateralTokenSymbol,
        debtTokenSymbol,
    )
}

const adjustRiskDown: MorphoAdjustRiskStrategy = async (args, dependencies) => {
    const oraclePrice = ONE.div(args.position.marketPrice)
    const collateralTokenSymbol = await getTokenSymbol(args.position.marketParams.collateralToken, dependencies.provider)
    const debtTokenSymbol = await getTokenSymbol(args.position.marketParams.loanToken, dependencies.provider)
    const mappedArgs = {
        ...args,
        collateralTokenSymbol,
        quoteTokenSymbol: debtTokenSymbol,
        collateralAmount: args.collateralAmount.shiftedBy(args.collateralTokenPrecision),
    }

    // Simulate adjust
    const riskIsIncreasing = false
    const simulatedAdjustment = await simulateAdjustment(
        mappedArgs,
        dependencies,
        args.position,
        riskIsIncreasing,
        oraclePrice,
        collateralTokenSymbol,
        debtTokenSymbol
    )

    // Get swap data
    const { swapData, collectFeeFrom, preSwapFee } = await getSwapData(
        mappedArgs,
        args.position,
        dependencies,
        simulatedAdjustment,
        riskIsIncreasing,
        positionType,
        collateralTokenSymbol,
        debtTokenSymbol,
    )

    // Build operation
    const operation = await buildOperation(
        args,
        dependencies,
        simulatedAdjustment,
        swapData,
        riskIsIncreasing,
    )
    
    // Prepare payload
    return prepareMorphoMultiplyDMAPayload(
        args,
        dependencies,
        simulatedAdjustment,
        operation,
        swapData,
        collectFeeFrom,
        preSwapFee,
        riskIsIncreasing,
        args.position,
        collateralTokenSymbol,
        debtTokenSymbol,
    )
}

async function buildOperation(
    args: MorphoAdjustMultiplyPayload,
    dependencies: MorphoMultiplyDependencies,
    simulatedAdjust: Domain.ISimulationV2 & Domain.WithSwap,
    swapData: SwapData,
    riskIsIncreasing: boolean,
): Promise<IOperation> {
    /** Not relevant for Ajna */
    const debtTokensDeposited = ZERO
    const borrowAmount = simulatedAdjust.delta.debt.minus(debtTokensDeposited)
    const collateralTokenSymbol = simulatedAdjust.position.collateral.symbol.toUpperCase()
    const debtTokenSymbol = simulatedAdjust.position.debt.symbol.toUpperCase()
    const fee = SwapUtils.feeResolver(collateralTokenSymbol, debtTokenSymbol, {
        isIncreasingRisk: riskIsIncreasing,
        isEarnPosition: SwapUtils.isCorrelatedPosition(collateralTokenSymbol, debtTokenSymbol),
    })
    const swapAmountBeforeFees = simulatedAdjust.swap.fromTokenAmount
    const collectFeeFrom = SwapUtils.acceptedFeeTokenBySymbol({
        fromTokenSymbol: simulatedAdjust.position.debt.symbol,
        toTokenSymbol: simulatedAdjust.position.collateral.symbol,
    })

    const network = await getNetwork(dependencies.provider)

    if (riskIsIncreasing) {
        const riskUpMultiplyArgs: MorphoBlueAdjustRiskUpArgs = {
            morphoBlueMarket: {
                loanToken: args.position.marketParams.loanToken,
                collateralToken: args.position.marketParams.collateralToken,
                oracle: args.position.marketParams.oracle,
                irm: args.position.marketParams.irm,
                lltv: args.position.marketParams.lltv.times(TEN.pow(18)),
            },
            collateral: {
                address: args.position.marketParams.collateralToken,
                isEth: areAddressesEqual(args.position.marketParams.collateralToken, dependencies.addresses.WETH),
            },
            debt: {
                address: args.position.marketParams.loanToken,
                isEth: areAddressesEqual(args.position.marketParams.loanToken, dependencies.addresses.WETH),
                borrow: {
                    amount: borrowAmount.times(TEN.pow(args.quoteTokenPrecision)).integerValue(),
                },
            },
            deposit: {
                address: args.position.marketParams.collateralToken,
                amount: args.collateralAmount.times(TEN.pow(args.collateralTokenPrecision)).integerValue(),
            },
            swap: {
                fee: fee.toNumber(),
                data: swapData.exchangeCalldata,
                amount: swapAmountBeforeFees,
                collectFeeFrom,
                receiveAtLeast: swapData.minToTokenAmount,
            },
            flashloan: {
                token: {
                    amount: Domain.debtToCollateralSwapFlashloan(swapAmountBeforeFees),
                    address: args.position.marketParams.loanToken,
                },
                amount: Domain.debtToCollateralSwapFlashloan(swapAmountBeforeFees),
                provider: FlashloanProvider.Balancer,
            },
            addresses: {
                morphoblue: dependencies.morphoAddress,
                operationExecutor: dependencies.operationExecutor,
                tokens: dependencies.addresses,
            },
            proxy: {
                address: args.dpmProxyAddress,
                isDPMProxy: true,
                owner: args.user,
            },
            network,
        }

        return await operations.morphoblue.multiply.adjustRiskUp(riskUpMultiplyArgs)
    }
    const riskDownMultiplyArgs: MorphoBlueAdjustRiskDownArgs = {
        morphoBlueMarket: {
            loanToken: args.position.marketParams.loanToken,
            collateralToken: args.position.marketParams.collateralToken,
            oracle: args.position.marketParams.oracle,
            irm: args.position.marketParams.irm,
            lltv: args.position.marketParams.lltv.times(TEN.pow(18)),
        },
        collateral: {
            address: args.position.marketParams.collateralToken,
            isEth: areAddressesEqual(args.position.marketParams.collateralToken, dependencies.addresses.WETH),
            withdrawal: {
                amount: args.collateralAmount.times(TEN.pow(args.collateralTokenPrecision)).integerValue(),
            }
        },
        debt: {
            address: args.position.marketParams.loanToken,
            isEth: areAddressesEqual(args.position.marketParams.loanToken, dependencies.addresses.WETH),
        },
        swap: {
            fee: fee.toNumber(),
            data: swapData.exchangeCalldata,
            amount: swapAmountBeforeFees,
            collectFeeFrom,
            receiveAtLeast: swapData.minToTokenAmount,
        },
        flashloan: {
            token: {
                amount: Domain.debtToCollateralSwapFlashloan(swapAmountBeforeFees),
                address: args.position.marketParams.loanToken,
            },
            amount: Domain.debtToCollateralSwapFlashloan(swapAmountBeforeFees),
            provider: FlashloanProvider.Balancer,
        },
        addresses: {
            morphoblue: dependencies.morphoAddress,
            operationExecutor: dependencies.operationExecutor,
            tokens: dependencies.addresses,
        },
        proxy: {
            address: args.dpmProxyAddress,
            isDPMProxy: true,
            owner: args.user,
        },
        network,
    }

    return await operations.morphoblue.multiply.adjustRiskDown(riskDownMultiplyArgs)
}
