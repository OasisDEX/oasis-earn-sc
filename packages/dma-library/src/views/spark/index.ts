import { AavePosition } from '@dma-library/types/aave'

export type SparkView = {
  getCurrentPosition: any
}

export type SparkGetCurrentPosition = (
  // args: AaveGetCurrentPositionArgs,
  args: any,
  addresses: any,
  // addresses: AaveGetCurrentPositionDependencies,
) => Promise<AavePosition>

export const getCurrentPosition: any = async (args, dependencies) => {
  // TODO: fix this
  // if (
  //   AaveCommon.isV2<AaveGetCurrentPositionDependencies, AaveV2GetCurrentPositionDependencies>(
  //     dependencies,
  //   )
  // ) {
  //   return getCurrentPositionAaveV2(args, dependencies)
  // } else if (
  //   AaveCommon.isV3<AaveGetCurrentPositionDependencies, AaveV3GetCurrentPositionDependencies>(
  //     dependencies,
  //   )
  // ) {
  //   return getCurrentPositionAaveV3(args, dependencies)
  // } else {
  //   throw new Error('Invalid Aave version')
  // }
}
