import { ADDRESSES } from '@oasisdex/addresses/src'
import { CONTRACT_NAMES, OPERATION_NAMES } from '@oasisdex/dma-common/constants'
import { expect } from '@oasisdex/dma-common/test-utils'
import { getServiceNameHash } from '@oasisdex/dma-common/utils/common'
import { createDeploy } from '@oasisdex/dma-common/utils/deploy'
import { executeThroughProxy } from '@oasisdex/dma-common/utils/execute'
import init from '@oasisdex/dma-common/utils/init'
import { Network } from '@oasisdex/dma-common/utils/network'
import { getDsProxyRegistry, getOrCreateProxy } from '@oasisdex/dma-common/utils/proxy'
import { takeAFlashLoan } from '@oasisdex/dma-library/src/actions/common'
import { FlashloanProvider } from '@oasisdex/dma-library/src/types/common'
import BigNumber from 'bignumber.js'
import hre from 'hardhat'

const ethers = hre.ethers

describe('OperationExecutor', () => {
  it('should allow only delegate calls', async () => {
    const config = await init()
    const deploy = await createDeploy({ config }, hre)
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
        targetHash: getServiceNameHash(CONTRACT_NAMES.aave.v2.LENDING_POOL),
        callData: iface.encodeFunctionData('initialize', [suicideBombAddress, bombCall]),
      },
    ]

    const tx = OperationExecutor.executeOp(calls, 'CustomOperation', {
      gasLimit: 4000000,
    })

    await expect.revert(/OpExecutor: illegal call/, tx)
  })

  it('should hack OpExec through a workaround', async () => {
    const config = await init()
    const deploy = await createDeploy({ config }, hre)
    const addresses = getAddressesFor(Network.MAINNET)
    const proxyAddress = await getOrCreateProxy(
      await getDsProxyRegistry(config.signer, ADDRESSES.main.proxyRegistry),
      config.signer,
    )
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
      getServiceNameHash(CONTRACT_NAMES.aave.v2.LENDING_POOL),
      ADDRESSES.main.aave.v2.LendingPool,
    )

    const bomb = new ethers.utils.Interface(['function fallback() external'])
    const bombCall = bomb.encodeFunctionData('fallback', [])

    const iface = new ethers.utils.Interface([
      'function initialize(address _logic, bytes memory _data) public payable',
    ])

    const calls = [
      {
        targetHash: getServiceNameHash(CONTRACT_NAMES.aave.v2.LENDING_POOL),
        callData: iface.encodeFunctionData('initialize', [suicideBombAddress, bombCall]),
        skipped: false,
      },
    ]

    const [success] = await executeThroughProxy(
      proxyAddress.address,
      {
        address: opExecAddress,
        calldata: OperationExecutor.interface.encodeFunctionData('executeOp', [
          [
            takeAFlashLoan({
              flashloanAmount: new BigNumber(1),
              asset: ADDRESSES.main.DAI,
              isProxyFlashloan: false,
              isDPMProxy: false,
              calls: calls,
              provider: FlashloanProvider.DssFlash,
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
