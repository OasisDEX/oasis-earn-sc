import { JsonRpcProvider } from '@ethersproject/providers'
import { action, ADDRESSES, OPERATION_NAMES, strategy, ZERO } from '@oasisdex/oasis-actions'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { Contract, ContractReceipt, Signer } from 'ethers'

import AAVEDataProviderABI from '../../abi/aaveDataProvider.json'
import AAVELendigPoolABI from '../../abi/aaveLendingPool.json'
import ERC20ABI from '../../abi/IERC20.json'
import { executeThroughProxy } from '../../helpers/deploy'
import init, { resetNode, resetNodeToLatestBlock } from '../../helpers/init'
import { swapOneInchTokens } from '../../helpers/swap/1inch'
import { RuntimeConfig } from '../../helpers/types/common'
import { amountToWei, balanceOf } from '../../helpers/utils'
import { testBlockNumber } from '../config'
import { DeployedSystemInfo, deploySystem } from '../deploySystem'
import { expectToBe, expectToBeEqual } from '../utils'

const getOneInchRealCall =
  (swapAddress: string) =>
  async (from: string, to: string, amount: BigNumber, slippage: BigNumber) => {
    const response = await swapOneInchTokens(
      from,
      to,
      amount.toString(),
      swapAddress,
      slippage.toString(),
    )

    return {
      toTokenAddress: to,
      fromTokenAddress: from,
      minToTokenAmount: new BigNumber(0),
      toTokenAmount: new BigNumber(response.toTokenAmount),
      fromTokenAmount: new BigNumber(response.fromTokenAmount),
      exchangeCalldata: response.tx.data,
    }
  }

interface AAVEReserveData {
  currentATokenBalance: BigNumber
  currentStableDebt: BigNumber
  currentVariableDebt: BigNumber
  principalStableDebt: BigNumber
  scaledVariableDebt: BigNumber
  stableBorrowRate: BigNumber
  liquidityRate: BigNumber
}

interface AAVEAccountData {
  totalCollateralETH: BigNumber
  totalDebtETH: BigNumber
  availableBorrowsETH: BigNumber
  currentLiquidationThreshold: BigNumber
  ltv: BigNumber
  healthFactor: BigNumber
}

describe.only(`OneInch tests`, async () => {
  let provider: JsonRpcProvider
  let config: RuntimeConfig
  let signer: Signer
  let address: string
  let system: DeployedSystemInfo

  const mainnetAddresses = {
    DAI: ADDRESSES.main.DAI,
    ETH: ADDRESSES.main.ETH,
    WETH: ADDRESSES.main.WETH,
    stETH: ADDRESSES.main.stETH,
    chainlinkEthUsdPriceFeed: ADDRESSES.main.chainlinkEthUsdPriceFeed,
    aavePriceOracle: ADDRESSES.main.aavePriceOracle,
    aaveLendingPool: ADDRESSES.main.aave.MainnetLendingPool,
  }

  const ethSwapAmount = amountToWei(new BigNumber(10))
  const slippage = new BigNumber(0.1)

  let txStatus: boolean

  let WETH: Contract
  let stETH: Contract

  before(async () => {
    config = await init()
    provider = config.provider
    signer = config.signer
    address = config.address

    WETH = new Contract(ADDRESSES.main.WETH, ERC20ABI, provider)
    stETH = new Contract(ADDRESSES.main.stETH, ERC20ABI, provider)

    await resetNodeToLatestBlock(provider)
    const { system: _system } = await deploySystem(config, false, false)
    system = _system

    const responseWethToStEth = await swapOneInchTokens(
      ADDRESSES.main.WETH,
      ADDRESSES.main.stETH,
      ethSwapAmount.toFixed(),
      system.common.swap.address,
      slippage.toString(),
    )
    const swapEthToStEth = action.common.swap({
      fromAsset: ADDRESSES.main.WETH,
      toAsset: ADDRESSES.main.stETH,
      amount: ethSwapAmount,
      receiveAtLeast: amountToWei(new BigNumber(8)),
      fee: 20,
      withData: responseWethToStEth.tx.data,
      collectFeeInFromToken: false,
    })

    const setDaiApprovalOnLendingPool = action.common.setApproval(
      {
        amount: 0,
        asset: ADDRESSES.main.stETH,
        delegator: ADDRESSES.main.aave.MainnetLendingPool,
      },
      [0, 0, 1],
    )

    const aaweDeposit = action.aave.aaveDeposit(
      {
        amount: 0,
        asset: ADDRESSES.main.stETH,
      },
      [0, 1],
    )

    const [tx, log] = await executeThroughProxy(
      system.common.dsProxy.address,
      {
        address: system.common.operationExecutor.address,
        calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
          [swapEthToStEth, setDaiApprovalOnLendingPool, aaweDeposit],
          OPERATION_NAMES.common.CUSTOM_OPERATION,
        ]),
      },
      signer,
      ethSwapAmount.toFixed(0),
    )

    const stEthBalanceAfter = await balanceOf(ADDRESSES.main.stETH, system.common.dsProxy.address, {
      config,
    })

    console.log(stEthBalanceAfter.toString(), 'STETH balance after')

    // const [tx2, log2] = await executeThroughProxy(
    //   system.common.dsProxy.address,
    //   {
    //     address: system.common.operationExecutor.address,
    //     calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
    //       [swapToEth],
    //       OPERATION_NAMES.common.CUSTOM_OPERATION,
    //     ]),
    //   },
    //   signer,
    //   ethSwapAmount.toFixed(0),
    // )

    console.log(stEthBalanceAfter.toString(), 'stETH balance')

    txStatus = tx

    console.log(tx)
  })

  it('TEST', async () => {
    expect(txStatus).to.be.true
  })
})
