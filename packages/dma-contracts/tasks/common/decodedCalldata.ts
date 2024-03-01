import { ethers } from 'ethers'

export type DecodedParameter = {
  name: string
  type: string
  value: any
}

export type DecodedCalldata = {
  method: string
  parameters: DecodedParameter[]
}

export type FunctionInputs = {
  name: string
  type: string
}

export type FunctionSignature = {
  name: string
  inputs: FunctionInputs[]
}

export type FunctionSignaturesMap = Record<string, FunctionSignature>

export function tryDecodeCallData(
  functionSignature: FunctionSignature,
  calldata: string,
): DecodedCalldata | undefined {
  const paramTypes = functionSignature.inputs.map(input => input.type)
  const paramNames = functionSignature.inputs.map(input => input.name)
  const inputFunctionSelector = calldata.slice(0, 10)
  const inputParamsData = `0x${calldata.slice(10)}`

  const signature = getStringSignature(functionSignature.name, paramTypes)
  const functionSelector = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(signature)).slice(0, 10)

  if (inputFunctionSelector !== functionSelector) {
    return undefined
  }

  const abiCoder = ethers.utils.defaultAbiCoder
  const decodedData = abiCoder.decode(paramTypes, inputParamsData)

  if (decodedData.length !== paramNames.length) {
    return undefined
  }

  const decodedParams = decodedData.map((value, index): DecodedParameter => {
    return {
      name: paramNames[index],
      type: paramTypes[index],
      value,
    }
  })

  return {
    method: functionSignature.name,
    parameters: decodedParams,
  }
}

export function getStringSignature(functionName: string, parameters: string[]): string {
  return `${functionName}(${parameters.join(',')})`
}
