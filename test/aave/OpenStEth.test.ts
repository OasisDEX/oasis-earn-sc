import { JsonRpcProvider } from '@ethersproject/providers'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { Contract, Signer } from 'ethers'
import { ethers } from 'hardhat'

import CDPManagerABI from '../../abi/dss-cdp-manager.json'
import ERC20ABI from '../../abi/IERC20.json'
import { makeActions } from '../../helpers/actions'
import { ADDRESSES } from '../../helpers/addresses'
import { CONTRACT_NAMES, OPERATION_NAMES } from '../../helpers/constants'
import { executeThroughProxy } from '../../helpers/deploy'
import { gasEstimateHelper } from '../../helpers/gasEstimation'
import init, { resetNode } from '../../helpers/init'
import { getLastVault, getVaultInfo } from '../../helpers/maker/vault'
import { makeOperation } from '../../helpers/operations/operations'
import { swapOneInchTokens } from '../../helpers/swap/1inch'
import { swapUniswapTokens } from '../../helpers/swap/uniswap'
import { calldataTypes } from '../../helpers/types/actions'
import { RuntimeConfig } from '../../helpers/types/common'
import { ActionFactory, amountToWei, approve, balanceOf } from '../../helpers/utils'
import { ServiceRegistry } from '../../helpers/wrappers/serviceRegistry'
import { DeployedSystemInfo, deploySystem } from '../deploySystem'
import { expectToBeEqual } from '../utils'

const createAction = ActionFactory.create

let DAI: Contract
let WETH: Contract
let stETH: Contract

describe(`Operations | AAVE | ${OPERATION_NAMES.aave.OPEN_POSITION}`, async () => {
  let provider: JsonRpcProvider
  let signer: Signer
  let address: string
  let system: DeployedSystemInfo
  let registry: ServiceRegistry
  let config: RuntimeConfig
  let options: any

  before(async () => {
    config = await init()
    provider = config.provider
    signer = config.signer
    address = config.address

    options = {
      debug: true,
      config,
    }

    const blockNumber = 15191046
    resetNode(provider, blockNumber)

    const { system: _system, registry: _registry } = await deploySystem(config)
    system = _system
    registry = _registry
  })

  const flashloanAmount = amountToWei(new BigNumber(1000000))
  const depositAmount = amountToWei(new BigNumber(200000))
  const borrowAmount = amountToWei(new BigNumber(5))

  const testName = `should open stEth position`

  it.only(testName, async () => {
    // Transfer stETH to exchange for Swap

    const toImpersonate = '0xdc24316b9ae028f1497c275eb9192a3ea0f67022'
    await provider.send('hardhat_impersonateAccount', [toImpersonate])
    const account = ethers.provider.getSigner(toImpersonate)
    const accountAddress = await account.getAddress()
    stETH = new ethers.Contract(ADDRESSES.main.stETH, ERC20ABI, provider).connect(account)
    const bal = await stETH.balanceOf(accountAddress)
    await stETH.transfer(system.common.exchange.address, bal)
    await provider.send('hardhat_stopImpersonatingAccount', [toImpersonate])

    const operations = await makeOperation(registry, ADDRESSES.main)

    const calls = await operations.openStEth({
      account: address,
      depositAmount,
      flashloanAmount,
      borrowAmount,
      fee: 0,
      swapData: 0,
      receiveAtLeast: new BigNumber(1),
    })

    await approve(ADDRESSES.main.DAI, system.common.dsProxy.address, depositAmount, config, true)

    await executeThroughProxy(
      system.common.dsProxy.address,
      {
        address: system.common.operationExecutor.address,
        calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
          calls,
          OPERATION_NAMES.common.CUSTOM_OPERATION,
        ]),
      },
      signer,
    )

    expectToBeEqual(await balanceOf(ADDRESSES.main.ETH, system.common.dsProxy.address, options), 0)
    expectToBeEqual(
      await balanceOf(ADDRESSES.main.aDAI, system.common.dsProxy.address, options),
      depositAmount.toFixed(),
    )
    expectToBeEqual(
      await balanceOf(ADDRESSES.main.variableDebtWETH, system.common.dsProxy.address, options),
      borrowAmount.toFixed(),
    )
  })
})
