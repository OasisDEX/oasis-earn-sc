import { task } from 'hardhat/config'

import init from '../../helpers/init'
import { getOrCreateProxy } from '../../helpers/proxy'

task('proxy', 'Create a proxy for the current account').setAction(async (taskArgs, hre) => {
  const config = await init(hre)
  const proxyAddress = await getOrCreateProxy(config.signer)

  console.log(`Proxy Address for account: ${proxyAddress}`)
})
