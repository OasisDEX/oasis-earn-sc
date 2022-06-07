import BigNumber from 'bignumber.js'
import _ from 'lodash'
import { curry } from 'ramda'
import { ethers } from 'hardhat'
import { BigNumber as EthersBN, Contract, ContractReceipt, Signer, utils } from 'ethers'
import DSProxyABI from '../../../abi/ds-proxy.json'
import WETHABI from '../../../abi/IWETH.json'
import ERC20ABI from '../../../abi/IERC20.json'
import GetCDPsABI from '../../../abi/get-cdps.json'
import { ADDRESSES } from '../../../helpers/addresses'

import { JsonRpcProvider } from '@ethersproject/providers'
import { balanceOf, WETH_ADDRESS } from '../../utils'

import { amountToWei, amountFromWei } from './params-calculation.utils'
import { getMarketPrice } from '../http-apis'
import { CDPInfo } from '../common.types'
import { logDebug } from './test.utils'
import { ZERO } from '../../../helpers/constants'
import { swapUniswapTokens } from '../../../helpers/swap'
import { getOrCreateProxy } from '../../../helpers/proxy'

export const FEE = 20
export const FEE_BASE = 10000

export interface MCDInitParams {
  blockNumber?: string
  provider?: JsonRpcProvider
  signer?: Signer
}

export interface ERC20TokenData {
  name: string
  address: string
  precision: number
  pip?: string
}

async function exchangeToToken(provider: JsonRpcProvider, signer: Signer, token: ERC20TokenData) {
  const address = await signer.getAddress()
  await swapUniswapTokens(
    ADDRESSES.main.ETH,
    token.address,
    amountToWei(200).toFixed(0),
    amountToWei(ZERO, token.precision).toFixed(0),
    address,
    { provider, signer },
  )
}

async function transferToExchange(
  provider: JsonRpcProvider,
  signer: Signer,
  exchangeAddress: string,
  token: ERC20TokenData,
  amount: BigNumber.Value,
) {
  const contract = new ethers.Contract(token.address, ERC20ABI, provider).connect(signer)

  const tokenTransferToExchangeTx = await contract.transfer(exchangeAddress, amount)

  await tokenTransferToExchangeTx.wait()
}

const addFundsDummyExchange = async function (
  provider: JsonRpcProvider,
  signer: Signer,
  weth: string, // TODO: remove
  erc20Tokens: ERC20TokenData[], // TODO:
  exchange: Contract,
  debug: boolean,
) {
  const WETH = new ethers.Contract(weth, WETHABI, provider).connect(signer)
  const address = await signer.getAddress()

  const exchangeToTokenCurried = curry(exchangeToToken)(provider, signer)
  const transferToExchangeCurried = curry(transferToExchange)(provider, signer, exchange.address)

  const wethDeposit = await WETH.deposit({
    value: amountToWei(1000).toFixed(0),
  })
  await wethDeposit.wait()

  const wethTransferToExchangeTx = await WETH.transfer(
    exchange.address,
    amountToWei(500).toFixed(0),
  )
  await wethTransferToExchangeTx.wait()

  // Exchange ETH for the `token`
  await Promise.all(erc20Tokens.map(token => exchangeToTokenCurried(token)))

  // Transfer half of the accounts balance of each token to the dummy exchange.
  await Promise.all(
    erc20Tokens.map(async token => {
      const balance = await balanceOf(token.address, address)
      return transferToExchangeCurried(token, balance.div(2).toFixed(0))
    }),
  )

  if (debug) {
    // Diplays balances of the exchange and account for each token
    await Promise.all(
      erc20Tokens.map(async function (token) {
        const [exchangeTokenBalance, addressTokenBalance] = await Promise.all([
          balanceOf(token.address, exchange.address),
          balanceOf(token.address, address),
        ])
        console.log(
          `Exchange ${token.name} balance: ${amountFromWei(
            exchangeTokenBalance,
            token.precision,
          ).toString()}`,
        )
        console.log(
          `${address} ${token.name} balance: ${amountFromWei(
            addressTokenBalance,
            token.precision,
          ).toString()}`,
        )
      }),
    )
  }
}

export async function loadDummyExchangeFixtures(
  provider: JsonRpcProvider,
  signer: Signer,
  dummyExchangeInstance: Contract,
  debug: boolean,
) {
  const tokens = [
    {
      name: 'ETH',
      address: ADDRESSES.main.common.WETH,
      pip: ADDRESSES.main.maker.pipWETH,
      precision: 18,
    },
    {
      name: 'DAI',
      address: ADDRESSES.main.common.DAI,
      pip: undefined,
      precision: 18,
    },
    {
      name: 'LINK',
      address: ADDRESSES.main.common.LINK,
      pip: ADDRESSES.main.maker.pipLINK,
      precision: 18,
    },
    {
      name: 'WBTC',
      address: ADDRESSES.main.common.WBTC,
      pip: ADDRESSES.main.maker.pipWBTC,
      precision: 8,
    },
    {
      name: 'USDC',
      address: ADDRESSES.main.USDC,
      pip: ADDRESSES.main.PIP_USDC,
      precision: 6,
    },
  ]

  // Exchanging ETH for other @tokens
  await addFundsDummyExchange(
    provider,
    signer,
    WETH_ADDRESS,
    tokens.filter(token => token.address !== ADDRESSES.main.ETH),
    dummyExchangeInstance,
    debug,
  )

  // Setting precision for each @token that is going to be used.
  await Promise.all(
    tokens.map(token => {
      if (debug) {
        console.log(`${token.name} precision: ${token.precision}`)
      }

      if (dummyExchangeInstance.setPrecision) {
        return dummyExchangeInstance.setPrecision(token.address, token.precision)
      }

      return true
    }),
  )

  // Setting price for each @token that has PIP
  await Promise.all(
    tokens
      .filter(token => !!token.pip)
      .map(async token => {
        const price = await getMarketPrice(token.address, ADDRESSES.main.DAI, token.precision)
        const priceInWei = amountToWei(price).toFixed(0)

        if (debug) {
          console.log(`${token.name} Price: ${price.toString()} and Price(wei): ${priceInWei}`)
        }

        if (dummyExchangeInstance.setPrice) {
          return dummyExchangeInstance.setPrice(token.address, priceInWei)
        }

        return true
      }),
  )

  if (debug) {
    tokens.forEach(token => {
      console.log(`${token.name}: ${token.address}`)
    })
  }
}

export interface DeployedSystemInfo {
  userProxyAddress: string
  mcdViewInstance: Contract
  exchangeInstance: Contract
  multiplyProxyActionsInstance: Contract
  dsProxyInstance: Contract
  daiTokenInstance: Contract
  gems: {
    wethTokenInstance: Contract
  }
  guni: Contract
  actionOpenVault: Contract
  actionTakeFlashLoan: Contract
  actionDeposit: Contract
  actionPayback: Contract
  actionWithdraw: Contract
  actionGenerate: Contract
  actionCdpAllow: Contract
  actionCdpDisallow: Contract
  flashLoanProvider: Contract
  operationRunner: Contract
  operationExecutor: Contract
  operationStorage: Contract
  operationData: Contract
  serviceRegistry: Contract
}

export async function deploySystem(
  provider: JsonRpcProvider,
  signer: Signer,
  usingDummyExchange = false,
  debug = false,
): Promise<DeployedSystemInfo> {
  const deployedContracts: Partial<DeployedSystemInfo> = {}

  const userProxyAddress = await getOrCreateProxy(signer)

  deployedContracts.userProxyAddress = userProxyAddress // TODO:
  deployedContracts.dsProxyInstance = new ethers.Contract(
    userProxyAddress,
    DSProxyABI,
    provider,
  ).connect(signer)

  // GUNI DEPLOYMENT
  const GUni = await ethers.getContractFactory('GuniMultiplyProxyActions', signer)
  const guni = await GUni.deploy()
  deployedContracts.guni = await guni.deployed()

  // const multiplyProxyActions = await deploy("MultiplyProxyActions");
  const mpActionFactory = await ethers.getContractFactory('MultiplyProxyActions', signer)
  const multiplyProxyActions = await mpActionFactory.deploy()
  deployedContracts.multiplyProxyActionsInstance = await multiplyProxyActions.deployed()

  const mcdViewFactory = await ethers.getContractFactory('McdView', signer)
  const mcdView = await mcdViewFactory.deploy()
  deployedContracts.mcdViewInstance = await mcdView.deployed()

  const exchangeFactory = await ethers.getContractFactory('Exchange', signer)
  const exchange = await exchangeFactory.deploy(
    multiplyProxyActions.address,
    ADDRESSES.main.feeRecipient,
    FEE,
  )
  const exchangeInstance = await exchange.deployed()

  const dummyExchangeFactory = await ethers.getContractFactory('DummyExchange', signer)
  const dummyExchange = await dummyExchangeFactory.deploy()
  const dummyExchangeInstance = await dummyExchange.deployed()

  deployedContracts.exchangeInstance = !usingDummyExchange
    ? exchangeInstance
    : dummyExchangeInstance

  await loadDummyExchangeFixtures(provider, signer, dummyExchangeInstance, debug)

  const address = await signer.getAddress()
  if (debug) {
    logDebug([
      `Signer address: ${address}`,
      `Exchange address: ${deployedContracts.exchangeInstance.address}`,
      `User Proxy Address: ${deployedContracts.userProxyAddress}`,
      `DSProxy address: ${deployedContracts.dsProxyInstance.address}`,
      `MultiplyProxyActions address: ${deployedContracts.multiplyProxyActionsInstance.address}`,
      `GuniMultiplyProxyActions address: ${guni.address}`,
      `MCDView address: ${deployedContracts.mcdViewInstance.address}`,
    ])
  }

  // ACTIONS POC deployed contracts
  const FMM = '0x1EB4CF3A948E7D72A198fe073cCb8C7a948cD853' // Maker Flash Mint Module

  const ServiceRegistry = await ethers.getContractFactory('ServiceRegistry', signer)
  const serviceRegistry = await ServiceRegistry.deploy([0])
  deployedContracts.serviceRegistry = await serviceRegistry.deployed()

  const FlashLoanProvider = await ethers.getContractFactory('FlashLoanProvider', signer)
  const flashLoanProvider = await FlashLoanProvider.deploy(serviceRegistry.address, FMM)
  deployedContracts.flashLoanProvider = await flashLoanProvider.deployed()

  const OperationRunner = await ethers.getContractFactory('OperationRunner', signer)
  const operationRunner = await OperationRunner.deploy(serviceRegistry.address, FMM)
  deployedContracts.operationRunner = await operationRunner.deployed()

  const OperationExecutor = await ethers.getContractFactory('OperationExecutor', signer)
  const operationExecutor = await OperationExecutor.deploy(serviceRegistry.address)
  deployedContracts.operationExecutor = await operationExecutor.deployed()

  const OperationStorage = await ethers.getContractFactory('OperationStorage', signer)
  const operationStorage = await OperationStorage.deploy()
  deployedContracts.operationStorage = await operationStorage.deployed()

  const OperationData = await ethers.getContractFactory('OperationData', signer)
  const operationData = await OperationData.deploy()
  deployedContracts.operationData = await operationData.deployed()

  const ActionOpenVault = await ethers.getContractFactory('OpenVault', signer)
  const actionOpenVault = await ActionOpenVault.deploy(serviceRegistry.address)
  deployedContracts.actionOpenVault = await actionOpenVault.deployed()

  const ActionTakeFlashLoan = await ethers.getContractFactory('TakeFlashloan', signer)
  const actionTakeFlashLoan = await ActionTakeFlashLoan.deploy(serviceRegistry.address)
  deployedContracts.actionTakeFlashLoan = await actionTakeFlashLoan.deployed()

  const ActionDeposit = await ethers.getContractFactory('Deposit', signer)
  const actionDeposit = await ActionDeposit.deploy(serviceRegistry.address)
  deployedContracts.actionDeposit = await actionDeposit.deployed()

  const ActionPayback = await ethers.getContractFactory('Payback', signer)
  const actionPayback = await ActionPayback.deploy(serviceRegistry.address)
  deployedContracts.actionPayback = await actionPayback.deployed()

  const ActionWithdraw = await ethers.getContractFactory('Withdraw', signer)
  const actionWithdraw = await ActionWithdraw.deploy()
  deployedContracts.actionWithdraw = await actionWithdraw.deployed()

  const ActionGenerate = await ethers.getContractFactory('Generate', signer)
  const actionGenerate = await ActionGenerate.deploy(serviceRegistry.address)
  deployedContracts.actionGenerate = await actionGenerate.deployed()

  const ActionCdpAllow = await ethers.getContractFactory('CdpAllow', signer)
  const actionCdpAllow = await ActionCdpAllow.deploy()
  deployedContracts.actionCdpAllow = await actionCdpAllow.deployed()

  const ActionCdpDisallow = await ethers.getContractFactory('CdpDisallow', signer)
  const actionCdpDisallow = await ActionCdpDisallow.deploy()
  deployedContracts.actionCdpDisallow = await actionCdpDisallow.deployed()

  await serviceRegistry.addNamedService(
    utils.keccak256(utils.toUtf8Bytes('DAI')),
    ADDRESSES.main.DAI,
  )

  await serviceRegistry.addNamedService(
    utils.keccak256(utils.toUtf8Bytes('FLASH_MINT_MODULE')),
    FMM,
  )
  await serviceRegistry.addNamedService(
    utils.keccak256(utils.toUtf8Bytes('OPERATION_RUNNER')),
    operationRunner.address,
  )
  await serviceRegistry.addNamedService(
    utils.keccak256(utils.toUtf8Bytes('OPERATION_EXECUTOR')),
    operationExecutor.address,
  )
  await serviceRegistry.addNamedService(
    utils.keccak256(utils.toUtf8Bytes('OPERATION_STORAGE')),
    operationStorage.address,
  )
  await serviceRegistry.addNamedService(
    utils.keccak256(utils.toUtf8Bytes('FLASHLOAN')),
    actionTakeFlashLoan.address,
  )
  await serviceRegistry.addNamedService(
    utils.keccak256(utils.toUtf8Bytes('OPEN_VAULT')),
    actionOpenVault.address,
  )
  await serviceRegistry.addNamedService(
    utils.keccak256(utils.toUtf8Bytes('GENERATE')),
    actionGenerate.address,
  )
  await serviceRegistry.addNamedService(
    utils.keccak256(utils.toUtf8Bytes('DEPOSIT')),
    actionDeposit.address,
  )
  await serviceRegistry.addNamedService(
    utils.keccak256(utils.toUtf8Bytes('PAYBACK')),
    actionPayback.address,
  )
  await serviceRegistry.addNamedService(
    utils.keccak256(utils.toUtf8Bytes('WITHDRAW')),
    actionWithdraw.address,
  )
  await serviceRegistry.addNamedService(
    utils.keccak256(utils.toUtf8Bytes('CDP_ALLOW')),
    actionCdpAllow.address,
  )
  await serviceRegistry.addNamedService(
    utils.keccak256(utils.toUtf8Bytes('CDP_DISALLOW')),
    actionCdpDisallow.address,
  )
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
