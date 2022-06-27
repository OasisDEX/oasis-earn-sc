import { Contract, ContractReceipt, Signer } from 'ethers'
import { ethers } from 'hardhat'

import { Debug, WithRuntimeConfig } from './types'

type DeployOptions = WithRuntimeConfig & Debug

export async function deploy(
  contractName: string,
  params: any[],
  { config, debug }: DeployOptions,
): Promise<[Contract, string]> {
  const contractFactory = await ethers.getContractFactory(contractName, config.signer)
  const instance = await contractFactory.deploy(...params)
  if (debug) {
    console.log(`DEBUG: Deploying ${contractName} ...`)
  }
  const address = instance.address

  if (debug) {
    console.log(`DEBUG: Contract ${contractName} deployed at: ${address}`)
  }

  return [instance, address]
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
  value: string,
): Promise<[boolean, ContractReceipt]> {
  try {
    const dsProxy = await ethers.getContractAt('DSProxy', proxyAddress, signer)
    const tx = await dsProxy['execute(address,bytes)'](address, calldata, {
      gasLimit: 5000000,
      value
    })
    const result = await tx.wait()
    return [true, result]
  } catch (ex) {
    return [false, ex as any] // TODO:
  }
}
