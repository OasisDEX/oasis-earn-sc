import { JsonRpcProvider } from '@ethersproject/providers'
import { GetCdps__factory } from '@oasisdex/abis'
import { ADDRESSES } from '@oasisdex/deploy-configurations/addresses'
import { Network } from '@oasisdex/deploy-configurations/types'
import BigNumber from 'bignumber.js'
import { BigNumber as EthersBN, BigNumberish, Contract, Signer } from 'ethers'
import { ethers } from 'hardhat'
import _ from 'lodash'

import { CDPInfo, VaultInfo } from '../../types'

export async function getLastVault(
  provider: JsonRpcProvider,
  signer: Signer,
  proxyAddress: string,
): Promise<CDPInfo> {
  const getCdps = GetCdps__factory.connect(ADDRESSES[Network.MAINNET].maker.common.GetCdps, signer)

  const { ids, urns, ilks } = await getCdps.getCdpsAsc(
    ADDRESSES[Network.MAINNET].maker.common.CdpManager,
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
  const [collateral, debt] = await mcdView.getVaultInfo(vaultId, ilk)
  return {
    coll: new BigNumber(ethers.utils.formatUnits(collateral).toString()),
    debt: new BigNumber(ethers.utils.formatUnits(debt).toString()),
  }
}
