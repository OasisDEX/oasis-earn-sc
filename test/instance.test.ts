import { ContractNames } from '@oasisdex/oasis-actions/src/helpers/constants'
import { expect } from 'chai'
import { utils } from 'ethers'

import { createDeploy, createInstance } from '../helpers/deploy'
import init from '../helpers/init'
import { ServiceRegistry } from '../helpers/serviceRegistry'
import { deployMainnetSystem } from './instantiateSystem'

describe('Instance test', function () {
  before(async function () {
    const config = await init()

    const system = await deployMainnetSystem(config, true, true)

    console.log('system', system );
    
    // const deploy = await createDeploy({ config })
    // const instance = await createInstance({config})
  
    // const [registry] = await instance('ServiceRegistry', '0x9b4Ae7b164d195df9C4Da5d08Be88b2848b2EaDA', [0])

    // console.log('SR ', registry );
    
  })

  it('should...', async () => {
    console.log('TEST1', );
    
  })

  // it('should return the correct service address', async () => {
  //   const actualServiceAddress = await registry.getServiceAddress(
  //     testContractNameWithVersion as unknown as ContractNames,
  //   )
  //   expect(testAddress, actualServiceAddress)
  // })

  // it('should return the same hash that was created on entry', async () => {
  //   const returnedHashAmount = await registry.getEntryHash(
  //     testContractNameWithVersion as unknown as ContractNames,
  //   )
  //   expect(returnedHashAmount, actualPullTokenHash)
  // })
})
