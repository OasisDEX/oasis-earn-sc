import {
  ADDRESSES,
  CONTRACT_NAMES,
  ONE,
  OPERATION_NAMES,
  TEN,
  TEN_THOUSAND,
  ZERO,
} from '@oasisdex/oasis-actions'
import { pullToken } from '@oasisdex/oasis-actions/lib/src/actions/common'
import { takeAFlashLoan } from '@oasisdex/oasis-actions/src/actions/common'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { Signer } from 'ethers'
import hre from 'hardhat'

import { createDeploy, executeThroughProxy } from '../helpers/deploy'
import init from '../helpers/init'
import { getOrCreateProxy } from '../helpers/proxy'
import { swapUniswapTokens } from '../helpers/swap/uniswap'
import { amountToWei, approve, balanceOf } from '../helpers/utils'
import { getAddressesFor, getServiceNameHash, Network } from '../scripts/common'
import { expectRevert, expectToBeEqual } from './utils'

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

describe('OperationStorage', () => {
  it('should allow the operation in a direct call to continue even when someone called lock on it', async () => {
    const THOUSAND = new BigNumber('1000')
    const config = await init()
    const signer = config.signer
    const spoofer = config.provider.getSigner(3)
    const addresses = getAddressesFor(Network.MAINNET)
    const OperationStorage = await ethers.getContractAt(
      'OperationStorage',
      addresses.OPERATION_STORAGE,
      spoofer,
    )

    const OperationExecutor = await ethers.getContractAt(
      'OperationExecutor',
      addresses.OPERATION_EXECUTOR,
      signer,
    )

    await swapUniswapTokens(
      addresses.WETH,
      addresses.DAI,
      amountToWei(TEN).toFixed(0),
      amountToWei(TEN_THOUSAND).toFixed(0),
      config.address,
      config,
    )

    let opExecBalance = await balanceOf(addresses.DAI, OperationExecutor.address, {
      config,
      isFormatted: true,
    })

    expect(opExecBalance.toString(), ZERO.toString())
    await OperationStorage.lock()

    await approve(addresses.DAI, OperationExecutor.address, amountToWei(THOUSAND), config)

    await OperationExecutor.executeOp(
      [pullToken({ amount: amountToWei(THOUSAND), asset: addresses.DAI, from: config.address })],
      OPERATION_NAMES.common.CUSTOM_OPERATION,
    )

    opExecBalance = await balanceOf(addresses.DAI, OperationExecutor.address, {
      config,
      isFormatted: true,
    })

    expectToBeEqual(opExecBalance.toString(), THOUSAND.toString())
  })

  it('should allow the operation in a delegated call to continue even when someone called lock on it', async () => {
    const THOUSAND = new BigNumber('1000')
    const config = await init()
    const signer = config.signer
    const spoofer = config.provider.getSigner(3)
    const addresses = getAddressesFor(Network.MAINNET)
    const proxyAddress = await getOrCreateProxy(config.signer)
    const OperationStorage = await ethers.getContractAt(
      'OperationStorage',
      addresses.OPERATION_STORAGE,
      spoofer,
    )

    const OperationExecutor = await ethers.getContractAt(
      'OperationExecutor',
      addresses.OPERATION_EXECUTOR,
      signer,
    )

    await swapUniswapTokens(
      addresses.WETH,
      addresses.DAI,
      amountToWei(TEN).toFixed(0),
      amountToWei(TEN_THOUSAND).toFixed(0),
      config.address,
      config,
    )

    let proxyAddressBalance = await balanceOf(addresses.DAI, proxyAddress, {
      config,
      isFormatted: true,
    })

    expect(proxyAddressBalance.toString(), ZERO.toString())
    await OperationStorage.lock()

    await approve(addresses.DAI, proxyAddress, amountToWei(THOUSAND), config)

    await executeThroughProxy(
      proxyAddress,
      {
        address: OperationExecutor.address,
        calldata: OperationExecutor.interface.encodeFunctionData('executeOp', [
          [
            takeAFlashLoan({
              flashloanAmount: new BigNumber(1),
              borrower: proxyAddress,
              dsProxyFlashloan: false,
              calls: [
                pullToken({
                  amount: amountToWei(THOUSAND),
                  asset: addresses.DAI,
                  from: config.address,
                }),
              ],
            }),
          ],
          OPERATION_NAMES.common.CUSTOM_OPERATION,
        ]),
      },
      config.signer,
    )

    proxyAddressBalance = await balanceOf(addresses.DAI, OperationExecutor.address, {
      config,
      isFormatted: true,
    })

    expectToBeEqual(proxyAddressBalance.toString(), THOUSAND.toString())
  })
})
