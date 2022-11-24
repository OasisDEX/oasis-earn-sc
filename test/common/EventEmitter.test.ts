import * as actions from '@oasisdex/oasis-actions/lib/src/actions'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import hre from 'hardhat'

import { createDeploy } from '../../helpers/deploy'
import init from '../../helpers/init'

const ethers = hre.ethers

describe('EventEmitter', () => {
  it('should emit Action event with correct return values', async () => {
    // Arrange
    const config = await init()
    const deploy = await createDeploy({ config }, hre)
    const [eventEmitter, eventEmitterAddress] = await deploy('EventEmitter', [])
    // Because we're not executing this in context of proxy address(this) will equal contract address
    const expectedProxyAddress = eventEmitterAddress

    // Act
    const testActionName = 'testAction'
    const testReturnValueA = 123
    const testReturnValueB = '0xE5c5482220CaB3dB0d222Df095dA739DA277a18F'

    const abiCoder = new ethers.utils.AbiCoder()

    const encodedCallData = abiCoder.encode(
      ['uint256', 'address'],
      [testReturnValueA, testReturnValueB],
    )

    const tx = eventEmitter.emitActionEvent(testActionName, expectedProxyAddress, encodedCallData, {
      gasLimit: 4000000,
    })

    const receipt = await tx
    const result = await receipt.wait()

    const actualEventArgs = result.events[0].args
    const actualEventName = actualEventArgs[0]
    const actualProxyAddress = actualEventArgs[1]
    const encodedValues = actualEventArgs[2]

    const [actualReturnValA, actualReturnValB] = abiCoder.decode(
      ['uint256', 'address'],
      encodedValues,
    )

    expect(actualEventName.hash).to.equal(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes(testActionName)),
    )
    expect(actualProxyAddress).to.equal(expectedProxyAddress)
    expect(actualReturnValA).to.equal(testReturnValueA)
    expect(actualReturnValB).to.equal(testReturnValueB)
  })
  it('should emit Operation event with correct return values', async () => {
    // Arrange
    const config = await init()
    const deploy = await createDeploy({ config }, hre)
    const [eventEmitter, eventEmitterAddress] = await deploy('EventEmitter', [])
    // Because we're not executing this in context of proxy address(this) will equal contract address
    const expectedProxyAddress = eventEmitterAddress

    // Act
    const testOperationName = 'testOperation'
    const testAction = actions.common.wrapEth({
      amount: new BigNumber(ethers.constants.MaxUint256.toHexString()),
    })

    const calls = [testAction]

    const tx = eventEmitter.emitOperationEvent(testOperationName, expectedProxyAddress, calls, {
      gasLimit: 4000000,
    })

    const receipt = await tx
    const result = await receipt.wait()

    const actualEventArgs = result.events[0].args

    const actualEventName = actualEventArgs[0]
    const actualProxyAddress = actualEventArgs[1]
    const emittedCallsData = actualEventArgs[2]

    const returnedActionsCalldata = emittedCallsData[0]

    expect(actualEventName.hash).to.equal(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes(testOperationName)),
    )
    expect(actualProxyAddress).to.equal(expectedProxyAddress)
    expect(testAction).to.deep.equal({
      targetHash: returnedActionsCalldata.targetHash,
      callData: returnedActionsCalldata.callData,
    })
  })
})
