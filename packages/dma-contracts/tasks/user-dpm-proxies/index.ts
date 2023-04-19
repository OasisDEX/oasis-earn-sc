import init from '@dma-common/utils/init'
import { task } from 'hardhat/config'

import accountFactoryAbi from '../../../abis/external/libs/DPM/account-factory.json'

const accountFactoryAddress = '0xA7d3eE7cF44a45f8f47efdF648fb9eB08bcfF465'
task('userDpmProxies', 'Get DPM Accounts created by User')
  .addOptionalParam<string>('user', 'User address')
  .setAction(async (taskArgs, hre) => {
    const config = await init(hre)

    const signer = config.provider.getSigner(0)
    const user = taskArgs.user || (await signer.getAddress())

    console.log(`Checking for DPM Accounts created by ${user}`)

    const accountFactory = await hre.ethers.getContractAt(
      accountFactoryAbi,
      accountFactoryAddress,
      signer,
    )
    const filter = accountFactory.filters.AccountCreated(null, user, null)

    const logs = await accountFactory.queryFilter(filter)

    logs
      .map(log => accountFactory.interface.parseLog(log))
      .map(log => log.args)
      .forEach(log => {
        console.log(`DPM Account created by ${user}:`, log)
      })
  })
