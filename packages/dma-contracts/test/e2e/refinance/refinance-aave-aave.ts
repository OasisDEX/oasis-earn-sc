import { ADDRESSES } from '@deploy-configurations/addresses'
import { Address } from '@deploy-configurations/types/address'
import { DeployedSystem } from '@deploy-configurations/types/deployed-system'
import { Network } from '@deploy-configurations/types/network'
import { getNetwork } from '@deploy-configurations/utils/network'
import { DEFAULT_FEE } from '@dma-common/constants'
import { addressesByNetwork, asPercentageValue } from '@dma-common/test-utils'
import { RuntimeConfig } from '@dma-common/types/common'
import { executeThroughDPMProxy } from '@dma-common/utils/execute'
import { testBlockNumberForAaveV3 } from '@dma-contracts/test/config'
import { createETHPositionAAVEv3 } from '@dma-contracts/test/utils/aave/aave.operation.create-position'
import { getMaxDebtToBorrow } from '@dma-contracts/test/utils/aave/debt-calculation'
import { restoreSnapshot, Snapshot, TestDeploymentSystem, TestHelpers } from '@dma-contracts/utils'
import { applyPercentage, toSolidityPercentage } from '@dma-contracts/utils/percentage.utils'
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
import { ERC20, ERC20__factory, WETH, WETH__factory } from '@typechain'
import { BigNumber as BigNumberJS } from 'bignumber.js'
import { assert, expect } from 'chai'
import { ethers } from 'ethers'
import hre from 'hardhat'

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
    ;({ snapshot } = await restoreSnapshot({
      hre,
      blockNumber: testBlockNumberForAaveV3,
      useFallbackSwap: false,
    }))

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

    console.log('operationDefinitionFull', operationDefinitionFull)

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

  it.only('should refinance AAVE->AAVE', async () => {
    const depositEthAmount = ethers.utils.parseEther('1')
    const maxLTV = toSolidityPercentage(77.0)
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
      maxLTV,
      user,
    )

    expect(successCreatePosition).to.be.true
    expect(ethDeposited).to.be.equal(depositEthAmount)
    expect(requestedBorrowAmount).to.be.equal(totalDaiBorrowed)

    const totalDaiToFlashloan = applyPercentage(totalDaiBorrowed, debtFactor)
    const userDebtReserves = await poolDataProvider.getUserReserveData(
      DAI.address,
      helpers.userDPMProxy.address,
    )
    console.log('userDebtReserves', userDebtReserves)
    console.log('totalDebt', userDebtReserves.currentVariableDebt.toString())

    const userCollateralReserves = await poolDataProvider.getUserReserveData(
      WETH.address,
      helpers.userDPMProxy.address,
    )

    console.log('userCollateralReserves', userCollateralReserves)
    console.log('totalCollateral', userCollateralReserves.currentATokenBalance.toString())

    const usdcToBorrow = await getMaxDebtToBorrow(snapshot, WETH, USDC, depositEthAmount, maxLTV)

    console.log('usdcToBorrow', usdcToBorrow.toString())

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
      swap: {
        fee: DEFAULT_FEE,
        data: '0x',
        collectFeeFrom: 'sourceToken',
        receiveAtLeast: new BigNumberJS(0),
        amount: new BigNumberJS(0),
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

    //console.log('refinanceAAVE_AAVEOperation', refinanceAAVE_AAVEOperation)
    console.log('----------------------------------------------------------\n\n\n')

    const [successRefinance] = await executeThroughDPMProxy(
      helpers.userDPMProxy.address,
      {
        address: system.OperationExecutor.contract.address,
        calldata: calldata,
      },
      user,
      '0',
      20000000,
    )

    expect(successRefinance).to.be.true
  })
})
