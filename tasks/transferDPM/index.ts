import { task } from 'hardhat/config'

import { hardhatInit } from '../../helpers/init'

const accountFactoryAddress = '0xF7B75183A2829843dB06266c114297dfbFaeE2b6'
const accountGuardAddress = '0xCe91349d2A4577BBd0fC91Fe6019600e047f2847'
task('transferDPM', 'Transfer DPM Account to another user')
  .addParam<number>('id', 'ID of the DPM Account')
  .addOptionalParam<string>('user', 'User address')
  .setAction(async (taskArgs, hre) => {
    const config = await hardhatInit(hre)

    const signer = config.provider.getSigner(0)
    const user = taskArgs.user || (await signer.getAddress())

    const accountFactory = await config.ethers.getContractAt(
      'AccountFactory',
      accountFactoryAddress,
      signer,
    )

    const filter = accountFactory.filters.AccountCreated(null, null, taskArgs.id)
    const logs = await accountFactory.queryFilter(filter)

    console.log(
      `Account ${taskArgs?.id} was created by ${logs[0].args?.user}. Proxy Address: ${logs[0].args?.proxy}`,
    )

    const owner = logs[0].args?.user || ''
    const proxy = logs[0].args?.proxy || ''

    await config.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [owner],
    })

    const ownerSigner = config.provider.getSigner(owner)

    const accountGuard = await config.ethers.getContractAt(
      'AccountGuard',
      accountGuardAddress,
      ownerSigner,
    )

    const result = await accountGuard.changeOwner(user, proxy)

    await result.wait()

    console.log(`Account ${taskArgs.id} transferred to ${user}`)
  })
