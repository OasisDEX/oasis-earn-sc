import { JsonRpcProvider } from '@ethersproject/providers'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { Contract, Signer } from 'ethers'
import { strategy } from 'oasis-actions'
import { ADDRESSES } from 'oasis-actions/src/helpers/addresses'
import { CONTRACT_NAMES, OPERATION_NAMES } from 'oasis-actions/src/helpers/constants'

import AAVELendigPoolABI from '../../abi/aaveLendingPool.json'
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

  // Apparently there is not enough liquidity (at tested block) to deposit > 100ETH`
  const depositAmount = amountToWei(new BigNumber(60))

  const testName = `should open stEth position`

  it.only(testName, async () => {
    const { calls, multiply } = await strategy.openStEth(
      {
        DAI: ADDRESSES.main.DAI,
        ETH: ADDRESSES.main.ETH,
        WETH: ADDRESSES.main.WETH,
        stETH: ADDRESSES.main.stETH,
        operationExecutor: system.common.operationExecutor.address,
        chainlinkEthUsdPriceFeed: ADDRESSES.main.chainlinkEthUsdPriceFeed,
        aavePriceOracle: ADDRESSES.main.aavePriceOracle,
        aaveLendingPool: ADDRESSES.main.aave.MainnetLendingPool,
      },
      {
        depositAmount,
        slippage: new BigNumber(0.1),
      },
      {
        provider,
        getSwapData: async (from, to, amount, slippage) => {
          const marketPrice = 0.979
          return {
            fromTokenAddress: from,
            toTokenAddress: to,
            fromTokenAmount: amount,
            toTokenAmount: amount.div(marketPrice),
            minToTokenAmount: amount
              .div(marketPrice)
              .times(new BigNumber(1).minus(slippage))
              .integerValue(BigNumber.ROUND_DOWN), // TODO: figure out slippage
            exchangeCalldata: 0,
          }
        },
      },
    )

    const [success] = await executeThroughProxy(
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

    const aaveLendingPool = new Contract(
      ADDRESSES.main.aave.MainnetLendingPool,
      AAVELendigPoolABI,
      provider,
    )

    const userAccountData = await aaveLendingPool.getUserAccountData(system.common.dsProxy.address)

    console.log(`
      totalCollateralETH: ${userAccountData.totalCollateralETH.toString()}
      totalDebtETH: ${userAccountData.totalDebtETH.toString()}
      availableBorrowsETH: ${userAccountData.availableBorrowsETH.toString()}
      currentLiquidationThreshold: ${userAccountData.currentLiquidationThreshold.toString()}
      ltv: ${userAccountData.ltv.toString()}
      healthFactor: ${userAccountData.healthFactor.toString()}
    `)

    expect(success, 'Transaction should be successful').to.be.true

    expectToBeEqual(
      multiply.times(depositAmount).minus(depositAmount),
      new BigNumber(userAccountData.totalDebtETH.toString()),
    )
  })
})
