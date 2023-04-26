import init from '@dma-common/utils/init'
import DS_PROXY_REGISTRY_ABI from '@oasisdex/abis/external/libs/DS/ds-proxy-registry.json'
import { ADDRESSES } from '@oasisdex/dma-deployments/addresses'
import { Network } from '@oasisdex/dma-deployments/types/network'
import { task } from 'hardhat/config'

const accountFactoryAddress = '0xF7B75183A2829843dB06266c114297dfbFaeE2b6'
const accountGuardAddress = '0xCe91349d2A4577BBd0fC91Fe6019600e047f2847'
task('transferProxies', 'Transfer DPM Account to another user')
  .addParam<string>('owner', 'Account from which to transfer')
  .addOptionalParam<string>('user', 'Address of the new owner')
  .setAction(async (taskArgs, hre) => {
    const config = await init(hre)

    const signer = config.provider.getSigner(0)
    const user = taskArgs.user || (await signer.getAddress())

    const owner = taskArgs.owner

    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [owner],
    })

    const ownerSigner = config.provider.getSigner(owner)

    const dsProxyRegistry = await hre.ethers.getContractAt(
      DS_PROXY_REGISTRY_ABI,
      ADDRESSES[Network.MAINNET].common.ProxyRegistry,
      signer,
    )

    const proxyAddress = await dsProxyRegistry.proxies(owner)

    const dsProxy = await hre.ethers.getContractAt('DSProxy', proxyAddress, ownerSigner)

    const changeDsProxyOwner = await dsProxy.setOwner(user)
    await changeDsProxyOwner.wait()

    console.log(`Proxy ${proxyAddress} transferred to ${user} from ${owner}`)

    const accountFactory = await hre.ethers.getContractAt(
      'AccountFactory',
      accountFactoryAddress,
      signer,
    )

    const accountGuard = await hre.ethers.getContractAt(
      'AccountGuard',
      accountGuardAddress,
      ownerSigner,
    )

    const filter = accountFactory.filters.AccountCreated(null, owner, null)
    const logs = await accountFactory.queryFilter(filter)

    for (const log of logs) {
      console.log(
        // @ts-ignore
        `Account ${log.args?.id} was created by ${log.args?.user}. Proxy Address: ${log.args?.proxy}`,
      )
      const dpm = log.args?.proxy
      const result = await accountGuard.changeOwner(user, dpm)

      await result.wait()
      console.log(`Account ${log.args?.vaultId} transferred to ${user}`)
    }
  })
