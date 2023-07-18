import { ADDRESSES } from '@deploy-configurations/addresses'
import { CONTRACT_NAMES } from '@deploy-configurations/constants'
import { ServiceRegistry } from '@deploy-configurations/utils/wrappers'
import { TEN_THOUSAND } from '@dma-common/constants'
import { ensureWeiFormat, expect } from '@dma-common/test-utils'
import { RuntimeConfig } from '@dma-common/types/common'
import { getEvents, getServiceNameHash } from '@dma-common/utils/common'
import { createDeploy, DeployFunction } from '@dma-common/utils/deploy'
import { executeThroughProxy } from '@dma-common/utils/execute'
import init from '@dma-common/utils/init'
import { getOrCreateProxy } from '@dma-common/utils/proxy'
import { ActionFactory, calldataTypes } from '@dma-library'
import { calculateOperationHash } from '@dma-library/operations'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import BigNumber from 'bignumber.js'
import { Contract, Signer } from 'ethers'
import { EventFragment } from 'ethers/lib/utils'
import hre from 'hardhat'
import { BasicCall } from '@dma-library/src/types/action-call'

const ethers = hre.ethers
const createAction = ActionFactory.create

enum FlashloanProvider {
  Maker,
  Balancer,
}

const dummyWriteAction = (number: number) =>
  createAction(
    getServiceNameHash('DummyWriteAction'),
    ['tuple(uint256 randomNumber)', 'uint8[] paramsMap'],
    [
      {
        randomNumber: number,
      },
      [0],
    ],
  )

const dummyReadAction = (position: number) =>
  createAction(
    getServiceNameHash('DummyReadAction'),
    ['tuple(uint256 empty)', 'uint8[] paramsMap'],
    [
      {
        empty: 0,
      },
      [position],
    ],
  )

const sendToken = async (amount: BigNumber, to: string) =>
  createAction(
    getServiceNameHash(CONTRACT_NAMES.common.SEND_TOKEN),
    [calldataTypes.common.SendToken],
    [
      {
        amount: ensureWeiFormat(amount),
        asset: ADDRESSES.mainnet.common.DAI,
        to,
      },
      [0, 0, 0],
    ],
  )

const takeAFlashloan = async (provider: FlashloanProvider, amount: BigNumber, calls: BasicCall[]) =>
  createAction(
    getServiceNameHash(CONTRACT_NAMES.common.TAKE_A_FLASHLOAN),
    [calldataTypes.common.TakeAFlashLoanV2, calldataTypes.paramsMap],
    [
      {
        amount: ensureWeiFormat(amount),
        asset: ADDRESSES.mainnet.common.DAI,
        isDPMProxy: false,
        provider,
        calls,
      },
      [0],
    ],
  )

const callMaliciousFlAction = async (amount: BigNumber, calls: ActionCall[]) =>
  createAction(
    getServiceNameHash('MaliciousFlashloanAction'),
    [calldataTypes.common.TakeAFlashLoanV2, calldataTypes.paramsMap],
    [
      {
        amount: ensureWeiFormat(amount),
        asset: ADDRESSES.mainnet.common.DAI,
        isDPMProxy: false,
        provider: FlashloanProvider.Balancer,
        calls,
      },
      [],
    ],
  )

const dummyOperation = [
  dummyWriteAction(12),
  dummyWriteAction(34),
  dummyReadAction(2),
  dummyReadAction(1),
  dummyWriteAction(45),
]

describe('OperationExecutorFL', async function () {
  let config: RuntimeConfig
  let signer: Signer
  let proxyAddress: string
  let deploy: DeployFunction
  let system: { [key: string]: Contract }

  before(async () => {
    config = await init()
    signer = config.signer
    proxyAddress = (
      await getOrCreateProxy(
        await ethers.getContractAt('DSProxyRegistry', '0x4678f0a6958e4D2Bc4F1BAF7Bc52E8F3564f3fE4'),
        signer,
      )
    ).address

    deploy = await createDeploy({ config, debug: true })
  })

  beforeEach(async () => {
    system = await loadFixture(deployeContracts)
  })

  const deployeContracts = async () => {
    const chainLogViewAddress = ADDRESSES.mainnet.mpa.core.ChainLogView
    const [serviceRegistry] = await deploy('ServiceRegistry', [0])
    const [opsRegistry] = await deploy('OperationsRegistryV2')
    const [operationExecutor] = await deploy('OperationExecutorV2', [
      serviceRegistry.address,
      opsRegistry.address,
      chainLogViewAddress,
      ADDRESSES.mainnet.common.BalancerVault,
    ])
    const [takeAFlashloan] = await deploy('TakeFlashloanV2', [
      ADDRESSES.mainnet.common.BalancerVault,
      operationExecutor.address,
      chainLogViewAddress,
      ADDRESSES.mainnet.common.DAI,
      ADDRESSES.mainnet.mpa.core.DSGuardFactory,
    ])
    const [sendToken] = await deploy('SendTokenV2', [])
    const [dummyReadAction] = await deploy('DummyReadAction', [])
    const [dummyWriteAction] = await deploy('DummyWriteAction', [])
    const [maliciousAction] = await deploy('MaliciousAction', [])
    const [maliciousFLAction] = await deploy('MaliciousFlashloanAction', [
      operationExecutor.address,
      ADDRESSES.mainnet.maker.common.FlashMintModule,
      proxyAddress,
    ])

    const serviceRegistryWrapper = new ServiceRegistry(serviceRegistry.address, signer)

    await serviceRegistryWrapper.addEntry('DummyReadAction', dummyReadAction.address)
    await serviceRegistryWrapper.addEntry('DummyWriteAction', dummyWriteAction.address)
    await serviceRegistryWrapper.addEntry('TakeFlashloan_3', takeAFlashloan.address)
    await serviceRegistryWrapper.addEntry('SendToken_4', sendToken.address)
    await serviceRegistryWrapper.addEntry('MaliciousFlashloanAction', maliciousFLAction.address)

    return {
      serviceRegistry,
      opsRegistry,
      operationExecutor,
      dummyReadAction,
      dummyWriteAction,
      maliciousAction,
      maliciousFLAction,
      sendToken,
      takeAFlashloan,
    }
  }

  it('should execute an operation', async () => {
    await system.opsRegistry.addOperation(
      'CUSTOM_OPERATION',
      calculateOperationHash(dummyOperation),
    )

    const [isSuccessful, receipt] = await executeThroughProxy(
      proxyAddress,
      {
        address: system.operationExecutor.address,
        calldata: system.operationExecutor.interface.encodeFunctionData('executeOp', [
          dummyOperation,
        ]),
      },
      signer,
    )

    expect(isSuccessful).to.be.true

    const events = getEvents(receipt, EventFragment.from('ReadValue(bytes32 value)'))
    expect(events.length).to.be.equal(2)
  })

  it('should fail because of non-existent operation', async () => {
    const [isSuccessful] = await executeThroughProxy(
      proxyAddress,
      {
        address: system.operationExecutor.address,
        calldata: system.operationExecutor.interface.encodeFunctionData('executeOp', [
          dummyOperation,
        ]),
      },
      signer,
    )

    expect(isSuccessful).to.be.false
  })

  /**
   * This test checks lines 85,86 in the v2/OperationExecutor.sol ( OperationExecutorV2 contract )
   * We simulat that the proxy has called a malicious contract which wrote to the same slot -
   * meaning structure used for a storage pointer with the same typed properties.
   * If we don't delete any previously populated data, tx will revert.
   * In this test per se it's because it tries to construct different operation hash.
   */
  it('should not be affected if some data was written to the storage slot prior execution', async () => {
    await executeThroughProxy(
      proxyAddress,
      {
        address: system.maliciousAction.address,
        calldata: system.maliciousAction.interface.encodeFunctionData('write', [
          ethers.utils.formatBytes32String('Will pre append some data'),
        ]),
      },
      signer,
    )

    await system.opsRegistry.addOperation(
      'CUSTOM_OPERATION',
      calculateOperationHash(dummyOperation),
    )

    const [isOperationExecutionSuccessful] = await executeThroughProxy(
      proxyAddress,
      {
        address: system.operationExecutor.address,
        calldata: system.operationExecutor.interface.encodeFunctionData('executeOp', [
          dummyOperation,
        ]),
      },
      signer,
    )

    expect(isOperationExecutionSuccessful).to.be.true
  })

  it('should take a Maker`s flashloan', async () => {
    const sendBackDAI = await sendToken(TEN_THOUSAND, system.operationExecutor.address)
    const takeAMakerFlashloan = await takeAFlashloan(FlashloanProvider.Maker, TEN_THOUSAND, [
      sendBackDAI,
    ])

    await system.opsRegistry.addOperation(
      'SIMPLE_MAKER_FLASHLOAN',
      calculateOperationHash([takeAMakerFlashloan, sendBackDAI]),
    )

    const [isSuccessful] = await executeThroughProxy(
      proxyAddress,
      {
        address: system.operationExecutor.address,
        calldata: system.operationExecutor.interface.encodeFunctionData('executeOp', [
          [takeAMakerFlashloan],
        ]),
      },
      config.signer,
    )

    expect(isSuccessful).to.be.true
  })

  it('should take a Balancer`s flashloan', async () => {
    const sendBackDAI = await sendToken(TEN_THOUSAND, system.operationExecutor.address)
    const takeABalancerFlashloan = await takeAFlashloan(FlashloanProvider.Balancer, TEN_THOUSAND, [
      sendBackDAI,
    ])

    await system.opsRegistry.addOperation(
      'SIMPLE_BALANCER_FLASHLOAN',
      calculateOperationHash([takeABalancerFlashloan, sendBackDAI]),
    )

    const [isSuccessful] = await executeThroughProxy(
      proxyAddress,
      {
        address: system.operationExecutor.address,
        calldata: system.operationExecutor.interface.encodeFunctionData('executeOp', [
          [takeABalancerFlashloan],
        ]),
      },
      config.signer,
    )

    expect(isSuccessful).to.be.true
  })

  it('should not allow anyone to call the aggregate callback', async () => {
    try {
      await system.operationExecutor.callbackAggregate([dummyWriteAction(3)])
    } catch (e: any) {
      expect(e.reason.includes('ForbiddenCall')).to.be.true
    }
  })

  it('should not allow Flashloan reentracy', async () => {
    const sendBackDAI = await sendToken(TEN_THOUSAND, system.operationExecutor.address)
    const sendBackDAI2 = await sendToken(TEN, system.operationExecutor.address)
    const takeAMaliciousFlashloan = await callMaliciousFlAction(TEN, [sendBackDAI2])
    const takeABalancerFlashloan = await takeAFlashloan(FlashloanProvider.Balancer, TEN_THOUSAND, [
      takeAMaliciousFlashloan,
      sendBackDAI,
    ])

    await system.opsRegistry.addOperation(
      'EMBEDDED_FLASHLOAN',
      calculateOperationHash([
        takeABalancerFlashloan,
        takeAMaliciousFlashloan,
        sendBackDAI2,
        sendBackDAI,
      ]),
    )

    const [isSuccessful] = await executeThroughProxy(
      proxyAddress,
      {
        address: system.operationExecutor.address,
        calldata: system.operationExecutor.interface.encodeFunctionData('executeOp', [
          [takeABalancerFlashloan],
        ]),
      },
      config.signer,
    )

    expect(isSuccessful).to.be.false
  })
})
