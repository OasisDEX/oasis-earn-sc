import { ADDRESSES } from '@oasisdex/addresses'
import init from '@oasisdex/dma-common/utils/init'
import { getDsProxyRegistry } from '@oasisdex/dma-common/utils/proxy'
import { task } from 'hardhat/config'

import { getOrCreateProxy } from '../../../dma-common/utils/proxy/proxy'

task('proxy', 'Create a proxy for the current account').setAction(async (taskArgs, hre) => {
  const config = await init(hre)
  const proxy = await getOrCreateProxy(
    await getDsProxyRegistry(config.signer, ADDRESSES[Network.MAINNET].proxyRegistry, hre),
    config.signer,
  )

  console.log(`Proxy Address for account: ${proxy.address}`)
})
