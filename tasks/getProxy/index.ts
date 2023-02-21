import { ethers, Signer } from 'ethers'
import { task } from 'hardhat/config'
// import mainnet from '../addresses/mainnet.json'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

function getStorageSlotForMapping(slot: number, key: string) {
  return ethers.BigNumber.from(ethers.utils.solidityKeccak256(['uint256', 'uint256'], [key, slot]))
}

async function impersonate(
  hre: HardhatRuntimeEnvironment,
  toImpersonate: string,
  action: (signer: Signer) => Promise<void>,
) {
  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [toImpersonate],
  })
  await hre.network.provider.send('hardhat_setBalance', [toImpersonate, '0xDE0B6B3A7640000']) // 1 eth
  const impersonatedSigner = await hre.ethers.getSigner(toImpersonate)

  await action(impersonatedSigner)

  await hre.network.provider.request({
    method: 'hardhat_stopImpersonatingAccount',
    params: [toImpersonate],
  })
}

task('get-proxy', 'Impersonates account and take their proxy')
  .addParam('proxy', 'A proxy address to transfer')
  .addOptionalParam('to', '[Optional] address to transfer proxy to, default address 0')
  .setAction(async (taskArgs, hre) => {
    const dssProxyInterface = [
      'function setOwner(address owner_)',
      'function owner() public view returns (address)',
    ]
    const proxyRegistryInterface = ['function proxies(address) public view returns (address)']

    const signer = hre.ethers.provider.getSigner(0)
    const newProxyOwner = taskArgs.to || (await signer.getAddress())

    console.log(`Proxy address:     ${taskArgs.proxy}`)
    console.log(`New owner address: ${newProxyOwner}`)

    const dssProxy = new hre.ethers.Contract(taskArgs.proxy, dssProxyInterface, signer)
    const proxyRegistry = new hre.ethers.Contract(
      mainnet.PROXY_REGISTRY,
      proxyRegistryInterface,
      signer,
    )

    const newOwnerExistingProxy = await proxyRegistry.proxies(newProxyOwner)

    if (newOwnerExistingProxy === taskArgs.proxy) {
      console.log(`User is already a owner of the proxy`)
      return
    }

    const proxyOwner = await dssProxy.owner()

    await impersonate(hre, proxyOwner, async proxyOwnerSigner => {
      const dssProxyImpersonated = new hre.ethers.Contract(
        taskArgs.proxy,
        dssProxyInterface,
        proxyOwnerSigner,
      )
      await dssProxyImpersonated.setOwner(newProxyOwner)
      console.log(`Proxy transferred to ${await dssProxyImpersonated.owner()}`)
    })

    console.log('Updating proxy registry...')

    const storageSlot = getStorageSlotForMapping(0, newProxyOwner)
    await hre.network.provider.send('hardhat_setStorageAt', [
      mainnet.PROXY_REGISTRY,
      storageSlot.toHexString(),
      ethers.utils.hexZeroPad(taskArgs.proxy, 32),
    ])
    console.log(
      `Proxy registry mapping updated: user(${newProxyOwner}) => ${await proxyRegistry.proxies(
        newProxyOwner,
      )}`,
    )
  })

export {}
