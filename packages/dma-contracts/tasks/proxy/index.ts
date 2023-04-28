import init from '@dma-common/utils/init'
import { getDsProxyRegistry, getOrCreateProxy } from '@dma-common/utils/proxy'
import { ADDRESSES } from '@dma-deployments/addresses'
import { Network } from '@dma-deployments/types/network'
import { task } from 'hardhat/config'

task('proxy', 'Create a proxy for the current account').setAction(async (taskArgs, hre) => {
  const config = await init(hre)
  const proxy = await getOrCreateProxy(
    await getDsProxyRegistry(
      config.signer,
      ADDRESSES[Network.MAINNET].mpa.core.DSProxyRegistry,
      hre,
    ),
    config.signer,
  )

  console.log(`Proxy Address for account: ${proxy.address}`)
})
