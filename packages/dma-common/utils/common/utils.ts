import { Network } from '@dma-deployments/types/network'
import { ContractReceipt } from '@ethersproject/contracts'
import { BigNumber } from 'bignumber.js'
import { BytesLike, Contract, utils } from 'ethers'

export function toRatio(units: BigNumber.Value) {
  return new BigNumber(units).shiftedBy(4).toNumber()
}

export function isLocalNetwork(network: string) {
  return [Network.HARDHAT, Network.LOCAL].includes(network as Network)
}

export function getServiceNameHash(service: string) {
  return utils.keccak256(Buffer.from(service))
}

export function getEvents(receipt: ContractReceipt, eventAbi: utils.EventFragment) {
  const iface = new utils.Interface([eventAbi])
  const filteredEvents = receipt.logs?.filter(
    ({ topics }) => topics[0] === iface.getEventTopic(eventAbi.name),
  )
  return (
    filteredEvents?.map(x => ({
      ...iface.parseLog(x),
      topics: x.topics,
      data: x.data,
      address: x.address,
    })) || []
  )
}

export function generateRandomAddress() {
  return utils.hexlify(utils.randomBytes(20))
}

export function forgeUnoswapCalldata(
  fromToken: string,
  fromAmount: string,
  toAmount: string,
  toDai = true,
): string {
  const iface = new utils.Interface([
    'function unoswap(address srcToken, uint256 amount, uint256 minReturn, bytes32[] calldata pools) public payable returns(uint256 returnAmount)',
  ])
  const pool = `0x${
    toDai ? '8' : '0'
  }0000000000000003b6d0340a478c2975ab1ea89e8196811f51a7b7ade33eb11`
  return iface.encodeFunctionData('unoswap', [fromToken, fromAmount, toAmount, [pool]])
}

export function generateTpOrSlExecutionData(
  mpa: Contract,
  toCollateral: boolean,
  cdpData: any,
  exchangeData: any,
  serviceRegistry: any,
): BytesLike {
  if (toCollateral) {
    return mpa.interface.encodeFunctionData('closeVaultExitCollateral', [
      exchangeData,
      cdpData,
      serviceRegistry,
    ])
  }
  return mpa.interface.encodeFunctionData('closeVaultExitDai', [
    exchangeData,
    cdpData,
    serviceRegistry,
  ])
}

export function bignumberToTopic(id: BigNumber.Value): string {
  return '0x' + new BigNumber(id).toString(16).padStart(64, '0')
}
