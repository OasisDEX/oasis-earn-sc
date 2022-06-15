import { JsonRpcProvider } from '@ethersproject/providers'
import { BigNumber as EthersBN, Signer } from 'ethers'
import { ethers } from 'hardhat'
import _ from 'lodash'

import GetCDPsABI from '../../abi/get-cdps.json'
import { ADDRESSES } from '../addresses'
import { CDPInfo } from '../types/maker'

export async function getLastCDP(
  provider: JsonRpcProvider,
  signer: Signer,
  proxyAddress: string,
): Promise<CDPInfo> {
  const getCdps = new ethers.Contract(ADDRESSES.main.getCdps, GetCDPsABI, provider).connect(signer)
  const { ids, urns, ilks } = await getCdps.getCdpsAsc(ADDRESSES.main.cdpManager, proxyAddress)

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
