import * as actions from '@oasisdex/oasis-actions/lib/src/actions'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import hre from 'hardhat'

import { createDeploy } from '../../helpers/deploy'
import init from '../../helpers/init'
import { getAddressesFor, Network } from '../../scripts/common'

const ethers = hre.ethers

describe('EventEmitter', () => {
  it('should emit Action event with correct return values', async () => {
    // Arrange
    const config = await init()
    const deploy = await createDeploy({ config }, hre)

    const [eventEmitter] = await deploy('EventEmitter', [])

    // Act
    const testActionName = 'testAction'
    const testReturnValueA = 123
    const testReturnValueB = '0xE5c5482220CaB3dB0d222Df095dA739DA277a18F'

    const abiCoder = new ethers.utils.AbiCoder()

    const encodedCallData = abiCoder.encode(
      ['uint256', 'address'],
      [testReturnValueA, testReturnValueB],
    )

    const tx = eventEmitter.emitActionEvent(testActionName, encodedCallData, {
      gasLimit: 4000000,
    })

    const receipt = await tx
    const result = await receipt.wait()

    const actualEventArgs = result.events[0].args
    const actualEventName = actualEventArgs[0]
    const returnValues = actualEventArgs[1]
    const [actualReturnValA, actualReturnValB] = abiCoder.decode(
      ['uint256', 'address'],
      returnValues,
    )

    expect(actualEventName).to.equal(testActionName)
    expect(actualReturnValA).to.equal(testReturnValueA)
    expect(actualReturnValB).to.equal(testReturnValueB)
  })
  it('should emit Operation event with correct return values', async () => {
    // Arrange
    const config = await init()
    const deploy = await createDeploy({ config }, hre)
    const addresses = getAddressesFor(Network.MAINNET)
    const [eventEmitter] = await deploy('EventEmitter', [])

    // Act
    const testOperationName = 'testOperation'
    const testAction = actions.common.wrapEth({
      amount: new BigNumber(ethers.constants.MaxUint256.toHexString()),
    })

    const calls = [testAction]

    const tx = eventEmitter.emitOperationEvent(testOperationName, calls, {
      gasLimit: 4000000,
    })

    const receipt = await tx
    const result = await receipt.wait()

    const actualEventArgs = result.events[0].args
    const actualEventName = actualEventArgs[0]
    const returnValues = actualEventArgs[1]

    const returnedActionsCalldata = returnValues[0]

    expect(actualEventName).to.equal(testOperationName)
    expect(testAction).to.deep.equal({
      targetHash: returnedActionsCalldata.targetHash,
      callData: returnedActionsCalldata.callData,
    })
  })
})
