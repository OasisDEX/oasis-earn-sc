import { expect } from '@dma-common/test-utils'
import { RuntimeConfig } from '@dma-common/types/common'
import { createDeploy } from '@dma-common/utils/deploy'
import init from '@dma-common/utils/init'
import { Contract, utils } from 'ethers'

describe('OperationsRegistry', () => {
  let config: RuntimeConfig
  let operationsRegistry: Contract

  before(async () => {
    config = await init()
    const deploy = await createDeploy({ config, debug: true })
    const [instance] = await deploy('OperationsRegistry', [])
    operationsRegistry = instance
  })

  it('should add an operation', async () => {
    const name = 'DummyOperations'
    const hash = utils.formatBytes32String('hashedValue')
    await operationsRegistry.addOperation(name, hash)

    const retrievedName = await operationsRegistry.getOperationName(hash)
    expect(utils.parseBytes32String(retrievedName)).to.be.equal(name)
  })

  it('should revert with an error when operation does not exist', async () => {
    const hash = utils.formatBytes32String('nonExistent')
    try {
      await operationsRegistry.getOperationName(hash)
    } catch (e: any) {
      expect(e.errorName).to.be.equal('UnknownOperationHash')
      expect(e.errorArgs[0]).to.be.equal(hash)
    }
  })

  it('should revert with an error when the same operation name being added twice', async () => {
    const name = 'DummyOperations'
    const hash = utils.formatBytes32String('hashedValue')
    try {
      await operationsRegistry.addOperation(name, hash)
    } catch (e: any) {
      expect(e.reason).to.have.string('op-registry/operation-exists')
    }
  })

  it('should emit an event with the new operation being added', async () => {
    const name = 'DummyOperations2'
    const hash = utils.formatBytes32String('hashedValue2')
    const tx = await operationsRegistry.addOperation(name, hash)
    const receipt = await tx.wait()

    const operationAddedEvent = receipt.events[0]
    const [opNameFromEvent, opHashFromEvent] = operationAddedEvent.args
    expect(opNameFromEvent).to.be.equal(name)
    expect(opHashFromEvent).to.be.equal(hash)
  })
})
