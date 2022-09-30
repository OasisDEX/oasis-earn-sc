import { ADDRESSES, CONTRACT_NAMES, OPERATION_NAMES, strategy } from '@oasisdex/oasis-actions'
import BigNumber from 'bignumber.js'
import { task } from 'hardhat/config'

import AAVEDataProviderABI from '../../abi/aaveDataProvider.json'
import AAVELendigPoolABI from '../../abi/aaveLendingPool.json'
import DSProxyABI from '../../abi/ds-proxy.json'
import { AAVEAccountData, AAVEReserveData } from '../../helpers/aave'
import { executeThroughProxy } from '../../helpers/deploy'
import init from '../../helpers/init'
import { getOrCreateProxy } from '../../helpers/proxy'
import { oneInchCallMock } from '../../helpers/swap/OneInchCallMock'
import { balanceOf } from '../../helpers/utils'

function amountToWei(amount: BigNumber.Value, precision = 18) {
  BigNumber.config({ EXPONENTIAL_AT: 30 })
  return new BigNumber(amount || 0).times(new BigNumber(10).pow(precision))
}

task('createPosition', 'Create stETH position on AAVE').setAction(async (taskArgs, hre) => {
  const config = await init(hre)

  const mainnetAddresses = {
    DAI: ADDRESSES.main.DAI,
    ETH: ADDRESSES.main.ETH,
    WETH: ADDRESSES.main.WETH,
    stETH: ADDRESSES.main.stETH,
    chainlinkEthUsdPriceFeed: ADDRESSES.main.chainlinkEthUsdPriceFeed,
    aavePriceOracle: ADDRESSES.main.aavePriceOracle,
    aaveLendingPool: ADDRESSES.main.aave.MainnetLendingPool,
    operationExecutor: '0x3C1Cb427D20F15563aDa8C249E71db76d7183B6c', // TODO: get from service registry
  }
  const aaveLendingPool = new hre.ethers.Contract(
    ADDRESSES.main.aave.MainnetLendingPool,
    AAVELendigPoolABI,
    config.provider,
  )
  const aaveDataProvider = new hre.ethers.Contract(
    ADDRESSES.main.aave.DataProvider,
    AAVEDataProviderABI,
    config.provider,
  )

  const proxyAddress = await getOrCreateProxy(config.signer)

  const dsProxy = new hre.ethers.Contract(proxyAddress, DSProxyABI, config.provider).connect(
    config.signer,
  )

  console.log(`Proxy Address for account: ${proxyAddress}`)

  const depositAmount = amountToWei(new BigNumber(60))
  const multiply = new BigNumber(2)
  const slippage = new BigNumber(0.1)

  const strategyReturn = await strategy.aave.openStEth(
    {
      depositAmount,
      slippage,
      multiply,
    },
    {
      addresses: mainnetAddresses,
      provider: config.provider,
      getSwapData: oneInchCallMock,
      dsProxy: dsProxy.address,
    },
  )

  const operationExecutorFactory = await hre.ethers.getContractFactory(
    CONTRACT_NAMES.common.OPERATION_EXECUTOR,
    config.signer,
  )
  const operationExecutor = await operationExecutorFactory.attach(
    mainnetAddresses.operationExecutor,
  )

  const [txStatus, tx] = await executeThroughProxy(
    dsProxy.address,
    {
      address: mainnetAddresses.operationExecutor,
      calldata: operationExecutor.interface.encodeFunctionData('executeOp', [
        strategyReturn.calls,
        OPERATION_NAMES.common.CUSTOM_OPERATION,
      ]),
    },
    config.signer,
    depositAmount.toFixed(0),
  )

  const userAccountData: AAVEAccountData = await aaveLendingPool.getUserAccountData(dsProxy.address)
  const userStEthReserveData: AAVEReserveData = await aaveDataProvider.getUserReserveData(
    ADDRESSES.main.stETH,
    dsProxy.address,
  )

  const proxyStEthBalance = await balanceOf(
    ADDRESSES.main.stETH,
    dsProxy.address,
    {
      config,
      isFormatted: true,
    },
    hre,
  )

  const proxyEthBalance = await balanceOf(
    ADDRESSES.main.ETH,
    dsProxy.address,
    { config, isFormatted: true },
    hre,
  )

  console.log('userAccountData', userAccountData.totalDebtETH.toString())
  console.log('userStEthReserveData', userStEthReserveData.currentATokenBalance.toString())
  console.log('txStatus', txStatus)
  console.log('txHash', tx.transactionHash)
  console.log('proxyStEthBalance', proxyStEthBalance.toString())
  console.log('proxyEthBalance', proxyEthBalance.toString())
})
