import { loadContractNames } from '@deploy-configurations/constants'
import { ServiceRegistry } from '@deploy-configurations/utils/wrappers'
import { TEN, TEN_THOUSAND } from '@dma-common/constants'
import { ensureWeiFormat, expect } from '@dma-common/test-utils'
import { RuntimeConfig } from '@dma-common/types/common'
import { getEvents, getServiceNameHash } from '@dma-common/utils/common'
import { createDeploy, DeployFunction } from '@dma-common/utils/deploy'
import { executeThroughProxy } from '@dma-common/utils/execute'
import init from '@dma-common/utils/init'
import { getOrCreateProxy } from '@dma-common/utils/proxy'
import { ActionFactory, calldataTypes, Network } from '@dma-library'
import { calculateOperationHash } from '@dma-library/operations/utils'
import { FlashloanProvider } from '@dma-library/types'
import { BasicCall } from '@dma-library/types/action-call'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import BigNumber from 'bignumber.js'
import { Contract, Signer } from 'ethers'
import { EventFragment } from 'ethers/lib/utils'
import hre from 'hardhat'

const ethers = hre.ethers
const createAction = ActionFactory.create

const CONTRACT_NAMES = loadContractNames(Network.MAINNET)

const ADDRESSES = {
  DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  ChainLogView: '0x4B323Eb2ece7fc1D81F1819c26A7cBD29975f75f',
  BalancerVault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
  DSGuardFactory: '0x5a15566417e6C1c9546523066500bDDBc53F88C7',
  FlashMintModule: '0x60744434d6339a6B27d73d9Eda62b6F66a0a04FA',
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
        asset: ADDRESSES.DAI,
        to,
      },
      [0, 0, 0],
    ],
  )

const takeAFlashloan = async (provider: FlashloanProvider, amount: BigNumber, calls: BasicCall[]) =>
  createAction(
    getServiceNameHash(CONTRACT_NAMES.common.TAKE_A_FLASHLOAN),
    [calldataTypes.common.TakeAFlashLoan, calldataTypes.paramsMap],
    [
      {
        amount: ensureWeiFormat(amount),
        asset: ADDRESSES.DAI,
        isDPMProxy: false,
        provider,
        calls,
      },
      [0],
    ],
  )

const callMaliciousFlAction = async (amount: BigNumber, calls: BasicCall[]) =>
  createAction(
    getServiceNameHash('MaliciousFlashloanAction'),
    [calldataTypes.common.TakeAFlashLoan, calldataTypes.paramsMap],
    [
      {
        amount: ensureWeiFormat(amount),
        asset: ADDRESSES.DAI,
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

    console.log('PROXY ADDRESS', proxyAddress)

    deploy = await createDeploy({ config, debug: true })
  })

  beforeEach(async () => {
    system = await loadFixture(deployedContracts)
  })

  const deployedContracts = async () => {
    const chainLogViewAddress = ADDRESSES.ChainLogView
    const [serviceRegistry] = await deploy('ServiceRegistry', [0])
    const [opsRegistry] = await deploy('OperationsRegistry')
    const [operationExecutor] = await deploy('OperationExecutor', [
      serviceRegistry.address,
      opsRegistry.address,
      chainLogViewAddress,
      ADDRESSES.BalancerVault,
    ])
    const [takeAFlashloan] = await deploy('TakeFlashloan', [
      serviceRegistry.address,
      ADDRESSES.DAI,
      ADDRESSES.DSGuardFactory,
    ])
    const [sendToken] = await deploy('SendToken', [serviceRegistry.address])
    const [dummyReadAction] = await deploy('DummyReadAction', [])
    const [dummyWriteAction] = await deploy('DummyWriteAction', [])
    const [maliciousAction] = await deploy('MaliciousAction', [])
    const [maliciousFLAction] = await deploy('MaliciousFlashloanAction', [
      operationExecutor.address,
      ADDRESSES.FlashMintModule,
      proxyAddress,
    ])

    const serviceRegistryWrapper = new ServiceRegistry(serviceRegistry.address, signer)
    // @ts-ignore
    await serviceRegistryWrapper.addEntry('DummyReadAction', dummyReadAction.address)
    // @ts-ignore
    await serviceRegistryWrapper.addEntry('DummyWriteAction', dummyWriteAction.address)
    await serviceRegistryWrapper.addEntry('TakeFlashloan_3', takeAFlashloan.address)
    await serviceRegistryWrapper.addEntry('SendToken_4', sendToken.address)
    // @ts-ignore
    await serviceRegistryWrapper.addEntry('MaliciousFlashloanAction', maliciousFLAction.address)
    // @ts-ignore
    await serviceRegistryWrapper.addEntry('ChainLogView', chainLogViewAddress)
    // @ts-ignore
    await serviceRegistryWrapper.addEntry('OperationExecutor_2', operationExecutor.address)
    await serviceRegistryWrapper.addEntry('BalancerVault', ADDRESSES.BalancerVault)

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
   * This test checks lines 85,86 in the OperationExecutor.sol
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
    const takeAMakerFlashloan = await takeAFlashloan(FlashloanProvider.DssFlash, TEN_THOUSAND, [
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
