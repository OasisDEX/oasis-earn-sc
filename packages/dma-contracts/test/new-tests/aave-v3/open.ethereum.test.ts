import { mainnetConfig } from '@oasisdex/deploy-configurations/configs'
import { getOneInchCall } from '@oasisdex/dma-common/test-utils'
import {
  AaveOpenArgs,
  AaveOpenSharedDependencies,
  RiskRatio,
  strategies,
  WithV3Addresses,
} from '@oasisdex/dma-library'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { ethers } from 'hardhat'

describe('Open Aave v3 strategy | Ethereum | new-tests', async () => {
  it('Should open a position', async () => {
    const signer = await ethers.provider.getSigner()

    const accountFactory = await ethers.getContractAt(
      'AccountFactory',
      mainnetConfig.mpa.core.AccountFactory.address,
      signer,
    )

    const response = await accountFactory['createAccount()']()

    const accountResult = await response.wait()
    const event = accountResult.events?.find(e => e.event === 'AccountCreated')
    if (!event) {
      throw new Error('No AccountCreated event found in receipt')
    }
    const proxyAddress = event.args?.proxy as string
    if (!proxyAddress) {
      throw new Error('No proxy address found in AccountCreated event')
    }

    const amountToDeposit = new BigNumber(10).pow(18)

    const args: AaveOpenArgs = {
      debtToken: {
        symbol: 'USDC',
        precision: 6,
      },
      collateralToken: {
        symbol: 'ETH',
        precision: 18,
      },
      slippage: new BigNumber(0.2),
      multiple: new RiskRatio(new BigNumber(2), 'MULITPLE' as any),
      positionType: 'Multiply',
      depositedByUser: {
        collateralToken: {
          amountInBaseUnit: amountToDeposit,
        },
      },
    }
    const dependencies: AaveOpenSharedDependencies & WithV3Addresses = {
      network: 'mainnet' as any,
      addresses: {
        DAI: mainnetConfig.common.DAI.address,
        ETH: mainnetConfig.common.ETH.address,
        WETH: mainnetConfig.common.WETH.address,
        USDC: mainnetConfig.common.USDC.address,
        WBTC: mainnetConfig.common.WBTC.address,
        WSTETH: mainnetConfig.common.WSTETH.address,
        CBETH: mainnetConfig.common.CBETH.address,
        RETH: mainnetConfig.common.RETH.address,
        pool: mainnetConfig.aave.v3.Pool.address,
        aaveOracle: mainnetConfig.aave.v3.AaveOracle.address,
        operationExecutor: mainnetConfig.mpa.core.OperationExecutor.address,
        chainlinkEthUsdPriceFeed: mainnetConfig.common.ChainlinkPriceOracle_ETHUSD.address,
        poolDataProvider: mainnetConfig.aave.v3.AavePoolDataProvider.address,
      },
      provider: ethers.provider,
      user: await signer.getAddress(),
      proxy: proxyAddress,
      isDPMProxy: true,
      getSwapData: getOneInchCall(mainnetConfig.mpa.core.Swap.address),
    }
    const transition = await strategies.aave.v3.open(args, dependencies)

    const operationExecutor = await ethers.getContractAt(
      'OperationExecutor',
      mainnetConfig.mpa.core.OperationExecutor.address,
      signer,
    )

    const encodedCallData = operationExecutor.interface.encodeFunctionData('executeOp', [
      transition.transaction.calls,
      transition.transaction.operationName,
    ])

    const accountImplementation = await ethers.getContractAt('AccountImplementation', proxyAddress)

    const opResult = await accountImplementation.execute(
      operationExecutor.address,
      encodedCallData,
      {
        value: ethers.utils.parseEther('10').toHexString(),
        gasLimit: ethers.BigNumber.from(10000000),
      },
    )

    console.log(`Current status: ${opResult.from}`)

    const oo = await opResult.wait()

    expect(oo.status).to.eq(1)
  })
})
