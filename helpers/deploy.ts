import { Contract, ContractReceipt, Signer } from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { Debug, WithRuntimeConfig } from './types/common'

type DeployOptions = WithRuntimeConfig & Debug

export type DeployFunction = (contractName: string, params?: any[]) => Promise<[Contract, string]>

export async function createDeploy(
  { config, debug }: DeployOptions,
  hre?: HardhatRuntimeEnvironment,
): Promise<DeployFunction> {
  const ethers = hre?.ethers || (await import('hardhat')).ethers

  return async (contractName: string, params: string[] = []): Promise<[Contract, string]> => {
    // Hardhat is not connecting the signer correctly without the following code. You can't just pass the signer to the contract factory as 2nd argument. It doesn't persist
    const contractFactory = await ethers.getContractFactory(contractName, {
      signer: await ethers.getSigner(await config.signer.getAddress()),
    })
    const instance = await contractFactory.deploy(...params)
    if (debug) {
      console.log('DEBUG: Owner of deploy:', await config.signer.getAddress())
      console.log(`DEBUG: Deploying ${contractName} ...`)
    }
    const address = instance.address

    if (debug) {
      console.log(`DEBUG: Contract ${contractName} deployed at: ${address}`)
    }

    return [instance, address]
  }
}

// TODO: CHECK IF I CAN REUSE ACTION CALL and rename things
type Target = {
  address: string
  calldata: string
}

export async function executeThroughProxy(
  proxyAddress: string,
  { address, calldata }: Target,
  signer: Signer,
  value = '0',
  hre?: HardhatRuntimeEnvironment,
): Promise<[boolean, ContractReceipt]> {
  try {
    const ethers = hre ? hre.ethers : (await import('hardhat')).ethers
    const dsProxy = await ethers.getContractAt('DSProxy', proxyAddress, signer)

    const tx = await dsProxy['execute(address,bytes)'](address, calldata, {
      gasLimit: 4000000,
      value,
    })

    const result = await tx.wait()
    return [true, result]
  } catch (ex) {
    return [false, ex as any] // TODO:
  }
}
