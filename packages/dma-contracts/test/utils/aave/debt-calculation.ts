import { Snapshot } from '@dma-contracts/utils'
import { applyPercentage } from '@dma-contracts/utils/percentage.utils'
import { getContract } from '@dma-library/protocols/aave-like/utils'
import { ERC20, WETH } from '@typechain'
import { BigNumber } from 'ethers'

import { convertAmount } from '../convertAmount'

export async function getMaxDebtToBorrow(
  snapshot: Snapshot,
  collateralToken: ERC20 | WETH,
  debtToken: ERC20 | WETH,
  depositEthAmount: BigNumber,
  maxLTV: BigNumber,
): Promise<BigNumber> {
  const config = snapshot.config

  const oracle = await getContract(
    snapshot.testSystem.deployment.config.aave.v3.Oracle.address,
    'Oracle',
    config.provider,
    'AAVE_V3',
  )

  const collateralTokenPrice = await oracle.getAssetPrice(collateralToken.address)
  const collateralDecimals = await collateralToken.decimals()

  const debtTokenPrice = await oracle.getAssetPrice(debtToken.address)
  const debtDecimals = await debtToken.decimals()

  const totalBorrowAmount = convertAmount(
    depositEthAmount,
    debtDecimals,
    collateralDecimals,
    collateralTokenPrice,
    debtTokenPrice,
  )

  return applyPercentage(totalBorrowAmount, maxLTV)
}
