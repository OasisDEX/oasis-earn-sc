import { JsonRpcProvider } from '@ethersproject/providers'
import BigNumber from 'bignumber.js'
import retry from 'async-retry'
import { constants, ContractReceipt } from 'ethers'
import { getPayload } from './1inch'
import { ten } from '../cosntants'
import { EventHash, PackedEvent, Ticker } from '../common.types'

export async function createSnapshot(provider: JsonRpcProvider) {
  const id = await provider.send('evm_snapshot', [])
  console.log('snapshot created', id, new Date())
  return id
}

export async function restoreSnapshot(provider: JsonRpcProvider, id: string) {
  await provider.send('evm_revert', [id])
  console.log('snapshot restored', id, new Date())
}

export async function fillExchangeData(
  _testParams,
  exchangeData,
  exchange,
  fee,
  protocols: string[] = [],
) {
  if (!_testParams.useMockExchange) {
    const oneInchPayload = await retry(
      async () =>
        await getPayload(exchangeData, exchange.address, _testParams.slippage, fee, protocols),
      {
        retries: 5,
      },
    )
    exchangeData._exchangeCalldata = oneInchPayload.data
    exchangeData.exchangeAddress = oneInchPayload.to
  }
}

export function getAddressesLabels(
  deployedContracts,
  addressRegistry,
  mainnet,
  primarySignerAddress: string,
) {
  const labels = {}
  let keys = Object.keys(addressRegistry)
  labels[primarySignerAddress.substring(2).toLowerCase()] = 'caller'
  keys.forEach(x => {
    const adr = addressRegistry[x].substr(2).toLowerCase() // no 0x prefix
    if (!labels[adr]) {
      labels[adr] = x.toString()
    }
  })
  keys = Object.keys(mainnet)
  keys.forEach(x => {
    const adr = mainnet[x].substr(2).toLowerCase() // no 0x prefix
    if (!labels[adr]) {
      labels[adr] = x.toString()
    }
  })
  keys = Object.keys(deployedContracts)
  keys.forEach(x => {
    if (deployedContracts[x].address) {
      const adr = deployedContracts[x].address.substr(2).toLowerCase() // no 0x prefix
      if (!labels[adr]) {
        // if address repeats in address_registry it is not taken
        labels[adr] = x.toString()
      }
    }
  })
  labels['0000000000000000000000000000000000000000'] = 'ZERO_ADDRESS'
  return labels
}

export function findExchangeTransferEvent(
  source: string,
  dest: string,
  { events = [] }: ContractReceipt,
) {
  const exchangeTransferEvents = events
    .filter(x => x.topics[0] === EventHash.ERC20_TRANSFER)
    .filter(
      x =>
        x.topics[1].toLowerCase().includes(source.toLowerCase().substring(2)) &&
        x.topics[2].toLowerCase().includes(dest.toLowerCase().substring(2)),
    )
  return new BigNumber(exchangeTransferEvents[0].data, 16)
}

export function printAllERC20Transfers({ events = [] }: ContractReceipt, labels) {
  function tryUseLabels(value: string) {
    // strip 24 leading 0s and 0x prefix
    const toCheck = value.substring(26)
    return labels[toCheck] || `0x${toCheck}`
  }

  const packedEvents: PackedEvent[] = []

  let contractEvents = events.filter(x => x.topics[0] === EventHash.ERC20_TRANSFER)
  for (let i = 0; i < contractEvents.length; i++) {
    const { address } = contractEvents[i]
    const token =
      address === '0x6B175474E89094C44Da98b954EedeAC495271d0F' // TODO: MCD dai
        ? Ticker.DAI
        : address === '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' // TODO: WETH
        ? Ticker.WETH
        : address
    packedEvents.push({
      AmountAsNumber: new BigNumber(contractEvents[i].data, 16)
        .dividedBy(ten.exponentiatedBy(18))
        .toFixed(5),
      Token: token,
      From: tryUseLabels(contractEvents[i].topics[1]),
      To: tryUseLabels(contractEvents[i].topics[2]),
    })
  }

  contractEvents = events.filter(x => x.topics[0] === EventHash.WETH_DEPOSIT)
  for (let i = 0; i < contractEvents.length; i++) {
    packedEvents.push({
      AmountAsNumber: new BigNumber(contractEvents[i].data, 16).dividedBy(ten.pow(18)).toFixed(5),
      Token: Ticker.WETH,
      From: constants.AddressZero,
      To: tryUseLabels(contractEvents[i].topics[1]),
    })
  }

  contractEvents = events.filter(x => x.topics[0] === EventHash.WETH_WITHDRAWAL)
  for (let i = 0; i < contractEvents.length; i++) {
    packedEvents.push({
      AmountAsNumber: new BigNumber(contractEvents[i].data, 16).dividedBy(ten.pow(18)).toFixed(5),
      Token: Ticker.WETH,
      From: tryUseLabels(contractEvents[i].topics[1]),
      To: constants.AddressZero,
    })
  }

  console.log('All tx transfers:', packedEvents)

  return packedEvents
}

export async function resetNetworkToBlock(provider: JsonRpcProvider, blockNumber: number) {
  console.log('\x1b[33m Reseting network to:\x1b[0m', blockNumber, new Date())
  provider.send('hardhat_reset', [
    {
      forking: {
        jsonRpcUrl: process.env.ALCHEMY_NODE,
        blockNumber,
      },
    },
  ])
}
