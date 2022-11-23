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
    const addresses = getAddressesFor(Network.MAINNET)

    console.log('here0')
    // const { system: _system } = await deploySystem(config, false, true)
    const [eventEmitter, eventEmitterAddress] = await deploy('EventEmitter', [])
    console.log('here0A')
    // Act
    const testActionName = 'testAction'
    const testReturnValueA = 123
    const testReturnValueB = '0xE5c5482220CaB3dB0d222Df095dA739DA277a18F'
    const emitActionEvent = new ethers.utils.Interface([
      'emitActionEvent(string actionName, bytes encodedReturnValues)',
    ])
    // const abiCoder = new ethers.utils.AbiCoder()
    // console.log('here1')
    // const encodedCallData = abiCoder.encode(
    //   ['uint256', 'address'],
    //   [testReturnValueA, testReturnValueB],
    // )
    // console.log('here2')
    // const emitActionEventCall = emitActionEvent.encodeFunctionData('emitActionEvent', [
    //   testActionName,
    //   encodedCallData,
    // ])
    //
    // const tx = eventEmitter.emitActionEvent(testActionName, encodedCallData, {
    //   gasLimit: 4000000,
    // })
    //
    // console.log('tx:', tx)

    // await expectRevert(/OpExecutor: illegal call/, tx)
  })
})
