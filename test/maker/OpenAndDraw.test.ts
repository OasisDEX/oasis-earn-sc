import { JsonRpcProvider } from '@ethersproject/providers'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { Contract, Signer } from 'ethers'
import { ethers } from 'hardhat'

import CDPManagerABI from '../../abi/dss-cdp-manager.json'
import ERC20ABI from '../../abi/IERC20.json'
import { ADDRESSES } from '../../helpers/addresses'
import { CONTRACT_NAMES, OPERATION_NAMES } from '../../helpers/constants'
import { executeThroughProxy } from '../../helpers/deploy'
import { gasEstimateHelper } from '../../helpers/gasEstimation'
import init, { resetNode } from '../../helpers/init'
import { getLastVault, getVaultInfo } from '../../helpers/maker/vault'
import { calldataTypes } from '../../helpers/types/actions'
import { RuntimeConfig } from '../../helpers/types/common'
import { ActionFactory, amountToWei, ensureWeiFormat } from '../../helpers/utils'
import { ServiceRegistry } from '../../helpers/wrappers/serviceRegistry'
import { DeployedSystemInfo, deploySystem } from '../deploySystem'
import { expectToBeEqual } from '../utils'

const createAction = ActionFactory.create

let DAI: Contract
let WETH: Contract

describe(`Operations | Maker | ${OPERATION_NAMES.maker.OPEN_AND_DRAW}`, async () => {
  let provider: JsonRpcProvider
  let signer: Signer
  let address: string
  let system: DeployedSystemInfo
  let registry: ServiceRegistry
  let config: RuntimeConfig

  before(async () => {
    config = await init()
    provider = config.provider
    signer = config.signer
    address = config.address

    DAI = new ethers.Contract(ADDRESSES.main.DAI, ERC20ABI, provider).connect(signer)
    WETH = new ethers.Contract(ADDRESSES.main.WETH, ERC20ABI, provider).connect(signer)

    const blockNumber = 13274574
    resetNode(provider, blockNumber)

    const { system: _system, registry: _registry } = await deploySystem(config)
    system = _system
    registry = _registry
  })

  before(async () => {
    await system.common.exchange.setPrice(ADDRESSES.main.ETH, amountToWei(marketPrice).toFixed(0))
  })

  const marketPrice = new BigNumber(2380)
  const initialColl = new BigNumber(100)
  const initialDebt = new BigNumber(20000)

  const gasEstimates = gasEstimateHelper()

  const testName = `should open vault, deposit ETH, generate DAI`
  it(testName, async () => {
    await WETH.approve(system.common.userProxyAddress, amountToWei(initialColl).toFixed(0))

    const openVaultAction = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.maker.OPEN_VAULT),
      [calldataTypes.maker.Open, calldataTypes.paramsMap],
      [
        {
          joinAddress: ADDRESSES.main.maker.joinETH_A,
          mcdManager: ADDRESSES.main.maker.cdpManager,
        },
        [0],
      ],
    )

    const pullCollateralIntoProxyAction = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.common.PULL_TOKEN),
      [calldataTypes.common.PullToken, calldataTypes.paramsMap],
      [
        {
          from: config.address,
          asset: ADDRESSES.main.WETH,
          amount: new BigNumber(ensureWeiFormat(initialColl)).toFixed(0),
        },
        [0],
      ],
    )

    const depositAction = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.maker.DEPOSIT),
      [calldataTypes.maker.Deposit, calldataTypes.paramsMap],
      [
        {
          joinAddress: ADDRESSES.main.maker.joinETH_A,
          mcdManager: ADDRESSES.main.maker.cdpManager,
          vaultId: 0,
          amount: ensureWeiFormat(initialColl),
        },
        [1],
      ],
    )

    const generateAction = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.maker.GENERATE),
      [calldataTypes.maker.Generate, calldataTypes.paramsMap],
      [
        {
          to: address,
          mcdManager: ADDRESSES.main.maker.cdpManager,
          vaultId: 0,
          amount: ensureWeiFormat(initialDebt),
        },
        [1],
      ],
    )

    const ALLOWANCE = new BigNumber('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF')
    await DAI.approve(system.common.userProxyAddress, ensureWeiFormat(ALLOWANCE))

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, txReceipt] = await executeThroughProxy(
      system.common.userProxyAddress,
      {
        address: system.common.operationExecutor.address,
        calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
          [
            openVaultAction,
            pullCollateralIntoProxyAction,
            depositAction,
            generateAction,
            // paybackAction,
            // withdrawAction,
          ],
          OPERATION_NAMES.maker.OPEN_AND_DRAW,
        ]),
      },
      signer,
    )

    gasEstimates.save(testName, txReceipt)

    const vault = await getLastVault(provider, signer, system.common.userProxyAddress)
    const info = await getVaultInfo(system.maker.mcdView, vault.id, vault.ilk)

    expect(info.coll.toString()).to.equal(initialColl.toFixed(0))
    expect(info.debt.toString()).to.equal(initialDebt.toFixed(0))

    const cdpManagerContract = new ethers.Contract(
      ADDRESSES.main.maker.cdpManager,
      CDPManagerABI,
      provider,
    ).connect(signer)
    const vaultOwner = await cdpManagerContract.owns(vault.id)
    expectToBeEqual(vaultOwner, system.common.userProxyAddress)
  })

  after(() => {
    gasEstimates.print()
  })
})
