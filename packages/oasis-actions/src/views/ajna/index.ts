import { BigNumber } from 'bignumber.js'
import { ethers } from 'ethers'

import poolERC20Abi from '../../abi/ajna/ajnaPoolERC20.json'
import poolInfoAbi from '../../abi/ajna/poolInfoUtils.json'
import { RiskRatio } from '../../helpers/calculations/RiskRatio'
import { AjnaPosition, Pool } from '../../types/ajna'
import { Address } from '../../types/common'

function bucketIndexToPrice(index: number) {
  return new BigNumber(1.05).pow(index - 3232)
}

interface Args {
  proxy: Address
  poolAddress: Address
}

interface Dependencies {
  poolInfoAddress: Address
  provider: ethers.providers.Provider
}

const WAD = new BigNumber(10).pow(18)

export async function getPool(
  poolAddress: string,
  provider: ethers.providers.Provider,
): Promise<Pool> {
  const pool = new ethers.Contract(poolAddress, poolERC20Abi, provider)

  const [collateralAddress, quoteTokenAddress, interestRateInfo] = await Promise.all([
    pool.collateralAddress(),
    pool.quoteTokenAddress(),
    pool.interestRateInfo(),
  ])

  return {
    collateralToken: collateralAddress,
    quoteToken: quoteTokenAddress,
    poolAddress: poolAddress,
    rate: new BigNumber(interestRateInfo[0].toString()).div(WAD),
  }
}

export async function getPosition(
  { proxy, poolAddress }: Args,
  { poolInfoAddress, provider }: Dependencies,
): Promise<AjnaPosition> {
  const pool = await getPool(poolAddress, provider)
  const poolInfo = new ethers.Contract(poolInfoAddress, poolInfoAbi, provider)

  return {
    collateralAmount: new BigNumber(0),
    debtAmount: new BigNumber(0),
    liquidationPrice: new BigNumber(0),
    owner: proxy,
    pool,
    riskRatio: new RiskRatio(new BigNumber(0), RiskRatio.TYPE.LTV),
  }
}
