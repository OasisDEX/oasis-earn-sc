import { ADDRESSES, CONTRACT_NAMES, OPERATION_NAMES } from '@oasisdex/oasis-actions'
import { takeAFlashLoan } from '@oasisdex/oasis-actions/src/actions/common'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import hre from 'hardhat'
import { createDeploy, executeThroughProxy } from '../helpers/deploy'
import init from '../helpers/init'
import { getOrCreateProxy } from '../helpers/proxy'
import { getAddressesFor, getServiceNameHash, Network } from '../scripts/common'
import { expectRevert } from './utils'

const ethers = hre.ethers

describe('OperationExecutor', () => {
  it('should allow only delegate calls', async () => {
    const config = await init()
    const deploy = await createDeploy({ config, debug: true }, hre)
    const addresses = getAddressesFor(Network.MAINNET)

    const [, suicideBombAddress] = await deploy('SuicideBomb', [])

    const [OperationExecutor] = await deploy('OperationExecutor', [
      addresses.AUTOMATION_SERVICE_REGISTRY,
    ])

    const bomb = new ethers.utils.Interface(['function fallback() external'])
    const bombCall = bomb.encodeFunctionData('fallback', [])

    const iface = new ethers.utils.Interface([
      'function initialize(address _logic, bytes memory _data) public payable',
    ])

    const calls = [
      {
        targetHash: getServiceNameHash(CONTRACT_NAMES.aave.LENDING_POOL),
        callData: iface.encodeFunctionData('initialize', [suicideBombAddress, bombCall]),
      },
    ]

    const tx = OperationExecutor.executeOp(calls, 'CustomOperation', {
      gasLimit: 4000000,
    })

    await expectRevert(/OpExecutor: illegal call/, tx)
  })

  it('should hack OpExec through a workaround ', async () => {
    const config = await init()
    const deploy = await createDeploy({ config, debug: true }, hre)
    const addresses = getAddressesFor(Network.MAINNET)
    const proxyAddress = await getOrCreateProxy(config.signer)
    const [, suicideBombAddress] = await deploy('SuicideBomb', [])
    const [ServiceRegistry, serviceRegistryAddress] = await deploy('ServiceRegistry', [0])
    const [OperationExecutor, opExecAddress] = await deploy('OperationExecutor', [
      serviceRegistryAddress,
    ])
    const [, opStorageAddress] = await deploy('OperationStorage', [
      serviceRegistryAddress,
      opExecAddress,
    ])
    const [, takeAFlashloanAddress] = await deploy('TakeFlashloan', [
      serviceRegistryAddress,
      ADDRESSES.main.DAI,
    ])

    await ServiceRegistry.addNamedService(
      getServiceNameHash(CONTRACT_NAMES.common.OPERATION_EXECUTOR),
      opExecAddress,
    )
    await ServiceRegistry.addNamedService(
      getServiceNameHash(CONTRACT_NAMES.common.TAKE_A_FLASHLOAN),
      takeAFlashloanAddress,
    )
    await ServiceRegistry.addNamedService(
      getServiceNameHash('McdFlashMintModule'),
      addresses.MCD_FLASH,
    )
    await ServiceRegistry.addNamedService(
      getServiceNameHash(CONTRACT_NAMES.common.OPERATION_STORAGE),
      opStorageAddress,
    )
    await ServiceRegistry.addNamedService(
      getServiceNameHash(CONTRACT_NAMES.common.OPERATIONS_REGISTRY),
      addresses.OPERATIONS_REGISTRY,
    )
    await ServiceRegistry.addNamedService(
      getServiceNameHash(CONTRACT_NAMES.aave.LENDING_POOL),
      ADDRESSES.main.aave.MainnetLendingPool,
    )

    const bomb = new ethers.utils.Interface(['function fallback() external'])
    const bombCall = bomb.encodeFunctionData('fallback', [])

    const iface = new ethers.utils.Interface([
      'function initialize(address _logic, bytes memory _data) public payable',
    ])

    const calls = [
      {
        targetHash: getServiceNameHash(CONTRACT_NAMES.aave.LENDING_POOL),
        callData: iface.encodeFunctionData('initialize', [suicideBombAddress, bombCall]),
      },
    ]

    const [success] = await executeThroughProxy(
      proxyAddress,
      {
        address: opExecAddress,
        calldata: OperationExecutor.interface.encodeFunctionData('executeOp', [
          [
            takeAFlashLoan({
              flashloanAmount: new BigNumber(1),
              borrower: proxyAddress,
              dsProxyFlashloan: false,
              calls: calls,
            }),
          ],
          OPERATION_NAMES.common.CUSTOM_OPERATION,
        ]),
      },
      config.signer,
    )

    expect(success).to.be.false
  })
})
