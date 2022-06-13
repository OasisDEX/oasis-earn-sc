import { JsonRpcProvider } from '@ethersproject/providers'
import BigNumber from 'bignumber.js'
import { BigNumber as EthersBN, Contract, Signer } from 'ethers'
import { ethers } from 'hardhat'
import _ from 'lodash'

import DSProxyABI from '../../abi/ds-proxy.json'
import GetCDPsABI from '../../abi/get-cdps.json'
import { ADDRESSES } from '../../helpers/addresses'
import { CONTRACT_LABELS } from '../../helpers/constants'
import { deploy } from '../../helpers/deploy'
import init from '../../helpers/init'
import { getOrCreateProxy } from '../../helpers/proxy'
import { loadDummyExchangeFixtures } from '../../helpers/swap/dummy-exchange'
import { CDPInfo } from '../../helpers/types/maker'
import { ServiceRegistry } from '../../helpers/utils'
import { logDebug } from './test-utils'

export const FEE = 20
export const FEE_BASE = 10000

export interface MCDInitParams {
  blockNumber?: string
  provider?: JsonRpcProvider
  signer?: Signer
}

export interface DeployedSystemInfo {
  userProxyAddress: string
  mcdViewInstance: Contract
  exchangeInstance: Contract
  dsProxyInstance: Contract
  daiTokenInstance: Contract
  gems: {
    wethTokenInstance: Contract
  }
  actionOpenVault: Contract
  actionTakeFlashLoan: Contract
  actionDeposit: Contract
  actionPayback: Contract
  actionWithdraw: Contract
  actionGenerate: Contract
  actionSendToken: Contract
  actionPullToken: Contract
  operationExecutor: Contract
  operationStorage: Contract
  serviceRegistry: Contract
}

export async function deployTestSystem(debug = false): Promise<DeployedSystemInfo> {
  const config = await init()
  const { provider, signer, address } = config

  const options = {
    debug: true,
    config,
  }

  const deployedContracts: Partial<DeployedSystemInfo> = {}

  // Setup User
  console.log('1/ Setting up user proxy')
  const proxyAddress = await getOrCreateProxy(signer)
  deployedContracts.userProxyAddress = proxyAddress
  deployedContracts.dsProxyInstance = new ethers.Contract(
    proxyAddress,
    DSProxyABI,
    provider,
  ).connect(signer)

  // Deploy System Contracts
  console.log('2/ Deploying system contracts')
  const [serviceRegistry, serviceRegistryAddress] = await deploy('ServiceRegistry', [0], options)
  const registry = new ServiceRegistry(serviceRegistryAddress, signer)
  deployedContracts.serviceRegistry = serviceRegistry

  const [operationExecutor, operationExecutorAddress] = await deploy(
    'OperationExecutor',
    [serviceRegistryAddress],
    options,
  )
  deployedContracts.operationExecutor = operationExecutor

  const [operationStorage, operationStorageAddress] = await deploy('OperationStorage', [], options)
  deployedContracts.operationStorage = operationStorage

  const [mcdView, mcdViewAddress] = await deploy('McdView', [], options)
  deployedContracts.mcdViewInstance = mcdView

  const [dummyExchange, dummyExchangeAddress] = await deploy('DummyExchange', [], options)
  deployedContracts.exchangeInstance = dummyExchange

  await loadDummyExchangeFixtures(provider, signer, dummyExchange, debug)

  // Deploy Actions
  console.log('3/ Deploying actions')
  const [sendToken, sendTokenAddress] = await deploy('SendToken', [], options)
  deployedContracts.actionSendToken = sendToken

  const [pullToken, pullTokenAddress] = await deploy('PullToken', [], options)
  deployedContracts.actionPullToken = pullToken

  const [actionFl, actionFlAddress] = await deploy(
    'TakeFlashloan',
    [serviceRegistryAddress],
    options,
  )
  deployedContracts.actionTakeFlashLoan = actionFl

  const [actionOpenVault, actionOpenVaultAddress] = await deploy(
    'OpenVault',
    [serviceRegistryAddress],
    options,
  )
  deployedContracts.actionOpenVault = actionOpenVault

  const [actionDeposit, actionDepositAddress] = await deploy(
    'Deposit',
    [serviceRegistryAddress],
    options,
  )
  deployedContracts.actionDeposit = actionDeposit

  const [actionPayback, actionPaybackAddress] = await deploy(
    'Payback',
    [serviceRegistryAddress],
    options,
  )
  deployedContracts.actionPayback = actionPayback

  const [actionWithdraw, actionWithdrawAddress] = await deploy(
    'Withdraw',
    [serviceRegistryAddress],
    options,
  )
  deployedContracts.actionWithdraw = actionWithdraw

  const [actionGenerate, actionGenerateAddress] = await deploy(
    'Generate',
    [serviceRegistryAddress],
    options,
  )
  deployedContracts.actionGenerate = actionGenerate

  console.log('4/ Adding contracts to registry')
  registry.addEntry(CONTRACT_LABELS.maker.FLASH_MINT_MODULE, ADDRESSES.main.fmm)
  registry.addEntry(CONTRACT_LABELS.common.OPERATION_EXECUTOR, operationExecutorAddress)
  registry.addEntry(CONTRACT_LABELS.common.OPERATION_STORAGE, operationStorageAddress)
  registry.addEntry(CONTRACT_LABELS.maker.MCD_VIEW, mcdViewAddress)
  registry.addEntry(CONTRACT_LABELS.common.EXCHANGE, dummyExchangeAddress)
  registry.addEntry(CONTRACT_LABELS.common.TAKE_A_FLASHLOAN, actionFlAddress)
  registry.addEntry(CONTRACT_LABELS.common.SEND_TOKEN, sendTokenAddress)
  registry.addEntry(CONTRACT_LABELS.common.PULL_TOKEN, pullTokenAddress)

  registry.addEntry(CONTRACT_LABELS.maker.OPEN_VAULT, actionOpenVaultAddress)
  registry.addEntry(CONTRACT_LABELS.maker.DEPOSIT, actionDepositAddress)
  registry.addEntry(CONTRACT_LABELS.maker.PAYBACK, actionPaybackAddress)
  registry.addEntry(CONTRACT_LABELS.maker.WITHDRAW, actionWithdrawAddress)
  registry.addEntry(CONTRACT_LABELS.maker.GENERATE, actionGenerateAddress)

  if (debug) {
    console.log('5/ Debugging...')
    logDebug([
      `Signer address: ${address}`,
      `Exchange address: ${deployedContracts.exchangeInstance.address}`,
      `User Proxy Address: ${deployedContracts.userProxyAddress}`,
      `DSProxy address: ${deployedContracts.dsProxyInstance.address}`,
      `MCDView address: ${deployedContracts.mcdViewInstance.address}`,
      `Registry address: ${deployedContracts.serviceRegistry.address}`,
      `Operation Executor address: ${deployedContracts.operationExecutor.address}`,
      `Operator Storage address: ${deployedContracts.operationStorage.address}`,
      `Send Token address: ${deployedContracts.actionSendToken.address}`,
      `Pull Token address: ${deployedContracts.actionPullToken.address}`,

      `Flashloan Action address: ${deployedContracts.actionTakeFlashLoan.address}`,
      `OpenVault Action address: ${deployedContracts.actionOpenVault.address}`,
      `Depost Action address: ${deployedContracts.actionDeposit.address}`,
      `Payback Action address: ${deployedContracts.actionPayback.address}`,
      `Withdraw Action address: ${deployedContracts.actionWithdraw.address}`,
      `Generate Action address: ${deployedContracts.actionGenerate.address}`,
    ])
  }

  return deployedContracts as DeployedSystemInfo
}

export async function getOraclePrice(
  provider: JsonRpcProvider,
  pipAddress = ADDRESSES.main.pipWETH,
) {
  const storageHexToBigNumber = (uint256: string) => {
    const matches = uint256.match(/^0x(\w+)$/)
    if (!matches?.length) {
      throw new Error(`invalid uint256: ${uint256}`)
    }

    const match = matches[0]
    return match.length <= 32
      ? [new BigNumber(0), new BigNumber(uint256)]
      : [
          new BigNumber(`0x${match.substring(0, match.length - 32)}`),
          new BigNumber(`0x${match.substring(match.length - 32, match.length)}`),
        ]
  }
  const slotCurrent = 3
  const priceHex = await provider.getStorageAt(pipAddress, slotCurrent)
  const p = storageHexToBigNumber(priceHex)
  return p[1].shiftedBy(-18)
}

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
