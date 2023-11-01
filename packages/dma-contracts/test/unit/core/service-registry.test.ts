import { ContractNames } from '@deploy-configurations/constants'
import { ServiceRegistry } from '@deploy-configurations/utils/wrappers'
import { expect } from '@dma-common/test-utils'
import { createDeploy } from '@dma-common/utils/deploy'
import init from '@dma-common/utils/init'
import { utils } from 'ethers'

describe('Service Registry: Semantic Action Versioning | Unit', function () {
  let registry: ServiceRegistry
  const testContractNameWithVersion = 'PullToken_2'
  const testAddress = '0xB1E7D2241B0d81DbD43ddB12A9CBfaA3AF9645d1'
  let actualPullTokenHash: string

  before(async function () {
    const config = await init()
    const deploy = await createDeploy({ config })

    const [serviceRegistry] = await deploy('ServiceRegistry', [0])
    registry = new ServiceRegistry(serviceRegistry.address, config.signer)
    actualPullTokenHash = await registry.addEntry(
      testContractNameWithVersion as unknown as ContractNames,
      testAddress,
    )
  })

  it('should return the correct entry hash', async () => {
    const expectedEntryHash = utils.keccak256(utils.toUtf8Bytes(testContractNameWithVersion))
    expect(expectedEntryHash, actualPullTokenHash)
  })

  it('should return the correct service address', async () => {
    const actualServiceAddress = await registry.getServiceAddress(
      testContractNameWithVersion as unknown as ContractNames,
    )
    expect(testAddress, actualServiceAddress)
  })

  it('should return the same hash that was created on entry', async () => {
    const returnedHashAmount = await registry.getEntryHash(
      testContractNameWithVersion as unknown as ContractNames,
    )
    expect(returnedHashAmount, actualPullTokenHash)
  })
})
