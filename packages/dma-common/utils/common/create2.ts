import { utils } from 'ethers'

export function buildBytecode(
  constructorTypes: (string | utils.ParamType)[],
  constructorArgs: any[],
  contractBytecode: string,
) {
  return `${contractBytecode}${utils.defaultAbiCoder
    .encode(constructorTypes, constructorArgs)
    .slice(2)}`
}

export function buildCreate2Address(factoryAddress: string, salt: string, byteCode: string) {
  const params = `0x${['ff', factoryAddress, saltToHex(salt), utils.keccak256(byteCode)]
    .map(x => x.replace(/0x/, ''))
    .join('')}`
  return utils.getAddress(`0x${utils.keccak256(params).slice(-40)}`)
}

export function saltToHex(salt: string | number) {
  const saltString = salt.toString()
  return utils.isHexString(saltString) ? saltString : utils.id(saltString)
}
