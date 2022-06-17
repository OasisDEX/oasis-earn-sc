import { JsonRpcProvider } from '@ethersproject/providers'
import BigNumber from 'bignumber.js'
import { BigNumber as EthersBN, BigNumberish, Contract, Signer } from 'ethers'
import { ethers } from 'hardhat'
import _ from 'lodash'

import GetCDPsABI from '../../abi/get-cdps.json'
import { ADDRESSES } from '../addresses'
import { CDPInfo, VaultInfo } from '../types/maker'

export async function getLastVault(
  provider: JsonRpcProvider,
  signer: Signer,
  proxyAddress: string,
): Promise<CDPInfo> {
  const getCdps = new ethers.Contract(ADDRESSES.main.maker.getCdps, GetCDPsABI, provider).connect(
    signer,
  )
  const { ids, urns, ilks } = await getCdps.getCdpsAsc(
    ADDRESSES.main.maker.cdpManager,
    proxyAddress,
  )

  const cdp = _.last(
    _.map(_.zip(ids, urns, ilks), cdp => ({
      id: (cdp[0] as EthersBN).toNumber(), // TODO:
      urn: cdp[1],
      ilk: cdp[2],
    })),
  )

  if (!cdp) {
    throw new Error('No CDP available')
  }

  return cdp as CDPInfo
}

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
