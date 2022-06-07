import BigNumber from 'bignumber.js'
import { BigNumberish, Contract } from 'ethers'
import { ethers } from 'hardhat'
import { VaultInfo } from '../common.types'

export const MCD_MANAGER_ADDR = '0x5ef30b9986345249bc32d8928B7ee64DE9435E39'

export async function getVaultInfo(
  mcdView: Contract,
  vaultId: BigNumberish,
  ilk: string,
): Promise<VaultInfo> {
  const info = await mcdView.getVaultInfo(vaultId, ilk)
  return {
    coll: new BigNumber(ethers.utils.formatUnits(info[0]).toString()),
    debt: new BigNumber(ethers.utils.formatUnits(info[1]).toString()),
  }
}
