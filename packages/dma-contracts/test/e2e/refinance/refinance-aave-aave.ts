import { ADDRESSES } from '@deploy-configurations/addresses'
import { Address } from '@deploy-configurations/types/address'
import { DeployedSystem } from '@deploy-configurations/types/deployed-system'
import { Network } from '@deploy-configurations/types/network'
import { getNetwork } from '@deploy-configurations/utils/network'
import { DEFAULT_FEE } from '@dma-common/constants'
import { addressesByNetwork, asPercentageValue } from '@dma-common/test-utils'
import { RuntimeConfig } from '@dma-common/types/common'
import { testBlockNumberForAaveV3 } from '@dma-contracts/test/config'
import { createETHPositionAAVEv3 } from '@dma-contracts/test/utils/aave/aave.operation.create-position'
import { restoreSnapshot, Snapshot, TestDeploymentSystem, TestHelpers } from '@dma-contracts/utils'
import { toSolidityPercentage } from '@dma-contracts/utils/percentage.utils'
import { AaveLikeStrategyAddresses } from '@dma-library/operations/aave-like'
import {
  getRefinanceOperation,
  getRefinanceOperationDefinition,
} from '@dma-library/operations/refinance'
import { RefinanceOperationArgs } from '@dma-library/operations/refinance/types'
import { getAaveLikeSystemContracts, getContract } from '@dma-library/protocols/aave-like/utils'
import { FlashloanProvider } from '@dma-library/types'
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
  let WETH: WETH
  let DAI: ERC20
  let USDC: ERC20
  let oracle: Awaited<ReturnType<typeof getContract>>
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
    ;({ oracle } = await getAaveLikeSystemContracts(aaveLikeAddresses, config.provider, 'AAVE_V3'))

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

  it.only('should refinance AAVE->AAVE', async () => {
    const depositEthAmount = ethers.utils.parseEther('1')
    const maxLTV = toSolidityPercentage(77.0)

    const { success, ethDeposited, requestedBorrowAmount, totalDaiBorrowed } =
      await createETHPositionAAVEv3(
        snapshot,
        WETH,
        DAI,
        aaveLikeAddresses,
        depositEthAmount,
        maxLTV,
      )

    expect(success).to.be.true
    expect(ethDeposited).to.be.equal(depositEthAmount)
    expect(requestedBorrowAmount).to.be.equal(totalDaiBorrowed)

    const refinanceArgs: RefinanceOperationArgs = {
      lastStorageIndex: 0,
      proxy: {
        address: helpers.userProxy.address,
        owner: signer.address,
        isDPMProxy: true,
      },
      position: {
        type: 'Borrow',
        debt: {
          address: DAI.address,
          isEth: false,
          amount: new BigNumberJS(totalDaiBorrowed.toString()),
        },
        collateral: {
          address: WETH.address,
          isEth: false,
          amount: new BigNumberJS(ethDeposited.toString()),
        },
      },
      newPosition: {
        type: 'Borrow',
        debt: {
          address: USDC.address,
          isEth: false,
          amount: new BigNumberJS(totalDaiBorrowed.toString()),
        },
        collateral: {
          address: WETH.address,
          isEth: false,
          amount: new BigNumberJS(ethDeposited.toString()),
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
      isPaybackAll: false,
      addresses: aaveLikeAddresses,
      network: network,
    }
    const refinanceAAVE_AAVEOperation = await getRefinanceOperation(
      'AAVE_V3',
      'AAVE_V3',
      refinanceArgs,
    )

    console.log('refinanceAAVE_AAVEOperation', refinanceAAVE_AAVEOperation)
  })
})
