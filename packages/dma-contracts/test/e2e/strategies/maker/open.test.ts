import { testBlockNumber } from '@dma-contracts/test/config'
import { initialiseConfig } from '@dma-contracts/test/fixtures'
import { Contract } from '@ethersproject/contracts'
import { JsonRpcProvider } from '@ethersproject/providers'
import CDPManagerABI from '@oasisdex/abis/external/protocols/maker/dss-cdp-manager.json'
import ERC20ABI from '@oasisdex/abis/external/tokens/IERC20.json'
import { ADDRESSES } from '@oasisdex/addresses'
import { CONTRACT_NAMES, OPERATION_NAMES } from '@oasisdex/dma-common/constants'
import {
  expect,
  GasEstimateHelper,
  gasEstimateHelper,
  restoreSnapshot,
} from '@oasisdex/dma-common/test-utils'
import { DeployedSystemInfo } from '@oasisdex/dma-common/test-utils/deploy-system'
import { RuntimeConfig } from '@oasisdex/dma-common/types/common'
import { amountToWei, ensureWeiFormat } from '@oasisdex/dma-common/utils/common'
import { executeThroughProxy } from '@oasisdex/dma-common/utils/execute'
import { getLastVault, getVaultInfo } from '@oasisdex/dma-common/utils/maker/vault'
import { Network } from '@oasisdex/dma-deployments/types/network'
import { ServiceRegistry } from '@oasisdex/dma-deployments/utils/wrappers'
import { ActionFactory, calldataTypes } from '@oasisdex/dma-library'
import BigNumber from 'bignumber.js'
import { loadFixture } from 'ethereum-waffle'
import { ethers, Signer } from 'ethers'

const createAction = ActionFactory.create

let DAI: Contract
let WETH: Contract

/**
 * Skipped until Maker operations more relevant.
 * Also fails due to issue with getOracleProvider and hardhat version.
 * Requires hardhat v2.9.5 or greater
 * Currently only hardhat v2.8.0 is tested as working well with tenderly export
 * */
describe.skip(`Operations | Maker | Open Position | E2E`, async () => {
  const marketPrice = new BigNumber(1582)

  let provider: JsonRpcProvider
  let signer: Signer
  let address: string
  let system: DeployedSystemInfo
  let registry: ServiceRegistry
  let config: RuntimeConfig

  beforeEach(async () => {
    ;({ config, provider, signer, address } = await loadFixture(initialiseConfig))

    DAI = new ethers.Contract(ADDRESSES[Network.MAINNET].common.DAI, ERC20ABI, provider).connect(
      signer,
    )
    WETH = new ethers.Contract(ADDRESSES[Network.MAINNET].common.WETH, ERC20ABI, provider).connect(
      signer,
    )

    const { snapshot } = await restoreSnapshot({
      config,
      provider,
      blockNumber: testBlockNumber,
      useFallbackSwap: true,
    })

    system = snapshot.deployed.system
    registry = snapshot.deployed.registry

    await system.common.exchange.setPrice(
      ADDRESSES[Network.MAINNET].common.ETH,
      amountToWei(marketPrice).toFixed(0),
    )
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
          joinAddress: ADDRESSES[Network.MAINNET].maker.joinETH_A,
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
          asset: ADDRESSES[Network.MAINNET].common.WETH,
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
          joinAddress: ADDRESSES[Network.MAINNET].maker.joinETH_A,
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

    const [, txReceipt] = await executeThroughProxy(
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
    expect.toBe(info.coll.toFixed(precision), 'gte', initialColl.toFixed(precision))
    expect.toBeEqual(info.debt.toFixed(precision), initialDebt.toFixed(precision))

    const cdpManagerContract = new ethers.Contract(
      ADDRESSES[Network.MAINNET].maker.cdpManager,
      CDPManagerABI,
      provider,
    ).connect(signer)
    const vaultOwner = await cdpManagerContract.owns(vault.id)
    expect.toBeEqual(vaultOwner, system.common.userProxyAddress)
  })

  afterEach(() => {
    gasEstimates.print()
  })
})
