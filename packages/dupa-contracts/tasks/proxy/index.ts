import { task } from 'hardhat/config'

import init from '../../../dupa-common/utils/init'
import { getOrCreateProxy } from '../../../dupa-common/utils/proxy/proxy'

task('proxy', 'Create a proxy for the current account').setAction(async (taskArgs, hre) => {
  const config = await init(hre)
  const proxyAddress = await getOrCreateProxy(config.signer)

  console.log(`Proxy Address for account: ${proxyAddress}`)
})
