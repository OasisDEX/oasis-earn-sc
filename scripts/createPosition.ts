import { ADDRESSES, OPERATION_NAMES, strategy } from '@oasisdex/oasis-actions'
import BigNumber from 'bignumber.js'
import { Contract } from 'ethers'

import AAVEDataProviderABI from '../abi/aaveDataProvider.json'
import AAVELendigPoolABI from '../abi/aaveLendingPool.json'
import { executeThroughProxy } from '../helpers/deploy'
import init from '../helpers/init'
import { swapOneInchTokens } from '../helpers/swap/1inch'
import { amountToWei } from '../helpers/utils'
import { deploySystem } from '../test/deploySystem'

const oneInchCallMock = async (
  from: string,
  to: string,
  amount: BigNumber,
  slippage: BigNumber,
) => {
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
}

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

async function main() {
  const config = await init()
  const { provider, signer, address } = config

  console.log('transaction address', address)

  const aaveLendingPool = new Contract(
    ADDRESSES.main.aave.MainnetLendingPool,
    AAVELendigPoolABI,
    provider,
  )

  const aaveDataProvider = new Contract(
    ADDRESSES.main.aave.DataProvider,
    AAVEDataProviderABI,
    provider,
  )

  // await provider.send('hardhat_impersonateAccount', ['0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199'])

  const depositAmount = amountToWei(new BigNumber(50))
  const multiply = new BigNumber(2)
  const slippage = new BigNumber(0.1)

  const { system } = await deploySystem(config, true, true)

  const mainnetAddresses = {
    DAI: ADDRESSES.main.DAI,
    ETH: ADDRESSES.main.ETH,
    WETH: ADDRESSES.main.WETH,
    stETH: ADDRESSES.main.stETH,
    chainlinkEthUsdPriceFeed: ADDRESSES.main.chainlinkEthUsdPriceFeed,
    aavePriceOracle: ADDRESSES.main.aavePriceOracle,
    aaveLendingPool: ADDRESSES.main.aave.MainnetLendingPool,
  }

  const addresses = {
    ...mainnetAddresses,
    operationExecutor: system.common.operationExecutor.address,
  }

  const result = await strategy.openStEth(
    {
      depositAmount,
      slippage,
      multiply,
    },
    {
      addresses,
      provider,
      getSwapData: oneInchCallMock,
      dsProxy: system.common.dsProxy.address,
    },
  )

  const [txStatus, tx] = await executeThroughProxy(
    system.common.dsProxy.address,
    {
      address: system.common.operationExecutor.address,
      calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
        result.calls,
        OPERATION_NAMES.common.CUSTOM_OPERATION,
      ]),
    },
    signer,
    depositAmount.toFixed(0),
  )

  const userAccountData: AAVEAccountData = await aaveLendingPool.getUserAccountData(
    system.common.dsProxy.address,
  )
  const userStEthReserveData: AAVEReserveData = await aaveDataProvider.getUserReserveData(
    ADDRESSES.main.stETH,
    system.common.dsProxy.address,
  )

  console.log('userAccountData', userAccountData.totalDebtETH.toString())
  console.log('userStEthReserveData', userStEthReserveData.currentATokenBalance.toString())

  console.log('txStatus', tx.transactionHash)

  console.log('stETH Address', ADDRESSES.main.stETH)
  console.log('adress', address)
  console.log('proxy', system.common.dsProxy.address)
  console.log('txStatus', txStatus)
  // console.log('tx', tx)
  console.log('userAccountData', userAccountData.totalDebtETH.toString())
  console.log('userStEthReserveData', userStEthReserveData.currentATokenBalance.toString())
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
