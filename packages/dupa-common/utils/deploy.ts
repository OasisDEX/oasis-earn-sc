import { Contract } from '@ethersproject/contracts'
import { ContractReceipt, Signer } from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { removeVersion } from '../../dupa-contracts/scripts/common'
import { Debug, WithRuntimeConfig } from './types/common'

type DeployOptions = WithRuntimeConfig & Debug

export type DeployFunction = (contractName: string, params?: any[]) => Promise<[Contract, string]>

export async function createDeploy(
  { config, debug }: DeployOptions,
  hre?: HardhatRuntimeEnvironment,
): Promise<DeployFunction> {
  const ethers = hre?.ethers || (await import('hardhat')).ethers

  return async (contractName: string, params: string[] = []): Promise<[Contract, string]> => {
    const contractNameWithVersionRemoved = removeVersion(contractName)
    const contractFactory = await ethers.getContractFactory(
      contractNameWithVersionRemoved,
      config.signer,
    )
    const instance = await contractFactory.deploy(...params)
    if (debug) {
      console.log('DEBUG: Owner of deploy:', await config.signer.getAddress())
      console.log(`DEBUG: Deploying ${contractNameWithVersionRemoved} ...`)
    }
    const address = instance.address

    if (debug) {
      console.log(`DEBUG: Contract ${contractNameWithVersionRemoved} deployed at: ${address}`)
    }

    return [instance, address]
  }
}

