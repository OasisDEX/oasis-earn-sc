import { JsonRpcProvider } from '@ethersproject/providers'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { Contract, Signer } from 'ethers'
import { ethers } from 'hardhat'
import { operation, strategy } from 'oasis-actions'
import { ADDRESSES } from 'oasis-actions/src/helpers/addresses'
import { CONTRACT_NAMES, OPERATION_NAMES } from 'oasis-actions/src/helpers/constants'

import CDPManagerABI from '../../abi/dss-cdp-manager.json'
import ERC20ABI from '../../abi/IERC20.json'
import { executeThroughProxy } from '../../helpers/deploy'
import { gasEstimateHelper } from '../../helpers/gasEstimation'
import init, { resetNode } from '../../helpers/init'
import { getLastVault, getVaultInfo } from '../../helpers/maker/vault'
import { ServiceRegistry } from '../../helpers/serviceRegistry'
import { swapOneInchTokens } from '../../helpers/swap/1inch'
import { swapUniswapTokens } from '../../helpers/swap/uniswap'
import { RuntimeConfig } from '../../helpers/types/common'
import { amountToWei, approve, balanceOf } from '../../helpers/utils'
import { DeployedSystemInfo, deploySystem } from '../deploySystem'
import { expectToBeEqual } from '../utils'

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
  const depositAmount = amountToWei(new BigNumber(100))
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

    const calls = await strategy.openStEth(
      registry,
      ADDRESSES.main,
      {
        account: address,
        depositAmount,
        slippage: new BigNumber(0.1),
      },
      {
        provider,
        getSwapData: async (from, to, amount, slippage) => {
          const marketPrice = 0.9849
          return {
            fromTokenAddress: from,
            toTokenAddress: to,
            fromTokenAmount: amount,
            toTokenAmount: amount.times(new BigNumber(1).div(marketPrice)),
            minToTokenAmount: amount
              .times(new BigNumber(1).div(marketPrice))
              .times(new BigNumber(1).minus(slippage)), // TODO: figure out slippage
            exchangeCalldata: 0,
          }
        },
      },
    )

    // await approve(ADDRESSES.main.DAI, system.common.dsProxy.address, depositAmount, config, true)

    const x = await executeThroughProxy(
      system.common.dsProxy.address,
      {
        address: system.common.operationExecutor.address,
        calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
          calls,
          OPERATION_NAMES.common.CUSTOM_OPERATION,
        ]),
      },
      signer,
      depositAmount.toFixed(0),
    )

    console.log(x)

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
