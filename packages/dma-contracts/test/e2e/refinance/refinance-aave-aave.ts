import { ADDRESSES } from '@deploy-configurations/addresses'
import { Address } from '@deploy-configurations/types/address'
import { DeployedSystem } from '@deploy-configurations/types/deployed-system'
import { Network } from '@deploy-configurations/types/network'
import { getNetwork } from '@deploy-configurations/utils/network'
import { addressesByNetwork, asPercentageValue, mockExchangeGetData } from '@dma-common/test-utils'
import { RuntimeConfig } from '@dma-common/types/common'
import { executeThroughDPMProxy } from '@dma-common/utils/execute'
import { DeploymentSystem } from '@dma-contracts/scripts/deployment/deploy'
import { testBlockNumberForAaveV3 } from '@dma-contracts/test/config'
import { createETHPositionAAVEv3 } from '@dma-contracts/test/utils/aave/aave.operation.create-position'
import { getMaxDebtToBorrow } from '@dma-contracts/test/utils/aave/debt-calculation'
import { restoreSnapshot, Snapshot, TestDeploymentSystem, TestHelpers } from '@dma-contracts/utils'
import { applyPercentage, toSolidityPercentage } from '@dma-contracts/utils/percentage.utils'
import { sendImpersonateFunds } from '@dma-contracts/utils/send-impersonate-funds'
import { AaveLikeStrategyAddresses } from '@dma-library/operations/aave-like'
import {
  getRefinanceOperation,
  getRefinanceOperationDefinition,
} from '@dma-library/operations/refinance'
import { RefinanceOperationArgs } from '@dma-library/operations/refinance/types'
import { getAaveLikeSystemContracts, getContract } from '@dma-library/protocols/aave-like/utils'
import { FlashloanProvider } from '@dma-library/types'
import { encodeOperation } from '@dma-library/utils/operation'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ERC20, ERC20__factory, MockExchange, Swap, WETH, WETH__factory } from '@typechain'
import { BigNumber as BigNumberJS } from 'bignumber.js'
import { assert, expect } from 'chai'
import { ethers } from 'ethers'
import hre from 'hardhat'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

async function fetchAAVEContracts(
  hre: HardhatRuntimeEnvironment,
  system: DeployedSystem,
  network: Network,
) {
  const addresses = addressesByNetwork(network)

  const aaveLikeAddresses = {
    tokens: {
      WETH: addresses.WETH,
      DAI: addresses.DAI,
      USDC: addresses.USDC,
      ETH: addresses.ETH,
    },
    operationExecutor: system.OperationExecutor.contract.address,
    chainlinkEthUsdPriceFeed: addresses.chainlinkEthUsdPriceFeed,
    oracle: addresses.aaveOracle,
    lendingPool: addresses.pool,
    poolDataProvider: addresses.poolDataProvider,
  }

  return await getAaveLikeSystemContracts(aaveLikeAddresses, hre.ethers.provider, 'AAVE_V3')
}

async function fundMockExchange(
  hre: HardhatRuntimeEnvironment,
  ds: DeploymentSystem,
  helpers: TestHelpers, // eslint-disable-line @typescript-eslint/no-unused-vars
  extraDeployment: any, // eslint-disable-line @typescript-eslint/no-unused-vars
  useFallbackSwap: boolean, // eslint-disable-line @typescript-eslint/no-unused-vars
) {
  const whaleAddress: Address = '0xDA9dfA130Df4dE4673b89022EE50ff26f6EA73Cf'
  const USDCAddress: Address = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
  const DAIAddress: Address = '0x6b175474e89094c44da98b954eedeac495271d0f'

  const { oracle } = await fetchAAVEContracts(hre, ds.getSystem().system, Network.MAINNET)
  const mockExchange = ds.getSystem().system.MockExchange.contract as MockExchange

  await sendImpersonateFunds(
    hre,
    whaleAddress,
    DAIAddress,
    ethers.utils.parseEther('100000'),
    mockExchange.address,
  )

  const USDCPrice = await oracle.getAssetPrice(USDCAddress)
  const DAIPrice = await oracle.getAssetPrice(DAIAddress)

  // Scale prices by 10**10 because AAVE prices only use 8 decimals
  await mockExchange.setPrice(USDCAddress, USDCPrice.mul('10000000000'))
  await mockExchange.setPrice(DAIAddress, DAIPrice.mul('10000000000'))
}

async function enableZeroFee(
  hre: HardhatRuntimeEnvironment,
  ds: DeploymentSystem,
  helpers: TestHelpers, // eslint-disable-line @typescript-eslint/no-unused-vars
  extraDeployment: any, // eslint-disable-line @typescript-eslint/no-unused-vars
  useFallbackSwap: boolean, // eslint-disable-line @typescript-eslint/no-unused-vars
) {
  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: ['0x85f9b7408afE6CEb5E46223451f5d4b832B522dc'],
  })

  const signer = await hre.ethers.getSigner('0x85f9b7408afE6CEb5E46223451f5d4b832B522dc')

  const swap = (ds.getSystem().system.Swap.contract as Swap).connect(signer)

  await swap.addFeeTier(0)

  await hre.network.provider.request({
    method: 'hardhat_stopImpersonatingAccount',
    params: ['0x85f9b7408afE6CEb5E46223451f5d4b832B522dc'],
  })
}

describe('Refinance | AAVE->AAVE | E2E', async () => {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  let snapshot: Snapshot
  let signer: SignerWithAddress
  let user: SignerWithAddress
  let WETH: WETH
  let DAI: ERC20
  let USDC: ERC20
  let oracle: Awaited<ReturnType<typeof getContract>>
  let poolDataProvider: Awaited<ReturnType<typeof getContract>>
  let ETHAddress: Address
  let slippage: ReturnType<typeof asPercentageValue>
  let config: RuntimeConfig
  let system: DeployedSystem
  let testSystem: TestDeploymentSystem
  let helpers: TestHelpers
  let network: Network
  let addresses: ReturnType<typeof addressesByNetwork>
  let aaveLikeAddresses: AaveLikeStrategyAddresses

  /* eslint-enable @typescript-eslint/no-unused-vars */

  beforeEach(async () => {
    ;({ snapshot } = await restoreSnapshot(
      {
        hre,
        blockNumber: testBlockNumberForAaveV3,
        useFallbackSwap: true,
      },
      [fundMockExchange, enableZeroFee],
    ))

    signer = await SignerWithAddress.create(
      snapshot.config.signer as ethers.providers.JsonRpcSigner,
    )
    user = (await hre.ethers.getSigners())[1]

    system = snapshot.testSystem.deployment.system
    testSystem = snapshot.testSystem
    config = snapshot.config
    helpers = snapshot.testSystem.helpers

    network = await getNetwork(config.provider)

    ETHAddress = ADDRESSES[network].common.ETH
    WETH = WETH__factory.connect(ADDRESSES[network].common.WETH, config.signer)
    DAI = ERC20__factory.connect(ADDRESSES[network].common.DAI, config.signer)
    USDC = ERC20__factory.connect(ADDRESSES[network].common.USDC, config.signer)

    addresses = addressesByNetwork(Network.MAINNET)

    aaveLikeAddresses = {
      tokens: {
        WETH: WETH.address,
        DAI: DAI.address,
        USDC: USDC.address,
        ETH: ETHAddress,
      },
      operationExecutor: system.OperationExecutor.contract.address,
      chainlinkEthUsdPriceFeed: addresses.chainlinkEthUsdPriceFeed,
      oracle: addresses.aaveOracle,
      lendingPool: addresses.pool,
      poolDataProvider: addresses.poolDataProvider,
    }
    ;({ oracle, poolDataProvider } = await getAaveLikeSystemContracts(
      aaveLikeAddresses,
      config.provider,
      'AAVE_V3',
    ))

    // Register the refinance operation in the OperationsRegistry
    const operationDefinitionFull = getRefinanceOperationDefinition(network, 'AAVE_V3', 'AAVE_V3')
    if (!operationDefinitionFull) {
      assert.fail('Operation definition not found')
    }

    const actions = operationDefinitionFull.actions.map(action => action.hash)
    const optionals = operationDefinitionFull.actions.map(actions => actions.optional)

    await system.OperationsRegistry.contract.addOperation({
      actions: actions,
      optional: optionals,
      name: operationDefinitionFull.name,
    })

    const { actions: registeredActions, optional: registerdOptionals } =
      await system.OperationsRegistry.contract.getOperation(operationDefinitionFull.name)

    expect(registeredActions).to.be.deep.equal(actions)
    expect(registerdOptionals).to.be.deep.equal(optionals)
  })

  it('should refinance AAVE->AAVE', async () => {
    const depositEthAmount = ethers.utils.parseEther('1')
    const firstPositionLTV = toSolidityPercentage(30.0)
    const secondPositionLTV = toSolidityPercentage(60.0)
    const debtFactor = toSolidityPercentage(110.0)

    const {
      success: successCreatePosition,
      ethDeposited,
      requestedBorrowAmount,
      totalDaiBorrowed,
    } = await createETHPositionAAVEv3(
      snapshot,
      WETH,
      DAI,
      aaveLikeAddresses,
      depositEthAmount,
      firstPositionLTV,
      user,
    )

    expect(successCreatePosition).to.be.true
    expect(ethDeposited).to.be.equal(depositEthAmount)
    expect(requestedBorrowAmount).to.be.equal(totalDaiBorrowed)

    const totalDaiToFlashloan = applyPercentage(totalDaiBorrowed, debtFactor)
    const usdcToBorrow = await getMaxDebtToBorrow(
      snapshot,
      WETH,
      USDC,
      depositEthAmount,
      secondPositionLTV,
    )
    const usdcToSwap = usdcToBorrow //.sub(BigNumber.from(swapFeeInUSDC.toFixed(0)))

    const refinanceArgs: RefinanceOperationArgs = {
      lastStorageIndex: 0,
      proxy: {
        address: helpers.userDPMProxy.address,
        owner: signer.address,
        isDPMProxy: true,
      },
      position: {
        type: 'Borrow',
        debt: {
          address: DAI.address,
          isEth: false,
          amount: new BigNumberJS(totalDaiToFlashloan.toString()),
        },
        collateral: {
          address: WETH.address,
          isEth: false,
          amount: new BigNumberJS(depositEthAmount.toString()),
        },
      },
      swapCloseToOpen: {
        fee: 0,
        data: '0x', // No need for swap as the collateral is the same
        collectFeeFrom: 'sourceToken',
        receiveAtLeast: new BigNumberJS(0),
        amount: new BigNumberJS(0),
      },
      newPosition: {
        type: 'Borrow',
        debt: {
          address: USDC.address,
          isEth: false,
          amount: new BigNumberJS(usdcToBorrow.toString()),
        },
        collateral: {
          address: WETH.address,
          isEth: false,
          amount: new BigNumberJS(depositEthAmount.toString()),
        },
      },
      flashloan: {
        provider: FlashloanProvider.Balancer,
      },
      swapAfterOpen: {
        fee: 0,
        data: mockExchangeGetData(
          system.MockExchange.contract,
          USDC.address,
          DAI.address,
          usdcToSwap.toString(),
          false,
        ),
        collectFeeFrom: 'sourceToken',
        receiveAtLeast: new BigNumberJS(0),
        amount: new BigNumberJS(usdcToSwap.toString()),
      },
      isPaybackAll: true,
      isWithdrawAll: true,
      addresses: aaveLikeAddresses,
      network: network,
    }
    const refinanceAAVE_AAVEOperation = await getRefinanceOperation(
      'AAVE_V3',
      'AAVE_V3',
      refinanceArgs,
    )
    if (!refinanceAAVE_AAVEOperation) {
      assert.fail('Refinance operation not defined')
    }

    const calldata = encodeOperation(refinanceAAVE_AAVEOperation, {
      operationExecutor: system.OperationExecutor.contract.address,
      provider: config.provider,
    })

    // Check contract balances before executing the transaction
    let proxyDAIBalance = await DAI.balanceOf(helpers.userDPMProxy.address)
    let proxyUSDCBalance = await USDC.balanceOf(helpers.userDPMProxy.address)
    let proxyWETHBalance = await WETH.balanceOf(helpers.userDPMProxy.address)

    let opExecutorDAIBalance = await DAI.balanceOf(system.OperationExecutor.contract.address)
    let opExecutorUSDCBalance = await USDC.balanceOf(system.OperationExecutor.contract.address)
    let opExecutorWETHBalance = await WETH.balanceOf(system.OperationExecutor.contract.address)

    expect(proxyDAIBalance).to.be.equal(0)
    expect(proxyUSDCBalance).to.be.equal(0)
    expect(proxyWETHBalance).to.be.equal(0)

    expect(opExecutorDAIBalance).to.be.equal(0)
    expect(opExecutorUSDCBalance).to.be.equal(0)
    expect(opExecutorWETHBalance).to.be.equal(0)

    const userDAIBalanceBefore = await DAI.balanceOf(user.address)

    // Execute the refinance operation
    const [successRefinance] = await executeThroughDPMProxy(
      helpers.userDPMProxy.address,
      {
        address: system.OperationExecutor.contract.address,
        calldata: calldata,
      },
      user,
      '0',
      5000000,
    )

    const userDAIBalanceAfter = await DAI.balanceOf(user.address)

    proxyDAIBalance = await DAI.balanceOf(helpers.userDPMProxy.address)
    proxyUSDCBalance = await USDC.balanceOf(helpers.userDPMProxy.address)
    proxyWETHBalance = await WETH.balanceOf(helpers.userDPMProxy.address)

    opExecutorDAIBalance = await DAI.balanceOf(system.OperationExecutor.contract.address)
    opExecutorUSDCBalance = await USDC.balanceOf(system.OperationExecutor.contract.address)
    opExecutorWETHBalance = await WETH.balanceOf(system.OperationExecutor.contract.address)

    expect(successRefinance).to.be.true

    expect(proxyDAIBalance).to.be.equal(0)
    expect(proxyUSDCBalance).to.be.equal(0)
    expect(proxyWETHBalance).to.be.equal(0)

    expect(opExecutorDAIBalance).to.be.equal(0)
    expect(opExecutorUSDCBalance).to.be.equal(0)
    expect(opExecutorWETHBalance).to.be.equal(0)

    expect(userDAIBalanceAfter).to.be.gte(userDAIBalanceBefore)
  })
})
