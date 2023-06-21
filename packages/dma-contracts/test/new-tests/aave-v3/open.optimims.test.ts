import { optimismConfig } from '@oasisdex/deploy-configurations/configs'
import { getOneInchCall, optimismLiquidityProviders } from '@oasisdex/dma-common/test-utils'
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

describe('Open Aave v3 strategy | new-tests-optimism', async () => {
  it('Should open a position', async () => {
    const signer = await ethers.provider.getSigner()

    const accountFactory = await ethers.getContractAt(
      'AccountFactory',
      optimismConfig.mpa.core.AccountFactory.address,
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
      slippage: new BigNumber(0.3),
      multiple: new RiskRatio(new BigNumber(1.4), 'MULITPLE' as any),
      positionType: 'Multiply',
      depositedByUser: {
        collateralToken: {
          amountInBaseUnit: amountToDeposit,
        },
      },
    }
    const dependencies: AaveOpenSharedDependencies & WithV3Addresses = {
      network: 'optimism' as any,
      addresses: {
        DAI: optimismConfig.common.DAI.address,
        ETH: optimismConfig.common.ETH.address,
        WETH: optimismConfig.common.WETH.address,
        USDC: optimismConfig.common.USDC.address,
        WBTC: optimismConfig.common.WBTC.address,
        WSTETH: optimismConfig.common.WSTETH.address,
        CBETH: optimismConfig.common.CBETH.address,
        RETH: optimismConfig.common.RETH.address,
        pool: optimismConfig.aave.v3.Pool.address,
        aaveOracle: optimismConfig.aave.v3.AaveOracle.address,
        operationExecutor: optimismConfig.mpa.core.OperationExecutor.address,
        chainlinkEthUsdPriceFeed: optimismConfig.common.ChainlinkPriceOracle_ETHUSD.address,
        poolDataProvider: optimismConfig.aave.v3.AavePoolDataProvider.address,
      },
      provider: ethers.provider,
      user: await signer.getAddress(),
      proxy: proxyAddress,
      isDPMProxy: true,
      getSwapData: getOneInchCall(
        optimismConfig.mpa.core.Swap.address,
        optimismLiquidityProviders.filter(l => l !== 'OPTIMISM_BALANCER_V2'),
        10,
        'v5.0',
      ),
    }
    const transition = await strategies.aave.v3.open(args, dependencies)

    const operationExecutor = await ethers.getContractAt(
      'OperationExecutor',
      optimismConfig.mpa.core.OperationExecutor.address,
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
