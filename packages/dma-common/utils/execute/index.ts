// TODO: CHECK IF I CAN REUSE ACTION CALL and rename things
import { Contract, ContractReceipt, Signer } from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

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
  showLogs = true, // keep backwards compatibility
): Promise<[boolean, ContractReceipt]> {
  try {
    const ethers = hre ? hre.ethers : (await import('hardhat')).ethers
    const dsProxy = await ethers.getContractAt('DSProxy', proxyAddress, signer)

    const tx = await dsProxy['execute(address,bytes)'](address, calldata, {
      gasLimit: 5000000,
      value,
    })

    const result = await tx.wait()
    return [true, result]
  } catch (ex: any) {
    showLogs && console.error(`\x1b[91m[ ERROR ] ${ex} \x1b[0m`)
    let result: Partial<ContractReceipt> = ex
    if (ex?.name === 'ProviderError') {
      result = {
        status: 0,
        transactionHash: ex.data.txHash,
      }
    }
    return [false, result as ContractReceipt] // TODO:
  }
}

export async function executeThroughDPMProxy(
  dpmProxyAddress: string,
  { address, calldata }: Target,
  signer: Signer,
  value = '0',
  hre?: HardhatRuntimeEnvironment,
): Promise<[boolean, ContractReceipt]> {
  try {
    const ethers = hre ? hre.ethers : (await import('hardhat')).ethers
    const dpmProxy = await ethers.getContractAt('AccountImplementation', dpmProxyAddress, signer)

    const tx = await (dpmProxy as any)['execute(address,bytes)'](address, calldata, {
      gasLimit: 5000000,
      value,
    })

    const result = await tx.wait()
    return [true, result]
  } catch (ex: any) {
    console.error(`\x1b[91m[ ERROR ] ${ex} \x1b[0m`)
    let result: Partial<ContractReceipt> = ex
    if (ex?.name === 'ProviderError') {
      result = {
        status: 0,
        transactionHash: ex.data.txHash,
      }
    }
    return [false, result as ContractReceipt] // TODO:
  }
}

export function getDPMParamsForOperationExecutor(
  operationExecutor: Contract,
  calls: any[],
  operationName: string,
) {
  return {
    address: operationExecutor.address,
    calldata: operationExecutor.interface.encodeFunctionData('executeOp', [calls, operationName]),
  }
}
