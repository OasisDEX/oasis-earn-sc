import { JsonRpcProvider } from '@ethersproject/providers'
import {
  ActionFactory,
  ADDRESSES,
  calldataTypes,
  CONTRACT_NAMES,
  OPERATION_NAMES,
} from '@oasisdex/oasis-actions'
import BigNumber from 'bignumber.js'
import { loadFixture } from 'ethereum-waffle'
import { Contract, Signer } from 'ethers'
import { ethers } from 'hardhat'

import CDPManagerABI from '../../abi/dss-cdp-manager.json'
import ERC20ABI from '../../abi/IERC20.json'
import { executeThroughProxy } from '../../helpers/deploy'
import { GasEstimateHelper, gasEstimateHelper } from '../../helpers/gasEstimation'
import { getLastVault, getVaultInfo } from '../../helpers/maker/vault'
import { restoreSnapshot } from '../../helpers/restoreSnapshot'
import { ServiceRegistry } from '../../helpers/serviceRegistry'
import { RuntimeConfig } from '../../helpers/types/common'
import { amountToWei, ensureWeiFormat } from '../../helpers/utils'
import { testBlockNumber } from '../config'
import { DeployedSystemInfo } from '../deploySystem'
import { initialiseConfig } from '../fixtures/setup'
import { expectToBe, expectToBeEqual } from '../utils'

const createAction = ActionFactory.create

let DAI: Contract
let WETH: Contract

describe(`Operations | Maker | Open Position`, async () => {
  const marketPrice = new BigNumber(1582)

  let provider: JsonRpcProvider
  let signer: Signer
  let address: string
  let system: DeployedSystemInfo
  let registry: ServiceRegistry
  let config: RuntimeConfig

  beforeEach(async () => {
    ;({ config, provider, signer, address } = await loadFixture(initialiseConfig))

    DAI = new ethers.Contract(ADDRESSES.mainnet.DAI, ERC20ABI, provider).connect(signer)
    WETH = new ethers.Contract(ADDRESSES.mainnet.WETH, ERC20ABI, provider).connect(signer)

    const { snapshot } = await restoreSnapshot({
      config,
      provider,
      blockNumber: testBlockNumber,
      useFallbackSwap: true,
    })

    system = snapshot.deployed.system
    registry = snapshot.deployed.registry

    await system.common.exchange.setPrice(ADDRESSES.mainnet.ETH, amountToWei(marketPrice).toFixed(0))
  })

  let gasEstimates: GasEstimateHelper

  it(`should open vault, deposit ETH, generate DAI`, async () => {
    // Test set up values
    const initialColl = new BigNumber(100)
    const initialDebt = new BigNumber(20000)

    gasEstimates = gasEstimateHelper()

    await WETH.approve(system.common.userProxyAddress, amountToWei(initialColl).toFixed(0))

    const openVaultAction = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.maker.OPEN_VAULT),
      [calldataTypes.maker.Open, calldataTypes.paramsMap],
      [
        {
          joinAddress: ADDRESSES.mainnet.maker.joinETH_A,
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
          asset: ADDRESSES.mainnet.WETH,
          amount: new BigNumber(ensureWeiFormat(initialColl)).toFixed(0),
        },
        [0, 0, 0],
      ],
    )

    const depositAction = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.maker.DEPOSIT),
      [calldataTypes.maker.Deposit, calldataTypes.paramsMap],
      [
        {
          joinAddress: ADDRESSES.mainnet.maker.joinETH_A,
          vaultId: 0,
          amount: ensureWeiFormat(initialColl),
        },
        [0, 1, 0],
      ],
    )

    const generateAction = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.maker.GENERATE),
      [calldataTypes.maker.Generate, calldataTypes.paramsMap],
      [
        {
          to: address,
          vaultId: 0,
          amount: ensureWeiFormat(initialDebt),
        },
        [0, 1, 0],
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
          [openVaultAction, pullCollateralIntoProxyAction, depositAction, generateAction],
          OPERATION_NAMES.maker.OPEN_AND_DRAW,
        ]),
      },
      signer,
    )

    gasEstimates.save(txReceipt)

    const vault = await getLastVault(provider, signer, system.common.userProxyAddress)
    const info = await getVaultInfo(system.maker.mcdView, vault.id, vault.ilk)

    const precision = 18 - 1 // To account for precision loss in Maker Vat
    expectToBe(info.coll.toFixed(precision), 'gte', initialColl.toFixed(precision))
    expectToBeEqual(info.debt.toFixed(precision), initialDebt.toFixed(precision))

    const cdpManagerContract = new ethers.Contract(
      ADDRESSES.mainnet.maker.cdpManager,
      CDPManagerABI,
      provider,
    ).connect(signer)
    const vaultOwner = await cdpManagerContract.owns(vault.id)
    expectToBeEqual(vaultOwner, system.common.userProxyAddress)
  })

  afterEach(() => {
    gasEstimates.print()
  })
})
