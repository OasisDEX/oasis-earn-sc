import { BigNumber } from 'bignumber.js'
import { ethers } from 'ethers'

import poolERC20Abi from '../../../../../abi/external//ajna/ajnaPoolERC20.json'
import poolInfoAbi from '../../../../../abi/external/ajna/poolInfoUtils.json'
import { AjnaPosition } from '../../helpers/ajna'
import { AjnaEarn } from '../../helpers/ajna/AjnaEarn'
import { Pool } from '../../types/ajna'
import { Address } from '../../types/common'

interface Args {
  proxyAddress: Address
  poolAddress: Address
}

interface Dependencies {
  poolInfoAddress: Address
  provider: ethers.providers.Provider
}

const WAD = new BigNumber(10).pow(18)

export async function getPool(
  poolAddress: string,
  poolInfoAddress: string,
  provider: ethers.providers.Provider,
): Promise<Pool> {
  const pool = new ethers.Contract(poolAddress, poolERC20Abi, provider)
  const poolInfo = new ethers.Contract(poolInfoAddress, poolInfoAbi, provider)

  const [collateralAddress, quoteTokenAddress, interestRateInfo, lup, htp] = await Promise.all([
    pool.collateralAddress(),
    pool.quoteTokenAddress(),
    pool.interestRateInfo(),
    poolInfo.lup(poolAddress),
    poolInfo.htp(poolAddress),
  ])

  return {
    collateralToken: collateralAddress,
    quoteToken: quoteTokenAddress,
    poolAddress: poolAddress,
    lup: new BigNumber(lup.toString()).div(WAD),
    htp: new BigNumber(htp.toString()).div(WAD),
    rate: new BigNumber(interestRateInfo[0].toString()).div(WAD),
  }
}

export async function getPosition(
  { proxyAddress, poolAddress }: Args,
  { poolInfoAddress, provider }: Dependencies,
): Promise<AjnaPosition> {
  const poolInfo = new ethers.Contract(poolInfoAddress, poolInfoAbi, provider)

  const [pool, borrowerInfo] = await Promise.all([
    getPool(poolAddress, poolInfoAddress, provider),
    poolInfo.borrowerInfo(poolAddress, proxyAddress),
  ])

  return new AjnaPosition(
    pool,
    proxyAddress,
    new BigNumber(borrowerInfo.collateral_.toString()).div(WAD),
    new BigNumber(borrowerInfo.debt_.toString()).div(WAD),
  )
}

export async function getEarnPosition(
  { proxyAddress, poolAddress }: Args,
  { poolInfoAddress, provider }: Dependencies,
): Promise<AjnaEarn> {
  const [pool] = await Promise.all([getPool(poolAddress, poolInfoAddress, provider)])

  //TO DO: we need to know how to fetch the price bucket probably theGraph 
  return new AjnaEarn(pool, proxyAddress, new BigNumber(234), new BigNumber(2000))
}
